import { PostgresTaskRepository } from "./postgres-task-repository.ts";
import type {
  SaveTaskInput,
  TaskRepository,
  TaskStatus,
} from "./task-repository.ts";

export type TaskServiceOptions = {
  tasks?: TaskRepository;
  now?: () => Date;
};

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function createTaskService(options: TaskServiceOptions = {}) {
  const tasks = options.tasks ?? new PostgresTaskRepository();
  const now = options.now ?? (() => new Date());

  return {
    async listTasks(userId: string) {
      return tasks.listTaskTree(userId);
    },

    async listDashboardTasks(userId: string) {
      return tasks.listDashboardTaskTree(userId, dateKey(now()));
    },

    async saveTask(
      userId: string,
      input: Omit<SaveTaskInput, "userId" | "occurredAt">,
    ) {
      return tasks.saveTask({
        ...input,
        userId,
        occurredAt: now(),
      });
    },

    async deleteTask(userId: string, taskId: string) {
      return tasks.deleteTask({ userId, taskId });
    },

    async archiveTask(userId: string, taskId: string) {
      return tasks.archiveTask({
        userId,
        taskId,
        occurredAt: now(),
      });
    },

    async updateTaskStatus(
      userId: string,
      taskId: string,
      status: Exclude<TaskStatus, "archived">,
    ) {
      return tasks.updateTaskStatus({
        userId,
        taskId,
        status,
        occurredAt: now(),
      });
    },

    async updateTaskProgress(
      userId: string,
      taskId: string,
      weight: number,
      completedWeight: number,
    ) {
      return tasks.updateTaskProgress({
        userId,
        taskId,
        weight,
        completedWeight,
        occurredAt: now(),
      });
    },
  };
}

export const taskService = createTaskService();
