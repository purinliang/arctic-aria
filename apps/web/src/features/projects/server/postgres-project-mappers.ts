import type {
  ProjectMilestoneRecord,
  ProjectPriority,
  ProjectRecord,
  ProjectStatus,
  ProjectSubtaskRecord,
  ProjectTaskRecord,
  ProjectTaskStatus,
} from "./project-repository.ts";

export type ProjectRow = {
  id: string;
  user_id: string;
  title: string;
  objective: string;
  importance_reason: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  start_date: Date | string;
  deadline_date: Date | string | null;
  expected_duration_days: number | null;
  created_at: Date | string;
  updated_at: Date | string;
  completed_at: Date | string | null;
  archived_at: Date | string | null;
};

export type MilestoneRow = {
  id: string;
  user_id: string;
  project_id: string;
  title: string;
  objective: string;
  status: ProjectStatus;
  sort_order: number;
  start_date: Date | string | null;
  deadline_date: Date | string | null;
  expected_duration_days: number | null;
  created_at: Date | string;
  updated_at: Date | string;
  completed_at: Date | string | null;
  archived_at: Date | string | null;
};

export type ProjectTaskRow = {
  id: string;
  user_id: string;
  project_id: string;
  project_title: string;
  milestone_id: string;
  milestone_title: string;
  title: string;
  description: string;
  status: ProjectTaskStatus;
  priority: ProjectPriority;
  scheduled_date: Date | string | null;
  start_date: Date | string | null;
  deadline_date: Date | string | null;
  sort_order: number;
  created_at: Date | string;
  updated_at: Date | string;
  completed_at: Date | string | null;
  skipped_at: Date | string | null;
  blocked_at: Date | string | null;
  archived_at: Date | string | null;
};

export type ProjectSubtaskRow = {
  id: string;
  user_id: string;
  task_id: string;
  title: string;
  description: string;
  is_done: boolean;
  sort_order: number;
  created_at: Date | string;
  updated_at: Date | string;
  completed_at: Date | string | null;
};

export const projectTaskSelect = `
  SELECT
    project_tasks.id,
    project_tasks.user_id,
    project_tasks.project_id,
    projects.title AS project_title,
    project_tasks.milestone_id,
    project_milestones.title AS milestone_title,
    project_tasks.title,
    project_tasks.description,
    project_tasks.status,
    project_tasks.priority,
    project_tasks.scheduled_date,
    project_tasks.start_date,
    project_tasks.deadline_date,
    project_tasks.sort_order,
    project_tasks.created_at,
    project_tasks.updated_at,
    project_tasks.completed_at,
    project_tasks.skipped_at,
    project_tasks.blocked_at,
    project_tasks.archived_at
  FROM project_tasks
  INNER JOIN projects ON projects.id = project_tasks.project_id
  INNER JOIN project_milestones ON project_milestones.id = project_tasks.milestone_id
`;

export function mapProject(row: ProjectRow): ProjectRecord {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    objective: row.objective,
    importanceReason: row.importance_reason,
    status: row.status,
    priority: row.priority,
    startDate: toDateString(row.start_date) ?? "",
    deadlineDate: toDateString(row.deadline_date),
    expectedDurationDays: row.expected_duration_days,
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at),
    completedAt: toNullableDate(row.completed_at),
    archivedAt: toNullableDate(row.archived_at),
    milestones: [],
  };
}

export function mapMilestone(row: MilestoneRow): ProjectMilestoneRecord {
  return {
    id: row.id,
    userId: row.user_id,
    projectId: row.project_id,
    title: row.title,
    objective: row.objective,
    status: row.status,
    sortOrder: row.sort_order,
    startDate: toDateString(row.start_date),
    deadlineDate: toDateString(row.deadline_date),
    expectedDurationDays: row.expected_duration_days,
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at),
    completedAt: toNullableDate(row.completed_at),
    archivedAt: toNullableDate(row.archived_at),
    tasks: [],
  };
}

export function mapProjectTask(row: ProjectTaskRow): ProjectTaskRecord {
  return {
    id: row.id,
    userId: row.user_id,
    projectId: row.project_id,
    projectTitle: row.project_title,
    milestoneId: row.milestone_id,
    milestoneTitle: row.milestone_title,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    scheduledDate: toDateString(row.scheduled_date),
    startDate: toDateString(row.start_date),
    deadlineDate: toDateString(row.deadline_date),
    sortOrder: row.sort_order,
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at),
    completedAt: toNullableDate(row.completed_at),
    skippedAt: toNullableDate(row.skipped_at),
    blockedAt: toNullableDate(row.blocked_at),
    archivedAt: toNullableDate(row.archived_at),
    subtasks: [],
  };
}

export function mapSubtask(row: ProjectSubtaskRow): ProjectSubtaskRecord {
  return {
    id: row.id,
    userId: row.user_id,
    taskId: row.task_id,
    title: row.title,
    description: row.description,
    isDone: row.is_done,
    sortOrder: row.sort_order,
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at),
    completedAt: toNullableDate(row.completed_at),
  };
}

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
