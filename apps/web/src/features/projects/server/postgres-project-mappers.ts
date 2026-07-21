import type {
  ProjectMilestoneRecord,
  ProjectRecord,
  ProjectTaskRecord,
  ProjectTaskStatus,
} from "./project-repository.ts";

export type ProjectRow = {
  id: string;
  user_id: string;
  title: string;
  objective: string | null;
  start_date: Date | string;
  deadline_date: Date | string | null;
  expected_duration_days: number | null;
  sidebar_pin_order: number | null;
  created_at: Date | string;
  updated_at: Date | string;
  completed_at: Date | string | null;
  deleted_at: Date | string | null;
};

export type MilestoneRow = {
  id: string;
  user_id: string;
  project_id: string;
  title: string;
  objective: string | null;
  sort_order: number;
  start_date: Date | string | null;
  deadline_date: Date | string | null;
  expected_duration_days: number | null;
  created_at: Date | string;
  updated_at: Date | string;
  completed_at: Date | string | null;
  deleted_at: Date | string | null;
};

export type ProjectTaskRow = {
  id: string;
  user_id: string;
  project_id: string;
  project_title: string;
  milestone_id: string | null;
  milestone_title: string | null;
  title: string;
  description: string | null;
  status: ProjectTaskStatus;
  start_date: Date | string | null;
  deadline_date: Date | string | null;
  sort_order: number;
  created_at: Date | string;
  updated_at: Date | string;
  completed_at: Date | string | null;
  deleted_at: Date | string | null;
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
    CASE
      WHEN project_tasks.completed_at IS NULL THEN 'todo'
      ELSE 'done'
    END AS status,
    project_tasks.start_date,
    project_tasks.deadline_date,
    project_tasks.sort_order,
    project_tasks.created_at,
    project_tasks.updated_at,
    project_tasks.completed_at,
    project_tasks.deleted_at
  FROM project_tasks
  INNER JOIN projects ON projects.id = project_tasks.project_id
  LEFT JOIN project_milestones ON project_milestones.id = project_tasks.milestone_id
`;

export function mapProject(row: ProjectRow): ProjectRecord {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    objective: row.objective,
    startDate: toDateString(row.start_date) ?? "",
    deadlineDate: toDateString(row.deadline_date),
    expectedDurationDays: row.expected_duration_days,
    sidebarPinOrder: row.sidebar_pin_order,
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at),
    completedAt: toNullableDate(row.completed_at),
    deletedAt: toNullableDate(row.deleted_at),
    tasks: [],
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
    sortOrder: row.sort_order,
    startDate: toDateString(row.start_date),
    deadlineDate: toDateString(row.deadline_date),
    expectedDurationDays: row.expected_duration_days,
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at),
    completedAt: toNullableDate(row.completed_at),
    deletedAt: toNullableDate(row.deleted_at),
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
    milestoneTitle: row.milestone_title ?? "",
    title: row.title,
    description: row.description,
    status: row.status,
    startDate: toDateString(row.start_date),
    deadlineDate: toDateString(row.deadline_date),
    sortOrder: row.sort_order,
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at),
    completedAt: toNullableDate(row.completed_at),
    deletedAt: toNullableDate(row.deleted_at),
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

  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
