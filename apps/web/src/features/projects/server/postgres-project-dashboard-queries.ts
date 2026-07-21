import type { NeonQueryFunction } from "@neondatabase/serverless";
import {
  mapProjectTask,
  projectTaskSelect,
  type ProjectTaskRow,
} from "./postgres-project-mappers.ts";
import {
  projectTaskAutoScheduleHorizonDays,
  projectTaskDailySelectionLimit,
} from "./project-repository-types.ts";

export async function listPostgresDashboardTasks(
  sql: NeonQueryFunction<false, false>,
  input: {
    userId: string;
    today: string;
    occurredAt: Date;
  },
) {
  const taskRows = (await sql.query(
    `WITH visible_selected AS (
       SELECT project_task_daily_selections.task_id
       FROM project_task_daily_selections
       INNER JOIN project_tasks
         ON project_tasks.id = project_task_daily_selections.task_id
       INNER JOIN projects ON projects.id = project_tasks.project_id
       LEFT JOIN project_milestones
         ON project_milestones.id = project_tasks.milestone_id
       WHERE project_task_daily_selections.user_id = $1
         AND project_task_daily_selections.scheduled_date = $2::date
         AND project_tasks.deleted_at IS NULL
         AND projects.deleted_at IS NULL
         AND (
           project_tasks.milestone_id IS NULL
           OR project_milestones.deleted_at IS NULL
         )
     ),
     candidate_tasks AS (
       SELECT project_tasks.id
       FROM project_tasks
       INNER JOIN projects ON projects.id = project_tasks.project_id
       LEFT JOIN project_milestones
         ON project_milestones.id = project_tasks.milestone_id
       WHERE project_tasks.user_id = $1
         AND project_tasks.deleted_at IS NULL
         AND project_tasks.completed_at IS NULL
         AND projects.deleted_at IS NULL
         AND (
           project_tasks.milestone_id IS NULL
           OR project_milestones.deleted_at IS NULL
         )
         AND (
           project_tasks.start_date IS NULL
           OR project_tasks.start_date <= $2::date
         )
         AND project_tasks.deadline_date IS NOT NULL
         AND project_tasks.deadline_date <= (
           $2::date + ($5::int * interval '1 day')
         )::date
         AND NOT EXISTS (
           SELECT 1
           FROM project_task_daily_selections existing_selection
           WHERE existing_selection.user_id = $1
             AND existing_selection.task_id = project_tasks.id
             AND existing_selection.scheduled_date = $2::date
         )
       ORDER BY
         project_tasks.deadline_date NULLS LAST,
         project_tasks.start_date NULLS LAST,
         project_tasks.updated_at DESC
       LIMIT GREATEST(
         $4::int - (SELECT COUNT(*)::int FROM visible_selected),
         0
       )
     ),
     inserted_selections AS (
       INSERT INTO project_task_daily_selections (
         user_id,
         task_id,
         scheduled_date,
         source,
         created_at
       )
       SELECT $1, candidate_tasks.id, $2::date, 'scheduler', $3::timestamptz
       FROM candidate_tasks
       ON CONFLICT (user_id, task_id, scheduled_date) DO NOTHING
       RETURNING task_id, created_at
     ),
     active_daily_selections AS (
       SELECT
         project_task_daily_selections.task_id,
         project_task_daily_selections.created_at
       FROM project_task_daily_selections
       INNER JOIN project_tasks
         ON project_tasks.id = project_task_daily_selections.task_id
       INNER JOIN projects ON projects.id = project_tasks.project_id
       LEFT JOIN project_milestones
         ON project_milestones.id = project_tasks.milestone_id
       WHERE project_task_daily_selections.user_id = $1
         AND project_task_daily_selections.scheduled_date = $2::date
         AND project_tasks.deleted_at IS NULL
         AND projects.deleted_at IS NULL
         AND (
           project_tasks.milestone_id IS NULL
           OR project_milestones.deleted_at IS NULL
         )
       UNION ALL
       SELECT
         inserted_selections.task_id,
         inserted_selections.created_at
       FROM inserted_selections
     )
     ${projectTaskSelect}
     INNER JOIN active_daily_selections
       ON active_daily_selections.task_id = project_tasks.id
     WHERE project_tasks.user_id = $1
       AND project_tasks.deleted_at IS NULL
       AND projects.deleted_at IS NULL
       AND (
         project_tasks.milestone_id IS NULL
         OR project_milestones.deleted_at IS NULL
       )
     ORDER BY
       active_daily_selections.created_at,
       project_tasks.deadline_date NULLS LAST,
       project_tasks.start_date NULLS LAST,
       project_tasks.sort_order,
       project_tasks.created_at
     LIMIT $4`,
    [
      input.userId,
      input.today,
      input.occurredAt,
      projectTaskDailySelectionLimit,
      projectTaskAutoScheduleHorizonDays,
    ],
  )) as ProjectTaskRow[];

  return taskRows.map(mapProjectTask);
}
