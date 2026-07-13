"use server";

import { getCurrentUser } from "@/features/auth/actions";
import type { Task } from "@/features/dashboard/types";
import { taskService } from "./server/task-service";
import type {
  TaskPriority,
  TaskRecord,
  TaskStatus,
} from "./server/task-repository";

export type TaskChildInput = {
  id?: string;
  title: string;
  description: string;
  weight: number;
  completedWeight: number;
  status: TaskStatus;
};

export type TaskInput = {
  id?: string;
  title: string;
  description: string;
  planTitle?: string;
  priority: TaskPriority;
  status: TaskStatus;
  weight: number;
  completedWeight: number;
  deadlineAt?: string;
  scheduledDate?: string;
  children: TaskChildInput[];
};

export type TaskProgressInput = {
  taskId: string;
  weight: number;
  completedWeight: number;
};

export type TaskDashboardData = {
  tasks: Task[];
  taskRecords: Task[];
};

export type TaskActionResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      message: string;
    };

const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
});

function unauthorizedResult<T>(): TaskActionResult<T> {
  return {
    ok: false,
    message: "Please sign in again.",
  };
}

function formatDateTime(value: Date | null) {
  if (!value) {
    return "No deadline";
  }

  return dateFormatter.format(value);
}

function toTask(record: TaskRecord): Task {
  return {
    id: record.id,
    title: record.title,
    description: record.description,
    planLabel: record.planTitle ?? "No plan",
    deadline: formatDateTime(record.deadlineAt),
    priority: record.priority,
    status: record.status,
    weight: record.weight,
    completedWeight: record.completedWeight,
    deadlineAt: record.deadlineAt?.toISOString().slice(0, 16) ?? "",
    scheduledDate: record.scheduledDate ?? "",
    subtasks: record.children.map((child) => ({
      id: child.id,
      title: child.title,
      description: child.description,
      weight: child.weight,
      completedWeight: child.completedWeight,
      status: child.status,
      done: child.status === "done",
    })),
  };
}

async function loadTaskDashboardData(userId: string): Promise<TaskDashboardData> {
  const [dashboardTasks, taskRecords] = await Promise.all([
    taskService.listDashboardTasks(userId),
    taskService.listTasks(userId),
  ]);

  return {
    tasks: dashboardTasks.map(toTask),
    taskRecords: taskRecords.map(toTask),
  };
}

function parseOptionalDateTime(value: string | undefined) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  const normalized = trimmed.length === 16 ? `${trimmed}:00.000Z` : trimmed;
  const parsed = new Date(normalized);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function validateDate(value: string | undefined) {
  return !value || /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function validateTaskInput(input: TaskInput) {
  const title = input.title.trim();
  const description = input.description.trim();
  const planTitle = input.planTitle?.trim() || null;
  const weight = Number(input.weight);
  const completedWeight = Number(input.completedWeight);
  const deadlineAt = parseOptionalDateTime(input.deadlineAt);
  const scheduledDate = input.scheduledDate?.trim() || null;

  if (title.length < 1 || title.length > 120) {
    return { ok: false as const, message: "Task title must be 1-120 characters." };
  }

  if (description.length > 2000) {
    return {
      ok: false as const,
      message: "Task description must be 2000 characters or fewer.",
    };
  }

  if (planTitle && planTitle.length > 120) {
    return { ok: false as const, message: "Plan name must be 120 characters or fewer." };
  }

  if (!Number.isFinite(weight) || weight <= 0) {
    return { ok: false as const, message: "Weight must be greater than 0." };
  }

  if (
    !Number.isFinite(completedWeight) ||
    completedWeight < 0 ||
    completedWeight > weight
  ) {
    return {
      ok: false as const,
      message: "Completed weight must be between 0 and total weight.",
    };
  }

  if (input.deadlineAt?.trim() && !deadlineAt) {
    return { ok: false as const, message: "Deadline is invalid." };
  }

  if (!validateDate(scheduledDate ?? undefined)) {
    return { ok: false as const, message: "Scheduled date must use YYYY-MM-DD." };
  }

  const children = input.children
    .map((child) => ({
      id: child.id,
      title: child.title.trim(),
      description: child.description.trim(),
      weight: Number(child.weight),
      completedWeight: Number(child.completedWeight),
      status: child.status,
    }))
    .filter((child) => child.title.length > 0);

  for (const child of children) {
    if (child.title.length > 120) {
      return {
        ok: false as const,
        message: "Subtask title must be 120 characters or fewer.",
      };
    }

    if (child.description.length > 2000) {
      return {
        ok: false as const,
        message: "Subtask description must be 2000 characters or fewer.",
      };
    }

    if (!Number.isFinite(child.weight) || child.weight <= 0) {
      return {
        ok: false as const,
        message: "Subtask weight must be greater than 0.",
      };
    }

    if (
      !Number.isFinite(child.completedWeight) ||
      child.completedWeight < 0 ||
      child.completedWeight > child.weight
    ) {
      return {
        ok: false as const,
        message: "Subtask completed weight must be between 0 and total weight.",
      };
    }
  }

  return {
    ok: true as const,
    title,
    description,
    planTitle,
    weight,
    completedWeight,
    deadlineAt,
    scheduledDate,
    children,
  };
}

function validateProgressInput(input: TaskProgressInput) {
  const weight = Number(input.weight);
  const completedWeight = Number(input.completedWeight);

  if (!Number.isFinite(weight) || weight <= 0) {
    return { ok: false as const, message: "Weight must be greater than 0." };
  }

  if (
    !Number.isFinite(completedWeight) ||
    completedWeight < 0 ||
    completedWeight > weight
  ) {
    return {
      ok: false as const,
      message: "Completed weight must be between 0 and total weight.",
    };
  }

  return { ok: true as const, weight, completedWeight };
}

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
