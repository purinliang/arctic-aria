import { useCallback, useRef, useState } from "react";
import {
  archiveMilestone,
  archiveProject,
  archiveProjectTask,
  getProjectDashboardData,
  pinProject,
  saveMilestone,
  saveProject,
  saveProjectTask,
  unpinProject,
  updateProjectTaskStatus,
  type MilestoneInput,
  type ProjectActionResult,
  type ProjectDashboardData,
  type ProjectInput,
  type ProjectTaskInput,
  type ProjectView,
} from "@/features/projects/actions";
import {
  applyDashboardTaskStatus,
  applyOptimisticTaskStatus,
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
  const [projectActionPending, setProjectActionPending] = useState(false);
  const [pendingProjectPinIds, setPendingProjectPinIds] = useState<string[]>(
    [],
  );
  const taskStatusRequestChains = useRef(new Map<string, Promise<void>>());
  const taskStatusRequestVersions = useRef(new Map<string, number>());

  const applyProjectData = useCallback((data: ProjectDashboardData) => {
    setTasks(data.tasks);
    setProjects(data.projects);
  }, []);

  const refreshProjectData = useCallback(async () => {
    const result = await getProjectDashboardData();

    if (!result.ok) {
      showErrorNotification(result.message, "Projects unavailable");
      setTasks([]);
      setProjects([]);
      setProjectLoading(false);
      return;
    }

    applyProjectData(result.data);
    setProjectLoading(false);
  }, [applyProjectData, showErrorNotification]);

  async function runProjectManagementAction(
    action: ProjectDataAction,
    failureTitle: string,
  ) {
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

  async function updateProjectPinFromPage(
    projectId: string,
    action: ProjectDataAction,
    failureTitle: string,
  ) {
    setPendingProjectPinIds((current) => addPendingId(current, projectId));

    try {
      const result = await action();

      if (!result.ok) {
        showErrorNotification(result.message, failureTitle);
        return;
      }

      applyProjectData(result.data);
    } finally {
      setPendingProjectPinIds((current) => removePendingId(current, projectId));
    }
  }

  function updateTaskFromDashboard(
    taskId: string,
    status: Exclude<TaskStatus, "archived">,
  ) {
    updateTaskStatusOptimistically(taskId, status, {
      removeDoneDashboardTask: false,
    });
  }

  function updateTaskFromPage(
    taskId: string,
    status: Exclude<TaskStatus, "archived">,
  ) {
    updateTaskStatusOptimistically(taskId, status, {
      removeDoneDashboardTask: true,
    });
  }

  function updateTaskStatusOptimistically(
    taskId: string,
    status: Exclude<TaskStatus, "archived">,
    options: { removeDoneDashboardTask: boolean },
  ) {
    let previousTasks: Task[] = [];
    let previousProjects: ProjectView[] = [];
    const requestVersion =
      (taskStatusRequestVersions.current.get(taskId) ?? 0) + 1;

    taskStatusRequestVersions.current.set(taskId, requestVersion);

    setTasks((current) => {
      previousTasks = current;
      const updated = options.removeDoneDashboardTask
        ? applyOptimisticTaskStatus(current, taskId, status)
        : applyDashboardTaskStatus(current, taskId, status);

      return options.removeDoneDashboardTask && status === "done"
        ? updated.filter((task) => task.id !== taskId)
        : updated;
    });
    setProjects((current) => {
      previousProjects = current;
      return applyOptimisticProjectTaskStatus(current, taskId, status);
    });

    const previousRequest =
      taskStatusRequestChains.current.get(taskId) ?? Promise.resolve();
    const request = previousRequest
      .catch(() => undefined)
      .then(async () => {
        const result = await updateProjectTaskStatus(taskId, status);

        if (result.ok) {
          return;
        }

        if (taskStatusRequestVersions.current.get(taskId) !== requestVersion) {
          return;
        }

        setTasks((current) =>
          restoreTaskSnapshot(current, previousTasks, taskId),
        );
        setProjects(previousProjects);
        showErrorNotification(result.message);
      });

    taskStatusRequestChains.current.set(taskId, request);
    void request.finally(() => {
      if (taskStatusRequestChains.current.get(taskId) === request) {
        taskStatusRequestChains.current.delete(taskId);
      }
    });
  }

  return {
    tasks,
    projects,
    projectLoading,
    projectActionPending,
    pendingProjectPinIds,
    refreshProjectData,
    updateTaskFromDashboard,
    saveProjectFromPage: (input: ProjectInput) =>
      runProjectManagementAction(() => saveProject(input), "Project save failed"),
    archiveProjectFromPage: (projectId: string) =>
      runProjectManagementAction(
        () => archiveProject(projectId),
        "Project archive failed",
      ),
    archiveMilestoneFromPage: (milestoneId: string) =>
      runProjectManagementAction(
        () => archiveMilestone(milestoneId),
        "Milestone delete failed",
      ),
    archiveTaskFromPage: (taskId: string) =>
      runProjectManagementAction(
        () => archiveProjectTask(taskId),
        "Task delete failed",
      ),
    saveMilestoneFromPage: (input: MilestoneInput) =>
      runProjectManagementAction(
        () => saveMilestone(input),
        "Milestone save failed",
      ),
    saveTaskFromPage: (input: ProjectTaskInput) =>
      runProjectManagementAction(() => saveProjectTask(input), "Task save failed"),
    statusTaskFromPage: updateTaskFromPage,
    pinProjectFromPage: (projectId: string) =>
      updateProjectPinFromPage(
        projectId,
        () => pinProject(projectId),
        "Project pin failed",
      ),
    unpinProjectFromPage: (projectId: string) =>
      updateProjectPinFromPage(
        projectId,
        () => unpinProject(projectId),
        "Project unpin failed",
      ),
  };
}

function addPendingId(ids: string[], id: string) {
  return ids.includes(id) ? ids : [...ids, id];
}

function removePendingId(ids: string[], id: string) {
  return ids.filter((currentId) => currentId !== id);
}

function applyOptimisticProjectTaskStatus(
  projects: ProjectView[],
  taskId: string,
  status: Exclude<TaskStatus, "archived">,
) {
  return projects.map((project) => {
    const projectTasks = project.tasks.map((task) =>
      task.id === taskId ? { ...task, status } : task,
    );
    const milestones = project.milestones.map((milestone) => {
      const tasks = projectTasks.filter(
        (task) => task.milestoneId === milestone.id,
      ).map((task) =>
        task.id === taskId ? { ...task, status } : task,
      );

      return {
        ...milestone,
        tasks,
        progressText: taskProgressText(tasks),
      };
    });

    return {
      ...project,
      tasks: projectTasks,
      milestones,
      progressText: taskProgressText(projectTasks),
    };
  });
}

function taskProgressText(tasks: Task[]) {
  const doneCount = tasks.filter((task) => task.status === "done").length;

  return `${doneCount} of ${tasks.length} tasks done`;
}
