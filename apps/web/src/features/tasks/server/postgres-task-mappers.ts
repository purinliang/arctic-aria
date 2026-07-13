import type {
  TaskPriority,
  TaskRecord,
  TaskStatus,
} from "./task-repository.ts";

export type TaskRow = {
  id: string;
  user_id: string;
  plan_id: string | null;
  plan_title: string | null;
  parent_task_id: string | null;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  weight: string | number;
  completed_weight: string | number;
  deadline_at: Date | string | null;
  scheduled_date: Date | string | null;
  sort_order: number;
  completed_at: Date | string | null;
  skipped_at: Date | string | null;
  blocked_at: Date | string | null;
  archived_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
};

export const taskSelect = `
  SELECT
    tasks.id,
    tasks.user_id,
    tasks.plan_id,
    plans.title AS plan_title,
    tasks.parent_task_id,
    tasks.title,
    tasks.description,
    tasks.status,
    tasks.priority,
    tasks.weight,
    tasks.completed_weight,
    tasks.deadline_at,
    tasks.scheduled_date,
    tasks.sort_order,
    tasks.completed_at,
    tasks.skipped_at,
    tasks.blocked_at,
    tasks.archived_at,
    tasks.created_at,
    tasks.updated_at
  FROM tasks
  LEFT JOIN plans ON plans.id = tasks.plan_id
`;

function toDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}

function toNullableDate(value: Date | string | null) {
  return value ? toDate(value) : null;
}

function toDateString(value: Date | string | null) {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return value.slice(0, 10);
  }

  return value.toISOString().slice(0, 10);
}

export function mapTask(row: TaskRow): TaskRecord {
  return {
    id: row.id,
    userId: row.user_id,
    planId: row.plan_id,
    planTitle: row.plan_title,
    parentTaskId: row.parent_task_id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    weight: Number(row.weight),
    completedWeight: Number(row.completed_weight),
    deadlineAt: toNullableDate(row.deadline_at),
    scheduledDate: toDateString(row.scheduled_date),
    sortOrder: row.sort_order,
    completedAt: toNullableDate(row.completed_at),
    skippedAt: toNullableDate(row.skipped_at),
    blockedAt: toNullableDate(row.blocked_at),
    archivedAt: toNullableDate(row.archived_at),
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at),
    children: [],
  };
}
