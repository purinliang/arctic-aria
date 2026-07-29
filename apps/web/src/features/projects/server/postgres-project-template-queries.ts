import type { NeonQueryFunction } from "@neondatabase/serverless";
import type {
  ApplyProjectTreeTemplateInput,
  ProjectTreeTemplateMilestoneInput,
  ProjectTreeTemplateTaskInput,
} from "./project-repository.ts";

type Sql = NeonQueryFunction<false, false>;

export async function applyProjectTreeTemplate(
  sql: Sql,
  input: ApplyProjectTreeTemplateInput,
) {
  const rows = (await sql.query(
    `WITH milestone_input AS (
       SELECT item.operation, item.milestone_id, item.title, item.objective,
         item.start_date, item.deadline_date, item.expected_duration_days,
         item.ordinal
       FROM jsonb_to_recordset($9::jsonb) AS item(
         operation text,
         milestone_id uuid,
         title text,
         objective text,
         start_date date,
         deadline_date date,
         expected_duration_days integer,
         ordinal integer
       )
     ),
     task_input AS (
       SELECT item.operation, item.task_id, item.milestone_id, item.title,
         item.description, item.start_date, item.deadline_date,
         item.estimated_duration_minutes, item.ordinal
       FROM jsonb_to_recordset($10::jsonb) AS item(
         operation text,
         task_id uuid,
         milestone_id uuid,
         title text,
         description text,
         start_date date,
         deadline_date date,
         estimated_duration_minutes integer,
         ordinal integer
       )
     ),
     target_project AS (
       SELECT id
       FROM projects
       WHERE user_id = $1
         AND id = $2
         AND deleted_at IS NULL
     ),
     guard AS (
       SELECT true AS ok
       WHERE EXISTS (SELECT 1 FROM target_project)
         AND NOT EXISTS (
           SELECT 1
           FROM milestone_input
           WHERE operation IN ('update', 'delete')
             AND NOT EXISTS (
               SELECT 1
               FROM project_milestones
               WHERE user_id = $1
                 AND project_id = $2
                 AND id = milestone_input.milestone_id
                 AND deleted_at IS NULL
             )
         )
         AND NOT EXISTS (
           SELECT 1
           FROM milestone_input
           WHERE operation = 'create'
             AND EXISTS (
               SELECT 1
               FROM project_milestones
               WHERE id = milestone_input.milestone_id
             )
         )
         AND NOT EXISTS (
           SELECT 1
           FROM task_input
           WHERE operation IN ('update', 'delete')
             AND NOT EXISTS (
               SELECT 1
               FROM project_tasks
               WHERE user_id = $1
                 AND project_id = $2
                 AND id = task_input.task_id
                 AND deleted_at IS NULL
             )
         )
         AND NOT EXISTS (
           SELECT 1
           FROM task_input
           WHERE operation = 'create'
             AND EXISTS (
               SELECT 1
               FROM project_tasks
               WHERE id = task_input.task_id
             )
         )
         AND NOT EXISTS (
           SELECT 1
           FROM task_input
           WHERE operation IN ('create', 'update')
             AND milestone_id IS NOT NULL
             AND NOT EXISTS (
               SELECT 1
               FROM project_milestones
               WHERE user_id = $1
                 AND project_id = $2
                 AND id = task_input.milestone_id
                 AND deleted_at IS NULL
             )
             AND NOT EXISTS (
               SELECT 1
               FROM milestone_input
               WHERE operation = 'create'
                 AND milestone_id = task_input.milestone_id
             )
         )
     ),
     project_update AS (
       UPDATE projects
       SET title = $3,
         objective = $4,
         start_date = $5,
         deadline_date = $6,
         expected_duration_days = $7,
         updated_at = $8::timestamptz
       FROM guard
       WHERE user_id = $1
         AND id = $2
         AND deleted_at IS NULL
       RETURNING id
     ),
     milestone_max_order AS (
       SELECT COALESCE(MAX(sort_order), -1) AS value
       FROM project_milestones
       WHERE user_id = $1
         AND project_id = $2
         AND deleted_at IS NULL
     ),
     milestone_create AS (
       INSERT INTO project_milestones (
         id, user_id, project_id, title, objective, start_date, deadline_date,
         expected_duration_days, sort_order, created_at, updated_at
       )
       SELECT milestone_id, $1, $2, title, objective, start_date,
         deadline_date, expected_duration_days,
         (SELECT value FROM milestone_max_order)
           + ROW_NUMBER() OVER (ORDER BY ordinal),
         $8::timestamptz, $8::timestamptz
       FROM milestone_input
       CROSS JOIN guard
       WHERE operation = 'create'
       RETURNING id
     ),
     milestone_update AS (
       UPDATE project_milestones
       SET title = milestone_input.title,
         objective = milestone_input.objective,
         start_date = milestone_input.start_date,
         deadline_date = milestone_input.deadline_date,
         expected_duration_days = milestone_input.expected_duration_days,
         updated_at = $8::timestamptz
       FROM milestone_input, guard
       WHERE project_milestones.user_id = $1
         AND project_milestones.project_id = $2
         AND project_milestones.id = milestone_input.milestone_id
         AND project_milestones.deleted_at IS NULL
         AND milestone_input.operation = 'update'
       RETURNING project_milestones.id
     ),
     milestone_delete AS (
       UPDATE project_milestones
       SET deleted_at = $8::timestamptz,
         updated_at = $8::timestamptz
       FROM milestone_input, guard
       WHERE project_milestones.user_id = $1
         AND project_milestones.project_id = $2
         AND project_milestones.id = milestone_input.milestone_id
         AND project_milestones.deleted_at IS NULL
         AND milestone_input.operation = 'delete'
       RETURNING project_milestones.id
     ),
     task_delete AS (
       UPDATE project_tasks
       SET deleted_at = $8::timestamptz,
         updated_at = $8::timestamptz
       FROM task_input, guard
       WHERE project_tasks.user_id = $1
         AND project_tasks.project_id = $2
         AND project_tasks.id = task_input.task_id
         AND project_tasks.deleted_at IS NULL
         AND task_input.operation = 'delete'
       RETURNING project_tasks.id
     ),
     milestone_task_delete AS (
       UPDATE project_tasks
       SET deleted_at = $8::timestamptz,
         updated_at = $8::timestamptz
       FROM milestone_delete
       WHERE project_tasks.user_id = $1
         AND project_tasks.project_id = $2
         AND project_tasks.milestone_id = milestone_delete.id
         AND project_tasks.deleted_at IS NULL
       RETURNING project_tasks.id
     ),
     task_create_input AS (
       SELECT task_input.*,
         ROW_NUMBER() OVER (
           PARTITION BY milestone_id
           ORDER BY ordinal
         ) AS create_order
       FROM task_input
       WHERE operation = 'create'
     ),
     task_group_max_order AS (
       SELECT groups.milestone_id, COALESCE(MAX(project_tasks.sort_order), -1) AS value
       FROM (
         SELECT DISTINCT milestone_id
         FROM task_create_input
       ) AS groups
       LEFT JOIN project_tasks
         ON project_tasks.user_id = $1
         AND project_tasks.project_id = $2
         AND project_tasks.deleted_at IS NULL
         AND project_tasks.milestone_id IS NOT DISTINCT FROM groups.milestone_id
       GROUP BY groups.milestone_id
     ),
     task_create AS (
       INSERT INTO project_tasks (
         id, user_id, project_id, milestone_id, title, description,
         start_date, deadline_date, estimated_duration_minutes, sort_order,
         created_at, updated_at
       )
       SELECT task_create_input.task_id, $1, $2,
         task_create_input.milestone_id, task_create_input.title,
         task_create_input.description, task_create_input.start_date,
         task_create_input.deadline_date,
         task_create_input.estimated_duration_minutes,
         task_group_max_order.value + task_create_input.create_order,
         $8::timestamptz, $8::timestamptz
       FROM task_create_input
       INNER JOIN task_group_max_order
         ON task_group_max_order.milestone_id
           IS NOT DISTINCT FROM task_create_input.milestone_id
       CROSS JOIN guard
       WHERE task_create_input.milestone_id IS NULL
         OR EXISTS (
           SELECT 1
           FROM project_milestones
           WHERE user_id = $1
             AND project_id = $2
             AND id = task_create_input.milestone_id
             AND deleted_at IS NULL
         )
         OR EXISTS (
           SELECT 1
           FROM milestone_create
           WHERE milestone_create.id = task_create_input.milestone_id
         )
       RETURNING id
     ),
     task_update AS (
       UPDATE project_tasks
       SET milestone_id = task_input.milestone_id,
         title = task_input.title,
         description = task_input.description,
         start_date = task_input.start_date,
         deadline_date = task_input.deadline_date,
         estimated_duration_minutes = task_input.estimated_duration_minutes,
         updated_at = $8::timestamptz
       FROM task_input, guard
       WHERE project_tasks.user_id = $1
         AND project_tasks.project_id = $2
         AND project_tasks.id = task_input.task_id
         AND project_tasks.deleted_at IS NULL
         AND task_input.operation = 'update'
         AND (
           task_input.milestone_id IS NULL
           OR EXISTS (
             SELECT 1
             FROM project_milestones
             WHERE user_id = $1
               AND project_id = $2
               AND id = task_input.milestone_id
               AND deleted_at IS NULL
           )
           OR EXISTS (
             SELECT 1
             FROM milestone_create
             WHERE milestone_create.id = task_input.milestone_id
           )
         )
       RETURNING project_tasks.id
     )
     SELECT EXISTS (SELECT 1 FROM project_update) AS ok`,
    applyProjectTreeTemplateParams(input),
  )) as Array<{ ok: boolean }>;

  return rows[0]?.ok === true;
}

function applyProjectTreeTemplateParams(input: ApplyProjectTreeTemplateInput) {
  return [
    input.userId,
    input.project.projectId,
    input.project.title,
    input.project.objective,
    input.project.startDate,
    input.project.deadlineDate,
    input.project.expectedDurationDays,
    input.occurredAt,
    JSON.stringify(input.milestones.map(milestonePayload)),
    JSON.stringify(input.tasks.map(taskPayload)),
  ];
}

function milestonePayload(
  input: ProjectTreeTemplateMilestoneInput,
  index: number,
) {
  if (input.operation === "delete") {
    return {
      operation: input.operation,
      milestone_id: input.milestoneId,
      ordinal: index + 1,
    };
  }

  return {
    operation: input.operation,
    milestone_id: input.milestoneId,
    title: input.title,
    objective: input.objective,
    start_date: input.startDate,
    deadline_date: input.deadlineDate,
    expected_duration_days: input.expectedDurationDays,
    ordinal: index + 1,
  };
}

function taskPayload(input: ProjectTreeTemplateTaskInput, index: number) {
  if (input.operation === "delete") {
    return {
      operation: input.operation,
      task_id: input.taskId,
      ordinal: index + 1,
    };
  }

  return {
    operation: input.operation,
    task_id: input.taskId,
    milestone_id: input.milestoneId,
    title: input.title,
    description: input.description,
    start_date: input.startDate,
    deadline_date: input.deadlineDate,
    estimated_duration_minutes: input.estimatedDurationMinutes,
    ordinal: index + 1,
  };
}
