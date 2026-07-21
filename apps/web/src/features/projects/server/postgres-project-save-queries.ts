import type { NeonQueryFunction } from "@neondatabase/serverless";
import type {
  ImportProjectTreeInput,
  SaveMilestoneInput,
  SaveProjectInput,
  SaveProjectTaskInput,
} from "./project-repository.ts";

type Sql = NeonQueryFunction<false, false>;

export async function saveProject(sql: Sql, input: SaveProjectInput) {
  if (input.projectId) {
    const updated = (await sql.query(
      `UPDATE projects
       SET title = $3, objective = $4, start_date = $5,
         deadline_date = $6, expected_duration_days = $7,
         updated_at = $8
       WHERE user_id = $1 AND id = $2 AND deleted_at IS NULL
       RETURNING id`,
      projectParams(input),
    )) as Array<{ id: string }>;

    return updated[0]?.id ?? null;
  }

  const inserted = (await sql.query(
    `INSERT INTO projects (
       user_id, title, objective, start_date, deadline_date,
       expected_duration_days, created_at, updated_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
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
         AND deleted_at IS NULL
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
     WHERE user_id = $1 AND project_id = $2 AND deleted_at IS NULL
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

export async function importProjectTree(
  sql: Sql,
  input: ImportProjectTreeInput,
) {
  const rows = (await sql.query(
    `WITH project_insert AS (
       INSERT INTO projects (
         user_id, title, objective, start_date, deadline_date,
         expected_duration_days, created_at, updated_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7::timestamptz, $7::timestamptz)
       RETURNING id
     ),
     milestone_input AS (
       SELECT *
       FROM jsonb_to_recordset($8::jsonb) WITH ORDINALITY AS item(
         title text,
         objective text,
         start_date date,
         deadline_date date,
         expected_duration_days integer,
         tasks jsonb,
         ordinal bigint
       )
     ),
     milestone_insert AS (
       INSERT INTO project_milestones (
         user_id, project_id, title, objective, start_date, deadline_date,
         expected_duration_days, sort_order, created_at, updated_at
       )
       SELECT $1, project_insert.id, milestone_input.title,
         milestone_input.objective, milestone_input.start_date,
         milestone_input.deadline_date, milestone_input.expected_duration_days,
         milestone_input.ordinal - 1, $7::timestamptz, $7::timestamptz
       FROM milestone_input
       CROSS JOIN project_insert
       ORDER BY milestone_input.ordinal
       RETURNING id, sort_order
     ),
     milestone_map AS (
       SELECT milestone_input.ordinal, milestone_insert.id
       FROM milestone_input
       INNER JOIN milestone_insert
         ON milestone_insert.sort_order = milestone_input.ordinal - 1
     ),
     task_input AS (
       SELECT milestone_input.ordinal AS milestone_ordinal,
         task_item.title, task_item.description, task_item.start_date,
         task_item.deadline_date, task_item.ordinal AS task_ordinal
       FROM milestone_input
       CROSS JOIN LATERAL jsonb_to_recordset(
         COALESCE(milestone_input.tasks, '[]'::jsonb)
       ) WITH ORDINALITY AS task_item(
         title text,
         description text,
         start_date date,
         deadline_date date,
         ordinal bigint
       )
     ),
     task_insert AS (
       INSERT INTO project_tasks (
         user_id, project_id, milestone_id, title, description,
         start_date, deadline_date, sort_order, created_at, updated_at
       )
       SELECT $1, project_insert.id, milestone_map.id, task_input.title,
         task_input.description, task_input.start_date, task_input.deadline_date,
         task_input.task_ordinal - 1, $7::timestamptz, $7::timestamptz
       FROM task_input
       CROSS JOIN project_insert
       INNER JOIN milestone_map
         ON milestone_map.ordinal = task_input.milestone_ordinal
       ORDER BY task_input.milestone_ordinal, task_input.task_ordinal
       RETURNING id
     )
     SELECT id FROM project_insert`,
    importProjectTreeParams(input),
  )) as Array<{ id: string }>;

  return rows[0]?.id ?? null;
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
    input.startDate,
    input.deadlineDate,
    input.occurredAt,
  ];
}

function importProjectTreeParams(input: ImportProjectTreeInput) {
  return [
    input.userId,
    input.project.title,
    input.project.objective,
    input.project.startDate,
    input.project.deadlineDate,
    input.project.expectedDurationDays,
    input.occurredAt,
    JSON.stringify(
      input.milestones.map((milestone) => ({
        title: milestone.title,
        objective: milestone.objective,
        start_date: milestone.startDate,
        deadline_date: milestone.deadlineDate,
        expected_duration_days: milestone.expectedDurationDays,
        tasks: milestone.tasks.map((task) => ({
          title: task.title,
          description: task.description,
          start_date: task.startDate,
          deadline_date: task.deadlineDate,
        })),
      })),
    ),
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
       AND deleted_at IS NULL
     LIMIT 1`,
    [input.userId, input.projectId, input.milestoneId],
  )) as Array<{ id: string }>;

  return rows.length > 0;
}

async function createTask(sql: Sql, input: SaveProjectTaskInput) {
  const rows = (await sql.query(
    `INSERT INTO project_tasks (
       user_id, project_id, milestone_id, title, description,
       start_date, deadline_date, created_at, updated_at
     )
     VALUES (
       $1, $2, $3, $4, $5, $6, $7, $8, $8
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
       start_date = $6, deadline_date = $7, updated_at = $8::timestamptz
     WHERE user_id = $1 AND id = $9 AND deleted_at IS NULL
     RETURNING id`,
    taskParams(input),
  )) as Array<{ id: string }>;

  return rows[0]?.id ?? null;
}
