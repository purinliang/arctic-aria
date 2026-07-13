import type { NeonQueryFunction } from "@neondatabase/serverless";
import type { SaveTaskInput } from "./task-repository.ts";

type Sql = NeonQueryFunction<false, false>;

function taskParams(input: SaveTaskInput, planId: string | null) {
  return [
    input.userId,
    planId,
    input.title,
    input.description,
    input.status,
    input.priority,
    input.weight,
    input.completedWeight,
    input.deadlineAt,
    input.scheduledDate,
    input.occurredAt,
  ];
}

export async function saveTask(sql: Sql, input: SaveTaskInput) {
  const planId = await resolvePlanId(sql, input);

  if (input.taskId) {
    const updated = await updateRootTask(sql, input, planId);

    if (!updated) {
      return false;
    }

    await replaceChildren(sql, input, planId, input.taskId);
    await refreshParentFromChildren(sql, input.userId, input.taskId, input.occurredAt);
    return true;
  }

  const taskId = await createRootTask(sql, input, planId);

  await replaceChildren(sql, input, planId, taskId);
  await refreshParentFromChildren(sql, input.userId, taskId, input.occurredAt);
  return true;
}

async function resolvePlanId(sql: Sql, input: SaveTaskInput) {
  const planTitle = input.planTitle?.trim();

  if (!planTitle) {
    return null;
  }

  const existing = (await sql`
    SELECT id
    FROM plans
    WHERE user_id = ${input.userId}
      AND lower(title) = lower(${planTitle})
      AND status != 'archived'
    ORDER BY created_at
    LIMIT 1
  `) as Array<{ id: string }>;

  if (existing[0]) {
    return existing[0].id;
  }

  const inserted = (await sql`
    INSERT INTO plans (user_id, title, created_at, updated_at)
    VALUES (${input.userId}, ${planTitle}, ${input.occurredAt}, ${input.occurredAt})
    RETURNING id
  `) as Array<{ id: string }>;

  return inserted[0]?.id ?? null;
}

async function createRootTask(
  sql: Sql,
  input: SaveTaskInput,
  planId: string | null,
) {
  const rows = (await sql.query(
    `INSERT INTO tasks (
       user_id, plan_id, title, description, status, priority, weight,
       completed_weight, deadline_at, scheduled_date, completed_at, skipped_at,
       blocked_at, created_at, updated_at
     )
     VALUES (
       $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
       CASE WHEN $5 = 'done' THEN $11::timestamptz ELSE NULL END,
       CASE WHEN $5 = 'skipped' THEN $11::timestamptz ELSE NULL END,
       CASE WHEN $5 = 'blocked' THEN $11::timestamptz ELSE NULL END,
       $11, $11
     )
     RETURNING id`,
    taskParams(input, planId),
  )) as Array<{ id: string }>;

  return rows[0].id;
}

async function updateRootTask(
  sql: Sql,
  input: SaveTaskInput,
  planId: string | null,
) {
  const rows = (await sql.query(
    `UPDATE tasks
     SET plan_id = $2, title = $3, description = $4, status = $5,
       priority = $6, weight = $7, completed_weight = $8, deadline_at = $9,
       scheduled_date = $10,
       completed_at = CASE WHEN $5 = 'done' THEN $11::timestamptz ELSE NULL END,
       skipped_at = CASE WHEN $5 = 'skipped' THEN $11::timestamptz ELSE NULL END,
       blocked_at = CASE WHEN $5 = 'blocked' THEN $11::timestamptz ELSE NULL END,
       updated_at = $11::timestamptz
     WHERE user_id = $1
       AND id = $12
       AND parent_task_id IS NULL
     RETURNING id`,
    [...taskParams(input, planId), input.taskId],
  )) as Array<{ id: string }>;

  return rows.length > 0;
}

async function replaceChildren(
  sql: Sql,
  input: SaveTaskInput,
  planId: string | null,
  parentTaskId: string,
) {
  await sql`
    DELETE FROM tasks
    WHERE user_id = ${input.userId}
      AND parent_task_id = ${parentTaskId}
  `;

  for (const [index, child] of input.children.entries()) {
    await sql.query(
      `INSERT INTO tasks (
         user_id, plan_id, parent_task_id, title, description, status, priority,
         weight, completed_weight, scheduled_date, sort_order, completed_at,
         created_at, updated_at
       )
       VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
         CASE WHEN $6 = 'done' THEN $12::timestamptz ELSE NULL END, $12, $12
       )`,
      [
        input.userId,
        planId,
        parentTaskId,
        child.title,
        child.description,
        child.status,
        input.priority,
        child.weight,
        child.completedWeight,
        input.scheduledDate,
        index,
        input.occurredAt,
      ],
    );
  }
}

export async function refreshParentFromChildren(
  sql: Sql,
  userId: string,
  parentTaskId: string | null,
  occurredAt: Date,
) {
  if (!parentTaskId) {
    return;
  }

  await sql.query(
    `WITH child_progress AS (
       SELECT parent_task_id, SUM(weight) AS weight,
         SUM(completed_weight) AS completed_weight
       FROM tasks
       WHERE user_id = $1 AND parent_task_id = $2 AND status != 'archived'
       GROUP BY parent_task_id
     )
     UPDATE tasks
     SET weight = child_progress.weight,
       completed_weight = child_progress.completed_weight,
       status = CASE
         WHEN child_progress.completed_weight >= child_progress.weight THEN 'done'
         WHEN child_progress.completed_weight > 0 THEN 'doing'
         WHEN tasks.status = 'done' THEN 'doing'
         ELSE tasks.status
       END,
       completed_at = CASE
         WHEN child_progress.completed_weight >= child_progress.weight THEN $3::timestamptz
         ELSE NULL
       END,
       updated_at = $3::timestamptz
     FROM child_progress
     WHERE tasks.user_id = $1
       AND tasks.id = child_progress.parent_task_id`,
    [userId, parentTaskId, occurredAt],
  );
}
