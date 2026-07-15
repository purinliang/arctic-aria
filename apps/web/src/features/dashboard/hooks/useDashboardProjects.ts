import { useCallback, useState } from "react";
import {
  archiveProject,
  blockProjectTask,
  completeProjectTask,
  getProjectDashboardData,
  reopenProjectTask,
  saveMilestone,
  saveProject,
  saveProjectTask,
  skipProjectTask,
  updateProjectSubtaskDone,
  updateProjectTaskStatus,
  type MilestoneInput,
  type ProjectActionResult,
  type ProjectDashboardData,
  type ProjectInput,
  type ProjectTaskInput,
  type ProjectView,
} from "@/features/projects/actions";
import {
  applyOptimisticSubtaskDone,
  applyOptimisticTaskStatus,
  restoreSubtaskSnapshot,
  restoreTaskSnapshot,
} from "../optimistic-updates";
import type { Task, TaskStatus } from "../types";

type ProjectDataAction = () => Promise<
  ProjectActionResult<ProjectDashboardData>
>;

export function useDashboardProjects(
  showErrorNotification: (message: string, title?: string) => void,
) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<ProjectView[]>([]);
  const [projectLoading, setProjectLoading] = useState(true);
  const [projectMessage, setProjectMessage] = useState<string | null>(null);
  const [projectActionPending, setProjectActionPending] = useState(false);
  const [pendingTaskIds, setPendingTaskIds] = useState<string[]>([]);
  const [pendingSubtaskIds, setPendingSubtaskIds] = useState<string[]>([]);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  const applyProjectData = useCallback(
    (data: ProjectDashboardData, nextExpandedTaskId?: string | null) => {
      setTasks(data.tasks);
      setProjects(data.projects);
      setExpandedTaskId((current) => {
        if (nextExpandedTaskId !== undefined) {
          return nextExpandedTaskId;
        }

        if (current && data.tasks.some((task) => task.id === current)) {
          return current;
        }

        return data.tasks[0]?.id ?? null;
      });
    },
    [],
  );

  const refreshProjectData = useCallback(async () => {
    const result = await getProjectDashboardData();

    if (!result.ok) {
      setProjectMessage(result.message);
      setTasks([]);
      setProjects([]);
      setExpandedTaskId(null);
      setPendingTaskIds([]);
      setPendingSubtaskIds([]);
      setProjectLoading(false);
      return;
    }

    applyProjectData(result.data);
    setProjectLoading(false);
  }, [applyProjectData]);

  async function runDashboardProjectAction(
    action: ProjectDataAction,
    onFailure?: () => void,
  ) {
    setProjectMessage(null);

    const result = await action();

    if (!result.ok) {
      onFailure?.();
      showErrorNotification(result.message);
      return;
    }
  }

  async function runProjectManagementAction(
    action: ProjectDataAction,
    failureTitle: string,
  ) {
    setProjectMessage(null);
    setProjectActionPending(true);

    try {
      const result = await action();

      if (!result.ok) {
        showErrorNotification(result.message, failureTitle);
        return false;
      }

      applyProjectData(result.data);
      return true;
    } finally {
      setProjectActionPending(false);
    }
  }

  function updateTaskFromDashboard(
    taskId: string,
    status: Exclude<TaskStatus, "archived">,
  ) {
    let previousTasks: Task[] = [];

    setExpandedTaskId(null);
    setPendingTaskIds((current) => addPendingId(current, taskId));
    setTasks((current) => {
      previousTasks = current;
      const updated = applyOptimisticTaskStatus(current, taskId, status);

      return status === "done"
        ? updated.filter((task) => task.id !== taskId)
        : updated;
    });
    void runDashboardProjectAction(
      () => dashboardTaskStatusAction(taskId, status),
      () =>
        setTasks((current) =>
          restoreTaskSnapshot(current, previousTasks, taskId),
        ),
    ).finally(() =>
      setPendingTaskIds((current) => removePendingId(current, taskId)),
    );
  }

  function toggleSubtask(subtaskId: string, done: boolean) {
    let previousTasks: Task[] = [];

    setPendingSubtaskIds((current) => addPendingId(current, subtaskId));
    setTasks((current) => {
      previousTasks = current;
      return applyOptimisticSubtaskDone(current, subtaskId, !done);
    });
    void runDashboardProjectAction(
      () => updateProjectSubtaskDone(subtaskId, !done),
      () =>
        setTasks((current) =>
          restoreSubtaskSnapshot(current, previousTasks, subtaskId),
        ),
    ).finally(() =>
      setPendingSubtaskIds((current) => removePendingId(current, subtaskId)),
    );
  }

  return {
    tasks,
    projects,
    projectLoading,
    projectMessage,
    projectActionPending,
    pendingTaskIds,
    pendingSubtaskIds,
    expandedTaskId,
    setExpandedTaskId,
    refreshProjectData,
    updateTaskFromDashboard,
    toggleSubtask,
    saveProjectFromPage: (input: ProjectInput) =>
      runProjectManagementAction(() => saveProject(input), "Project save failed"),
    archiveProjectFromPage: (projectId: string) =>
      runProjectManagementAction(
        () => archiveProject(projectId),
        "Project archive failed",
      ),
    saveMilestoneFromPage: (input: MilestoneInput) =>
      runProjectManagementAction(
        () => saveMilestone(input),
        "Milestone save failed",
      ),
    saveTaskFromPage: (input: ProjectTaskInput) =>
      runProjectManagementAction(() => saveProjectTask(input), "Task save failed"),
    statusTaskFromPage: (
      taskId: string,
      status: Exclude<TaskStatus, "archived">,
    ) =>
      runProjectManagementAction(
        () => updateProjectTaskStatus(taskId, status),
        "Task update failed",
      ),
    toggleSubtaskFromPage: (subtaskId: string, done: boolean) =>
      runProjectManagementAction(
        () => updateProjectSubtaskDone(subtaskId, !done),
        "Subtask update failed",
      ),
    reopenTaskFromPage: (taskId: string) =>
      runProjectManagementAction(() => reopenProjectTask(taskId), "Task reopen failed"),
    clearProjectMessage: () => setProjectMessage(null),
  };
}

function dashboardTaskStatusAction(
  taskId: string,
  status: Exclude<TaskStatus, "archived">,
) {
  if (status === "done") {
    return completeProjectTask(taskId);
  }

  if (status === "blocked") {
    return blockProjectTask(taskId);
  }

  if (status === "skipped") {
    return skipProjectTask(taskId);
  }

  return updateProjectTaskStatus(taskId, status);
}

function addPendingId(ids: string[], id: string) {
  return ids.includes(id) ? ids : [...ids, id];
}

function removePendingId(ids: string[], id: string) {
  return ids.filter((currentId) => currentId !== id);
}
