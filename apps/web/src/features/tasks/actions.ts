"use server";

import { getCurrentUser } from "@/features/auth/actions";
import {
  loadTaskDashboardData,
  unauthorizedResult,
  validateProgressInput,
  validateTaskInput,
} from "./task-action-helpers";
import { taskService } from "./server/task-service";
import type { TaskStatus } from "./server/task-repository";
import type {
  TaskActionResult,
  TaskDashboardData,
  TaskInput,
  TaskProgressInput,
} from "./task-action-helpers";

export type {
  TaskActionResult,
  TaskChildInput,
  TaskDashboardData,
  TaskInput,
  TaskProgressInput,
} from "./task-action-helpers";

async function withTaskData(
  action: (userId: string) => Promise<boolean>,
  notFoundMessage: string,
): Promise<TaskActionResult<TaskDashboardData>> {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorizedResult();
  }

  const ok = await action(user.id);

  if (!ok) {
    return { ok: false, message: notFoundMessage };
  }

  return {
    ok: true,
    data: await loadTaskDashboardData(user.id),
  };
}

export async function getTaskDashboardData(): Promise<
  TaskActionResult<TaskDashboardData>
> {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorizedResult();
  }

  return {
    ok: true,
    data: await loadTaskDashboardData(user.id),
  };
}

export async function saveTask(
  input: TaskInput,
): Promise<TaskActionResult<TaskDashboardData>> {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorizedResult();
  }

  const validation = validateTaskInput(input);

  if (!validation.ok) {
    return { ok: false, message: validation.message };
  }

  const saved = await taskService.saveTask(user.id, {
    taskId: input.id,
    title: validation.title,
    description: validation.description,
    planTitle: validation.planTitle,
    priority: input.priority,
    status: input.status,
    weight: validation.weight,
    completedWeight: validation.completedWeight,
    deadlineAt: validation.deadlineAt,
    scheduledDate: validation.scheduledDate,
    children: validation.children,
  });

  if (!saved) {
    return { ok: false, message: "Task was not found." };
  }

  return {
    ok: true,
    data: await loadTaskDashboardData(user.id),
  };
}

export async function deleteTask(
  taskId: string,
): Promise<TaskActionResult<TaskDashboardData>> {
  return withTaskData(
    (userId) => taskService.deleteTask(userId, taskId),
    "Task was not found.",
  );
}

export async function archiveTask(
  taskId: string,
): Promise<TaskActionResult<TaskDashboardData>> {
  return withTaskData(
    (userId) => taskService.archiveTask(userId, taskId),
    "Task was not found.",
  );
}

export async function completeTask(
  taskId: string,
): Promise<TaskActionResult<TaskDashboardData>> {
  return updateTaskStatus(taskId, "done");
}

export async function skipTask(
  taskId: string,
): Promise<TaskActionResult<TaskDashboardData>> {
  return updateTaskStatus(taskId, "skipped");
}

export async function blockTask(
  taskId: string,
): Promise<TaskActionResult<TaskDashboardData>> {
  return updateTaskStatus(taskId, "blocked");
}

export async function reopenTask(
  taskId: string,
): Promise<TaskActionResult<TaskDashboardData>> {
  return updateTaskStatus(taskId, "todo");
}

export async function updateTaskStatus(
  taskId: string,
  status: Exclude<TaskStatus, "archived">,
): Promise<TaskActionResult<TaskDashboardData>> {
  return withTaskData(
    (userId) => taskService.updateTaskStatus(userId, taskId, status),
    "Task was not found.",
  );
}

export async function updateTaskProgress(
  input: TaskProgressInput,
): Promise<TaskActionResult<TaskDashboardData>> {
  const validation = validateProgressInput(input);

  if (!validation.ok) {
    return { ok: false, message: validation.message };
  }

  return withTaskData(
    (userId) =>
      taskService.updateTaskProgress(
        userId,
        input.taskId,
        validation.weight,
        validation.completedWeight,
      ),
    "Task was not found.",
  );
}
