import { useCallback, useState } from "react";
import {
  archiveTask,
  blockTask,
  completeTask,
  deleteTask,
  getTaskDashboardData,
  reopenTask,
  saveTask,
  skipTask,
  updateTaskProgress,
  updateTaskStatus,
  type TaskActionResult,
  type TaskDashboardData,
  type TaskInput,
  type TaskProgressInput,
} from "@/features/tasks/actions";
import { applyOptimisticTaskStatus } from "../optimistic-updates";
import type { Task, TaskStatus } from "../types";

type TaskDataAction = () => Promise<TaskActionResult<TaskDashboardData>>;

export function useDashboardTasks(
  showErrorNotification: (message: string, title?: string) => void,
) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskRecords, setTaskRecords] = useState<Task[]>([]);
  const [taskLoading, setTaskLoading] = useState(true);
  const [taskMessage, setTaskMessage] = useState<string | null>(null);
  const [taskActionPending, setTaskActionPending] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>("task-1");

  const applyTaskData = useCallback(
    (data: TaskDashboardData, nextExpandedTaskId?: string | null) => {
      setTasks(data.tasks);
      setTaskRecords(data.taskRecords);
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

  const refreshTaskData = useCallback(async () => {
    const result = await getTaskDashboardData();

    if (!result.ok) {
      setTaskMessage(result.message);
      setTasks([]);
      setTaskRecords([]);
      setExpandedTaskId(null);
      setTaskLoading(false);
      return;
    }

    applyTaskData(result.data);
    setTaskLoading(false);
  }, [applyTaskData]);

  async function runTaskAction(
    action: TaskDataAction,
    nextExpandedTaskId: string | null,
    onFailure?: () => void,
  ) {
    setTaskMessage(null);
    setTaskActionPending(true);

    try {
      const result = await action();

      if (!result.ok) {
        onFailure?.();
        showErrorNotification(result.message);
        return;
      }

      applyTaskData(result.data, nextExpandedTaskId);
    } finally {
      setTaskActionPending(false);
    }
  }

  async function runTaskManagementAction(action: TaskDataAction) {
    setTaskMessage(null);
    setTaskActionPending(true);

    try {
      const result = await action();

      if (!result.ok) {
        setTaskMessage(result.message);
        return false;
      }

      applyTaskData(result.data);
      return true;
    } finally {
      setTaskActionPending(false);
    }
  }

  function updateTaskFromDashboard(
    taskId: string,
    status: Exclude<TaskStatus, "archived">,
  ) {
    const previousTasks = tasks;
    const previousTaskRecords = taskRecords;

    setExpandedTaskId(null);
    setTasks((current) => applyOptimisticTaskStatus(current, taskId, status));
    setTaskRecords((current) =>
      applyOptimisticTaskStatus(current, taskId, status),
    );
    void runTaskAction(
      () =>
        status === "done"
          ? completeTask(taskId)
          : status === "blocked"
            ? blockTask(taskId)
            : status === "skipped"
              ? skipTask(taskId)
              : updateTaskStatus(taskId, status),
      null,
      () => {
        setTasks(previousTasks);
        setTaskRecords(previousTaskRecords);
      },
    );
  }

  function toggleSubtask(subtaskId: string, done: boolean) {
    void runTaskAction(
      () => (done ? reopenTask(subtaskId) : completeTask(subtaskId)),
      expandedTaskId,
    );
  }

  return {
    tasks,
    taskRecords,
    taskLoading,
    taskMessage,
    taskActionPending,
    expandedTaskId,
    setExpandedTaskId,
    refreshTaskData,
    updateTaskFromDashboard,
    toggleSubtask,
    saveTaskFromPage: (input: TaskInput) =>
      runTaskManagementAction(() => saveTask(input)),
    deleteTaskFromPage: (taskId: string) =>
      runTaskManagementAction(() => deleteTask(taskId)),
    archiveTaskFromPage: (taskId: string) =>
      runTaskManagementAction(() => archiveTask(taskId)),
    progressTaskFromPage: (input: TaskProgressInput) =>
      runTaskManagementAction(() => updateTaskProgress(input)),
    statusTaskFromPage: (
      taskId: string,
      status: Exclude<TaskStatus, "archived">,
    ) => runTaskManagementAction(() => updateTaskStatus(taskId, status)),
    clearTaskMessage: () => setTaskMessage(null),
  };
}
