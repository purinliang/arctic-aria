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
import { applyOptimisticTaskStatus } from "../optimistic-updates";
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
      setProjectLoading(false);
      return;
    }

    applyProjectData(result.data);
    setProjectLoading(false);
  }, [applyProjectData]);

  async function runProjectAction(
    action: ProjectDataAction,
    nextExpandedTaskId: string | null,
    onFailure?: () => void,
  ) {
    setProjectMessage(null);
    setProjectActionPending(true);

    try {
      const result = await action();

      if (!result.ok) {
        onFailure?.();
        showErrorNotification(result.message);
        return;
      }

      applyProjectData(result.data, nextExpandedTaskId);
    } finally {
      setProjectActionPending(false);
    }
  }

  async function runProjectManagementAction(action: ProjectDataAction) {
    setProjectMessage(null);
    setProjectActionPending(true);

    try {
      const result = await action();

      if (!result.ok) {
        setProjectMessage(result.message);
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
    const previousTasks = tasks;

    setExpandedTaskId(null);
    setTasks((current) => applyOptimisticTaskStatus(current, taskId, status));
    void runProjectAction(
      () =>
        status === "done"
          ? completeProjectTask(taskId)
          : status === "blocked"
            ? blockProjectTask(taskId)
            : status === "skipped"
              ? skipProjectTask(taskId)
              : updateProjectTaskStatus(taskId, status),
      null,
      () => setTasks(previousTasks),
    );
  }

  function toggleSubtask(subtaskId: string, done: boolean) {
    void runProjectAction(
      () => updateProjectSubtaskDone(subtaskId, !done),
      expandedTaskId,
    );
  }

  return {
    tasks,
    projects,
    projectLoading,
    projectMessage,
    projectActionPending,
    expandedTaskId,
    setExpandedTaskId,
    refreshProjectData,
    updateTaskFromDashboard,
    toggleSubtask,
    saveProjectFromPage: (input: ProjectInput) =>
      runProjectManagementAction(() => saveProject(input)),
    archiveProjectFromPage: (projectId: string) =>
      runProjectManagementAction(() => archiveProject(projectId)),
    saveMilestoneFromPage: (input: MilestoneInput) =>
      runProjectManagementAction(() => saveMilestone(input)),
    saveTaskFromPage: (input: ProjectTaskInput) =>
      runProjectManagementAction(() => saveProjectTask(input)),
    statusTaskFromPage: (
      taskId: string,
      status: Exclude<TaskStatus, "archived">,
    ) => runProjectManagementAction(() => updateProjectTaskStatus(taskId, status)),
    reopenTaskFromPage: (taskId: string) =>
      runProjectManagementAction(() => reopenProjectTask(taskId)),
    clearProjectMessage: () => setProjectMessage(null),
  };
}
