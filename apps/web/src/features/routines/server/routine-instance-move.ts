import type { NeonQueryFunction } from "@neondatabase/serverless";
import {
  mapRoutineInstance,
  routineInstanceSelectFromCte,
  type RoutineInstanceRow,
} from "./postgres-routine-mappers.ts";

export async function moveRoutineInstanceToTomorrowInPostgres(
  sql: NeonQueryFunction<false, false>,
  input: { userId: string; instanceId: string; occurredAt: Date },
) {
  // Both statements share one transaction so a pre-generated target is removed
  // before the source takes its date, while keeping the source instance id.
  const [, movedRows] = await sql.transaction(
    (tx) => [
      tx.query(
        `WITH source AS (
           SELECT routine_instances.id, routine_instances.routine_id,
                  routine_instances.scheduled_date
           FROM routine_instances
           JOIN routines ON routines.id = routine_instances.routine_id
           JOIN routine_rules ON routine_rules.routine_id = routines.id
           WHERE routine_instances.user_id = $1
             AND routine_instances.id = $2
             AND routine_instances.status = 'pending'
             AND routines.user_id = $1
             AND routines.deleted_at IS NULL
             AND routine_instances.scheduled_date =
               (($3::timestamptz AT TIME ZONE routine_rules.timezone)
                 - interval '4 hours')::date
           FOR UPDATE OF routine_instances
         )
         DELETE FROM routine_instances AS target
         USING source
         WHERE target.user_id = $1
           AND target.routine_id = source.routine_id
           AND target.scheduled_date = source.scheduled_date + 1
           AND target.status = 'pending'
           AND target.reminded_at IS NULL
           AND target.moved_at IS NULL
           AND target.moved_from_date IS NULL
           AND target.updated_at = target.created_at
           AND NOT EXISTS (
             SELECT 1 FROM routine_completion_events AS history
             WHERE history.routine_instance_id = target.id
           )
           AND NOT EXISTS (
             SELECT 1 FROM routine_instances AS protected
             WHERE protected.user_id = $1
               AND protected.routine_id = source.routine_id
               AND protected.scheduled_date = source.scheduled_date + 1
               AND (
                 protected.status <> 'pending'
                 OR protected.reminded_at IS NOT NULL
                 OR protected.moved_at IS NOT NULL
                 OR protected.moved_from_date IS NOT NULL
                 OR protected.updated_at <> protected.created_at
                 OR EXISTS (
                   SELECT 1 FROM routine_completion_events AS history
                   WHERE history.routine_instance_id = protected.id
                 )
               )
           )`,
        [input.userId, input.instanceId, input.occurredAt],
      ),
      tx.query(
        `WITH updated_instance AS (
           UPDATE routine_instances AS source
           SET scheduled_date = source.scheduled_date + 1,
               scheduled_time = COALESCE(rule.preferred_time, time '18:00'),
               remind_at = GREATEST(
                 to_timestamp(
                   round(extract(epoch from (
                     ((source.scheduled_date + 1
                       + COALESCE(rule.preferred_time, time '18:00'))
                       AT TIME ZONE rule.timezone) - interval '30 minutes'
                   )) / 900.0) * 900
                 ),
                 to_timestamp(ceil(extract(epoch from $3::timestamptz) / 900.0) * 900)
               ),
               reminded_at = NULL,
               moved_at = $3::timestamptz,
               moved_from_date = source.scheduled_date,
               updated_at = $3::timestamptz
           FROM routines, routine_rules AS rule
           WHERE source.user_id = $1
             AND source.id = $2
             AND source.status = 'pending'
             AND routines.id = source.routine_id
             AND routines.user_id = $1
             AND routines.deleted_at IS NULL
             AND rule.routine_id = routines.id
             AND source.scheduled_date =
               (($3::timestamptz AT TIME ZONE rule.timezone)
                 - interval '4 hours')::date
             AND NOT EXISTS (
               SELECT 1 FROM routine_instances AS target
               WHERE target.user_id = $1
                 AND target.routine_id = source.routine_id
                 AND target.scheduled_date = source.scheduled_date + 1
             )
           RETURNING source.*
         )
         ${routineInstanceSelectFromCte("updated_instance")}`,
        [input.userId, input.instanceId, input.occurredAt],
      ),
    ],
    { isolationLevel: "Serializable" },
  );

  const row = (movedRows as RoutineInstanceRow[])[0];
  return row ? mapRoutineInstance(row) : null;
}
