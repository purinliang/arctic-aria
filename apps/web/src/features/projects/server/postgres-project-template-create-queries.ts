import type { NeonQueryFunction } from "@neondatabase/serverless";
import type {
  CreateProjectTreeTemplateInput,
  ProjectTreeTemplateCreateMilestoneInput,
  ProjectTreeTemplateCreateTaskInput,
} from "./project-repository.ts";

type Sql = NeonQueryFunction<false, false>;

export async function createProjectTreeTemplate(
  sql: Sql,
  input: CreateProjectTreeTemplateInput,
) {
  const rows = (await sql.query(
    `WITH milestone_input AS (
       SELECT item.milestone_id, item.title, item.objective, item.start_date,
         item.deadline_date, item.expected_duration_days, item.ordinal
       FROM jsonb_to_recordset($9::jsonb) AS item(
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
       SELECT item.task_id, item.milestone_id, item.title, item.description,
         item.start_date, item.deadline_date,
         item.estimated_duration_minutes, item.ordinal
       FROM jsonb_to_recordset($10::jsonb) AS item(
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
     guard AS (
       SELECT true AS ok
       WHERE NOT EXISTS (
           SELECT 1
           FROM projects
           WHERE id = $2
         )
         AND NOT EXISTS (
           SELECT 1
           FROM milestone_input
           WHERE EXISTS (
             SELECT 1
             FROM project_milestones
             WHERE id = milestone_input.milestone_id
           )
         )
         AND NOT EXISTS (
           SELECT 1
           FROM task_input
           WHERE EXISTS (
             SELECT 1
             FROM project_tasks
             WHERE id = task_input.task_id
           )
         )
         AND NOT EXISTS (
           SELECT 1
           FROM task_input
           WHERE milestone_id IS NOT NULL
             AND NOT EXISTS (
               SELECT 1
               FROM milestone_input
               WHERE milestone_input.milestone_id = task_input.milestone_id
             )
         )
     ),
     project_create AS (
       INSERT INTO projects (
         id, user_id, title, objective, start_date, deadline_date,
         expected_duration_days, created_at, updated_at
       )
       SELECT $2, $1, $3, $4, $5, $6, $7, $8::timestamptz, $8::timestamptz
       FROM guard
       RETURNING id
     ),
     milestone_create AS (
       INSERT INTO project_milestones (
         id, user_id, project_id, title, objective, start_date, deadline_date,
         expected_duration_days, sort_order, created_at, updated_at
       )
       SELECT milestone_id, $1, (SELECT id FROM project_create), title,
         objective, start_date, deadline_date, expected_duration_days,
         ROW_NUMBER() OVER (ORDER BY ordinal) - 1,
         $8::timestamptz, $8::timestamptz
       FROM milestone_input
       CROSS JOIN project_create
       RETURNING id
     ),
     task_create_input AS (
       SELECT task_input.*,
         ROW_NUMBER() OVER (
           PARTITION BY milestone_id
           ORDER BY ordinal
         ) - 1 AS sort_order
       FROM task_input
     ),
     task_create AS (
       INSERT INTO project_tasks (
         id, user_id, project_id, milestone_id, title, description,
         start_date, deadline_date, estimated_duration_minutes, sort_order,
         created_at, updated_at
       )
       SELECT task_id, $1, (SELECT id FROM project_create), milestone_id,
         title, description, start_date, deadline_date,
         estimated_duration_minutes, sort_order,
         $8::timestamptz, $8::timestamptz
       FROM task_create_input
       CROSS JOIN project_create
       WHERE milestone_id IS NULL
         OR EXISTS (
           SELECT 1
           FROM milestone_create
           WHERE milestone_create.id = task_create_input.milestone_id
         )
       RETURNING id
     )
     SELECT id
     FROM project_create`,
    createProjectTreeTemplateParams(input),
  )) as Array<{ id: string }>;

  return rows[0]?.id ?? null;
}

function createProjectTreeTemplateParams(input: CreateProjectTreeTemplateInput) {
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
  input: ProjectTreeTemplateCreateMilestoneInput,
  index: number,
) {
  return {
    milestone_id: input.milestoneId,
    title: input.title,
    objective: input.objective,
    start_date: input.startDate,
    deadline_date: input.deadlineDate,
    expected_duration_days: input.expectedDurationDays,
    ordinal: index + 1,
  };
}

function taskPayload(input: ProjectTreeTemplateCreateTaskInput, index: number) {
  return {
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
