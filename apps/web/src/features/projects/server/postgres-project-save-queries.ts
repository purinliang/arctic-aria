import type { NeonQueryFunction } from "@neondatabase/serverless";
import type {
  SaveMilestoneInput,
  SaveProjectInput,
  SaveProjectTaskInput,
} from "./project-repository.ts";

type Sql = NeonQueryFunction<false, false>;

export async function saveProject(sql: Sql, input: SaveProjectInput) {
  if (input.projectId) {
    const updated = (await sql.query(
      `UPDATE projects
       SET title = $3, objective = $4, priority = $5,
         start_date = $6, deadline_date = $7, expected_duration_days = $8,
         updated_at = $9
       WHERE user_id = $1 AND id = $2 AND status != 'archived'
       RETURNING id`,
      projectParams(input),
    )) as Array<{ id: string }>;

    return updated[0]?.id ?? null;
  }

  const inserted = (await sql.query(
    `INSERT INTO projects (
       user_id, title, objective, priority, start_date,
       deadline_date, expected_duration_days, created_at, updated_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)
     RETURNING id`,
    createProjectParams(input),
  )) as Array<{ id: string }>;
  const projectId = inserted[0]?.id;

  if (!projectId) {
    return null;
  }

  return projectId;
}

export async function saveMilestone(sql: Sql, input: SaveMilestoneInput) {
  if (input.milestoneId) {
    const updated = (await sql.query(
      `UPDATE project_milestones
       SET title = $4, objective = $5, start_date = $6, deadline_date = $7,
         expected_duration_days = $8, updated_at = $9
       WHERE user_id = $1 AND project_id = $2 AND id = $3
         AND status != 'archived'
       RETURNING id`,
      milestoneParams(input),
    )) as Array<{ id: string }>;

    return updated[0]?.id ?? null;
  }

  const inserted = (await sql.query(
    `INSERT INTO project_milestones (
       user_id, project_id, title, objective, start_date, deadline_date,
       expected_duration_days, sort_order, created_at, updated_at
     )
     SELECT $1, $2, $3, $4, $5, $6, $7,
       COALESCE(MAX(sort_order), -1) + 1, $8, $8
     FROM project_milestones
     WHERE user_id = $1 AND project_id = $2
     RETURNING id`,
    createMilestoneParams(input),
  )) as Array<{ id: string }>;

  return inserted[0]?.id ?? null;
}

export async function saveTask(sql: Sql, input: SaveProjectTaskInput) {
  const normalizedInput = normalizeTaskInput(input);

  if (!(await milestoneExists(sql, normalizedInput))) {
    return false;
  }

  const taskId = normalizedInput.taskId
    ? await updateTask(sql, normalizedInput)
    : await createTask(sql, normalizedInput);

  if (!taskId) {
    return false;
  }

  return true;
}

function normalizeTaskInput(
  input: SaveProjectTaskInput,
): SaveProjectTaskInput {
  return {
    ...input,
    milestoneId: input.milestoneId?.trim() || null,
  };
}

function projectParams(input: SaveProjectInput) {
  return [
    input.userId,
    input.projectId ?? null,
    input.title,
    input.objective,
    input.priority,
    input.startDate,
    input.deadlineDate,
    input.expectedDurationDays,
    input.occurredAt,
  ];
}

function createProjectParams(input: SaveProjectInput) {
  return [
    input.userId,
    input.title,
    input.objective,
    input.priority,
    input.startDate,
    input.deadlineDate,
    input.expectedDurationDays,
    input.occurredAt,
  ];
}

function milestoneParams(input: SaveMilestoneInput) {
  return [
    input.userId,
    input.projectId,
    input.milestoneId ?? null,
    input.title,
    input.objective,
    input.startDate,
    input.deadlineDate,
    input.expectedDurationDays,
    input.occurredAt,
  ];
}

function createMilestoneParams(input: SaveMilestoneInput) {
  return [
    input.userId,
    input.projectId,
    input.title,
    input.objective,
    input.startDate,
    input.deadlineDate,
    input.expectedDurationDays,
    input.occurredAt,
  ];
}

function taskParams(input: SaveProjectTaskInput) {
  return [
    input.userId,
    input.projectId,
    input.milestoneId,
    input.title,
    input.description,
    input.status,
    input.priority,
    input.scheduledDate,
    input.startDate,
    input.deadlineDate,
    input.occurredAt,
    input.taskId ?? null,
  ];
}

function createTaskParams(input: SaveProjectTaskInput) {
  return [
    input.userId,
    input.projectId,
    input.milestoneId,
    input.title,
    input.description,
    input.status,
    input.priority,
    input.scheduledDate,
    input.startDate,
    input.deadlineDate,
    input.occurredAt,
  ];
}

async function milestoneExists(sql: Sql, input: SaveProjectTaskInput) {
  if (!input.milestoneId) {
    return true;
  }

  const rows = (await sql.query(
    `SELECT id
     FROM project_milestones
     WHERE user_id = $1 AND project_id = $2 AND id = $3
       AND status != 'archived'
     LIMIT 1`,
    [input.userId, input.projectId, input.milestoneId],
  )) as Array<{ id: string }>;

  return rows.length > 0;
}

async function createTask(sql: Sql, input: SaveProjectTaskInput) {
  const rows = (await sql.query(
    `INSERT INTO project_tasks (
       user_id, project_id, milestone_id, title, description, status, priority,
       scheduled_date, start_date, deadline_date, completed_at, skipped_at,
       blocked_at, created_at, updated_at
     )
     VALUES (
       $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
       CASE WHEN $6 = 'done' THEN $11::timestamptz ELSE NULL END,
       CASE WHEN $6 = 'skipped' THEN $11::timestamptz ELSE NULL END,
       CASE WHEN $6 = 'blocked' THEN $11::timestamptz ELSE NULL END,
       $11, $11
     )
     RETURNING id`,
    createTaskParams(input),
  )) as Array<{ id: string }>;

  return rows[0]?.id ?? null;
}

async function updateTask(sql: Sql, input: SaveProjectTaskInput) {
  const rows = (await sql.query(
    `UPDATE project_tasks
     SET project_id = $2, milestone_id = $3, title = $4, description = $5,
       status = $6, priority = $7, scheduled_date = $8, start_date = $9,
       deadline_date = $10,
       completed_at = CASE WHEN $6 = 'done' THEN $11::timestamptz ELSE NULL END,
       skipped_at = CASE WHEN $6 = 'skipped' THEN $11::timestamptz ELSE NULL END,
       blocked_at = CASE WHEN $6 = 'blocked' THEN $11::timestamptz ELSE NULL END,
       updated_at = $11::timestamptz
     WHERE user_id = $1 AND id = $12 AND status != 'archived'
     RETURNING id`,
    taskParams(input),
  )) as Array<{ id: string }>;

  return rows[0]?.id ?? null;
}
