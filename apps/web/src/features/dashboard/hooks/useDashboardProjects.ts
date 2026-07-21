import { useCallback, useEffect, useRef, useState } from "react";
import {
  readDashboardBrowserCacheSection,
  writeDashboardBrowserCacheSection,
} from "@/app-shell/dashboard-browser-cache";
import {
  notifyActionFailure,
  runNotifiedServerAction,
} from "@/app-shell/action-notifications";
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
import { projectTaskProgressText } from "@/features/projects/project-progress";
import type {
  DashboardMessages,
  NotificationMessages,
  ProjectMessages,
} from "@/messages/app-messages";
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
  userId: string,
  showErrorNotification: (message: string, title?: string) => void,
  messages?: DashboardMessages["notifications"],
  resultMessages?: ProjectMessages["results"],
  notificationMessages?: NotificationMessages,
) {
  const [tasks, setTasks] = useState<ProjectDashboardData["tasks"]>([]);
  const [projects, setProjects] = useState<ProjectView[]>([]);
  const [projectLoading, setProjectLoading] = useState(true);
  const [projectCacheReady, setProjectCacheReady] = useState(false);
  const [projectActionPending, setProjectActionPending] = useState(false);
  const [pendingProjectPinIds, setPendingProjectPinIds] = useState<string[]>(
    [],
  );
  const taskStatusRequestChains = useRef(new Map<string, Promise<void>>());
  const taskStatusRequestVersions = useRef(new Map<string, number>());

  const applyProjectData = useCallback((data: ProjectDashboardData) => {
    setTasks(data.tasks);
    setProjects(data.projects);
    setProjectLoading(false);
    setProjectCacheReady(true);
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const cachedData = readDashboardBrowserCacheSection(userId, "projects");

      setTasks(cachedData?.tasks ?? []);
      setProjects(cachedData?.projects ?? []);
      setProjectLoading(cachedData === null);
      setProjectCacheReady(cachedData !== null);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [userId]);

  useEffect(() => {
    if (!projectCacheReady) {
      return;
    }

    writeDashboardBrowserCacheSection(userId, "projects", {
      tasks,
      projects,
    });
  }, [projectCacheReady, projects, tasks, userId]);

  const refreshProjectData = useCallback(async () => {
    const actionResult = await runNotifiedServerAction({
      action: getProjectDashboardData,
      messages: notificationMessages,
      showErrorNotification,
    });

    if (!actionResult.ok) {
      setProjectLoading(false);
      return;
    }

    const result = actionResult.value;

    if (!result.ok) {
      notifyActionFailure({
        result,
        resultMessages,
        fallbackTitle: messages?.projectsUnavailable ?? "Projects unavailable",
        notificationMessages,
        showErrorNotification,
      });
      setProjectLoading(false);
      return;
    }

    applyProjectData(result.data);
  }, [
    applyProjectData,
    messages,
    notificationMessages,
    resultMessages,
    showErrorNotification,
  ]);

  async function runProjectManagementAction(
    action: ProjectDataAction,
    failureTitle: string,
  ) {
    setProjectActionPending(true);

    try {
      const actionResult = await runNotifiedServerAction({
        action,
        messages: notificationMessages,
        showErrorNotification,
      });

      if (!actionResult.ok) {
        return false;
      }

      const result = actionResult.value;

      if (!result.ok) {
        notifyActionFailure({
          result,
          resultMessages,
          fallbackTitle: failureTitle,
          notificationMessages,
          showErrorNotification,
        });
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
      const actionResult = await runNotifiedServerAction({
        action,
        messages: notificationMessages,
        showErrorNotification,
      });

      if (!actionResult.ok) {
        return;
      }

      const result = actionResult.value;

      if (!result.ok) {
        notifyActionFailure({
          result,
          resultMessages,
          fallbackTitle: failureTitle,
          notificationMessages,
          showErrorNotification,
        });
        return;
      }

      applyProjectData(result.data);
    } finally {
      setPendingProjectPinIds((current) => removePendingId(current, projectId));
    }
  }

  function updateTaskFromDashboard(
    taskId: string,
    status: TaskStatus,
  ) {
    updateTaskStatusOptimistically(taskId, status, {
      removeDoneDashboardTask: false,
    });
  }

  function updateTaskFromPage(
    taskId: string,
    status: TaskStatus,
  ) {
    updateTaskStatusOptimistically(taskId, status, {
      removeDoneDashboardTask: true,
    });
  }

  function updateTaskStatusOptimistically(
    taskId: string,
    status: TaskStatus,
    options: { removeDoneDashboardTask: boolean },
  ) {
    let previousTasks: ProjectDashboardData["tasks"] = [];
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
        const actionResult = await runNotifiedServerAction({
          action: () => updateProjectTaskStatus(taskId, status),
          messages: notificationMessages,
          showErrorNotification,
        });

        if (!actionResult.ok) {
          if (
            taskStatusRequestVersions.current.get(taskId) === requestVersion
          ) {
            setTasks((current) =>
              restoreTaskSnapshot(current, previousTasks, taskId),
            );
            setProjects(previousProjects);
          }
          return;
        }

        const result = actionResult.value;

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
        notifyActionFailure({
          result,
          resultMessages,
          fallbackTitle: messages?.taskUpdateFailed ?? "Task update failed",
          notificationMessages,
          showErrorNotification,
        });
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
      runProjectManagementAction(
        () => saveProject(input),
        messages?.projectSaveFailed ?? "Project save failed",
      ),
    archiveProjectFromPage: (projectId: string) =>
      runProjectManagementAction(
        () => archiveProject(projectId),
        messages?.projectArchiveFailed ?? "Project archive failed",
      ),
    archiveMilestoneFromPage: (milestoneId: string) =>
      runProjectManagementAction(
        () => archiveMilestone(milestoneId),
        messages?.milestoneDeleteFailed ?? "Milestone delete failed",
      ),
    archiveTaskFromPage: (taskId: string) =>
      runProjectManagementAction(
        () => archiveProjectTask(taskId),
        messages?.taskDeleteFailed ?? "Task delete failed",
      ),
    saveMilestoneFromPage: (input: MilestoneInput) =>
      runProjectManagementAction(
        () => saveMilestone(input),
        messages?.milestoneSaveFailed ?? "Milestone save failed",
      ),
    saveTaskFromPage: (input: ProjectTaskInput) =>
      runProjectManagementAction(
        () => saveProjectTask(input),
        messages?.taskSaveFailed ?? "Task save failed",
      ),
    statusTaskFromPage: updateTaskFromPage,
    pinProjectFromPage: (projectId: string) =>
      updateProjectPinFromPage(
        projectId,
        () => pinProject(projectId),
        messages?.projectPinFailed ?? "Project pin failed",
      ),
    unpinProjectFromPage: (projectId: string) =>
      updateProjectPinFromPage(
        projectId,
        () => unpinProject(projectId),
        messages?.projectUnpinFailed ?? "Project unpin failed",
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
  status: TaskStatus,
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

  return projectTaskProgressText(doneCount, tasks.length);
}
