import type { NeonQueryFunction } from "@neondatabase/serverless";

export async function movePostgresDashboardTaskToTomorrow(
  sql: NeonQueryFunction<false, false>,
  input: { userId: string; taskId: string; today: string; occurredAt: Date },
) {
  const [, movedRows] = await sql.transaction(
    (tx) => [
      tx.query(
        `WITH source AS (
           SELECT selection.id, selection.task_id, selection.scheduled_date
           FROM project_task_daily_selections AS selection
           JOIN project_tasks AS task ON task.id = selection.task_id
           JOIN projects AS project ON project.id = task.project_id
           LEFT JOIN project_milestones AS milestone ON milestone.id = task.milestone_id
           WHERE selection.user_id = $1
             AND selection.task_id = $2
             AND selection.scheduled_date = $3::date
             AND task.user_id = $1
             AND task.status = 'todo'
             AND task.deleted_at IS NULL
             AND project.user_id = $1
             AND project.deleted_at IS NULL
             AND (task.milestone_id IS NULL OR milestone.deleted_at IS NULL)
           FOR UPDATE OF selection
         )
         DELETE FROM project_task_daily_selections AS target
         USING source
         WHERE target.user_id = $1
           AND target.task_id = source.task_id
           AND target.scheduled_date = source.scheduled_date + 1
           AND target.source = 'scheduler'
           AND target.moved_at IS NULL
           AND target.moved_from_date IS NULL`,
        [input.userId, input.taskId, input.today],
      ),
      tx.query(
        `UPDATE project_task_daily_selections AS source
         SET scheduled_date = source.scheduled_date + 1,
             moved_at = $4::timestamptz,
             moved_from_date = source.scheduled_date
         FROM project_tasks AS task
         JOIN projects AS project ON project.id = task.project_id
         LEFT JOIN project_milestones AS milestone ON milestone.id = task.milestone_id
         WHERE source.user_id = $1
           AND source.task_id = $2
           AND source.scheduled_date = $3::date
           AND task.id = source.task_id
           AND task.user_id = $1
           AND task.status = 'todo'
           AND task.deleted_at IS NULL
           AND project.user_id = $1
           AND project.deleted_at IS NULL
           AND (task.milestone_id IS NULL OR milestone.deleted_at IS NULL)
           AND NOT EXISTS (
             SELECT 1 FROM project_task_daily_selections AS target
             WHERE target.user_id = $1
               AND target.task_id = source.task_id
               AND target.scheduled_date = source.scheduled_date + 1
           )
         RETURNING source.id`,
        [input.userId, input.taskId, input.today, input.occurredAt],
      ),
    ],
    { isolationLevel: "Serializable" },
  );

  return movedRows.length > 0;
}
