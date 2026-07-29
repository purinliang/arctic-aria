import type { NeonQueryFunction } from "@neondatabase/serverless";
import { getSql } from "../../../server/database/neon.ts";
import type {
  RoutineInstanceStatus,
  RoutineRepository,
  SaveRoutineGroupInput,
  SaveRoutineInput,
} from "./routine-repository.ts";
import {
  mapRoutine,
  mapRoutineGroup,
  mapRoutineInstance,
  routineInstanceSelect,
  routineInstanceSelectFromCte,
  routineParams,
  routineSelect,
  routineSelectFromCtes,
} from "./postgres-routine-mappers.ts";
import type {
  RoutineGroupRow,
  RoutineInstanceRow,
  RoutineRow,
} from "./postgres-routine-mappers.ts";
import { fallbackRoutineScheduledTime } from "./routine-reminder-schedule.ts";

export class PostgresRoutineRepository implements RoutineRepository {
  private readonly sql?: NeonQueryFunction<false, false>;

  constructor(sql?: NeonQueryFunction<false, false>) {
    this.sql = sql;
  }

  private getSql() {
    return this.sql ?? getSql();
  }

  async listRoutineGroups(userId: string) {
    const rows = (await this.getSql().query(
      `
      SELECT
        id,
        user_id,
        name,
        description,
        created_at,
        updated_at,
        deleted_at
      FROM routine_groups
      WHERE user_id = $1
        AND deleted_at IS NULL
      ORDER BY name ASC, created_at ASC
      `,
      [userId],
    )) as RoutineGroupRow[];

    return rows.map(mapRoutineGroup);
  }

  async listRoutines(userId: string) {
    const rows = (await this.getSql().query(
      `${routineSelect}
       WHERE routines.user_id = $1
         AND routines.deleted_at IS NULL
       ORDER BY routines.created_at DESC`,
      [userId],
    )) as RoutineRow[];

    return rows.map(mapRoutine);
  }

  async listActiveRoutines(userId: string) {
    const rows = (await this.getSql().query(
      `${routineSelect}
       WHERE routines.user_id = $1
         AND routines.deleted_at IS NULL
       ORDER BY routines.created_at DESC`,
      [userId],
    )) as RoutineRow[];

    return rows.map(mapRoutine);
  }

  async listActiveRoutinesForReminders() {
    const rows = (await this.getSql().query(
      `${routineSelect}
       WHERE routines.deleted_at IS NULL
       ORDER BY COALESCE(routine_rules.preferred_time, '18:00'), routines.created_at`,
      [],
    )) as RoutineRow[];

    return rows.map(mapRoutine);
  }

  async createRoutineGroup(input: SaveRoutineGroupInput) {
    const rows = (await this.getSql().query(
      `
      INSERT INTO routine_groups (
        user_id,
        name,
        description,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $4)
      RETURNING
        id,
        user_id,
        name,
        description,
        created_at,
        updated_at,
        deleted_at
      `,
      [input.userId, input.name, input.description, input.occurredAt],
    )) as RoutineGroupRow[];

    return mapRoutineGroup(rows[0]);
  }

  async updateRoutineGroup(input: SaveRoutineGroupInput & { groupId: string }) {
    const rows = (await this.getSql().query(
      `
      UPDATE routine_groups
      SET name = $3,
          description = $4,
          updated_at = $5
      WHERE user_id = $1
        AND id = $2
        AND deleted_at IS NULL
      RETURNING
        id,
        user_id,
        name,
        description,
        created_at,
        updated_at,
        deleted_at
      `,
      [
        input.userId,
        input.groupId,
        input.name,
        input.description,
        input.occurredAt,
      ],
    )) as RoutineGroupRow[];

    return rows[0] ? mapRoutineGroup(rows[0]) : null;
  }

  async deleteRoutineGroup(input: {
    userId: string;
    groupId: string;
    occurredAt: Date;
  }) {
    const rows = (await this.getSql().query(
      `
      WITH target_group AS (
        UPDATE routine_groups
        SET deleted_at = $3,
            updated_at = $3
        WHERE user_id = $1
          AND id = $2
          AND deleted_at IS NULL
        RETURNING id
      ),
      cleared_routines AS (
        UPDATE routines
        SET group_id = NULL,
            updated_at = $3
        WHERE user_id = $1
          AND group_id IN (SELECT id FROM target_group)
          AND deleted_at IS NULL
        RETURNING id
      )
      SELECT id FROM target_group
      `,
      [input.userId, input.groupId, input.occurredAt],
    )) as Array<{ id: string }>;

    return rows.length > 0;
  }

  async createRoutine(input: SaveRoutineInput) {
    const rows = (await this.getSql().query(
      `
      WITH valid_group AS (
        SELECT id
        FROM routine_groups
        WHERE user_id = $1
          AND id = $14::uuid
          AND deleted_at IS NULL
        LIMIT 1
      ),
      inserted_routine AS (
        INSERT INTO routines (
          user_id,
          group_id,
          title,
          description,
          start_date,
          end_date,
          estimated_duration_minutes,
          created_at,
          updated_at
        )
        VALUES ($1, (SELECT id FROM valid_group), $2, $3, $4, $5, $13, $12, $12)
        RETURNING *
      ),
      inserted_rule AS (
        INSERT INTO routine_rules (
          routine_id,
          rule_type,
          interval_value,
          weekdays,
          day_of_month,
          preferred_time,
          timezone,
          created_at,
          updated_at
        )
        SELECT id, $6, $7, $8::jsonb, $9, $10, $11, $12, $12
        FROM inserted_routine
        RETURNING *
      )
      ${routineSelectFromCtes("inserted_routine", "inserted_rule")}
      `,
      routineParams(input),
    )) as RoutineRow[];

    return mapRoutine(rows[0]);
  }

  async updateRoutine(input: SaveRoutineInput & { routineId: string }) {
    const rows = (await this.getSql().query(
      `
      WITH valid_group AS (
        SELECT id
        FROM routine_groups
        WHERE user_id = $1
          AND id = $14::uuid
          AND deleted_at IS NULL
        LIMIT 1
      ),
      updated_routine AS (
        UPDATE routines
        SET
          title = $2,
          description = $3,
          start_date = $4,
          end_date = $5,
          estimated_duration_minutes = $13,
          updated_at = $12,
          group_id = CASE
            WHEN $14::uuid IS NULL THEN NULL
            ELSE (SELECT id FROM valid_group)
          END
        WHERE user_id = $1
          AND id = $15
          AND deleted_at IS NULL
        RETURNING *
      ),
      updated_rule AS (
        UPDATE routine_rules
        SET
          rule_type = $6,
          interval_value = $7,
          weekdays = $8::jsonb,
          day_of_month = $9,
          preferred_time = $10,
          timezone = $11,
          updated_at = $12
        FROM updated_routine
        WHERE routine_rules.routine_id = updated_routine.id
        RETURNING routine_rules.*
      ),
      updated_pending_instances AS (
        UPDATE routine_instances
        SET
          scheduled_time = COALESCE($10::time, $16::time),
          remind_at = (
            (
              routine_instances.scheduled_date::timestamp
              + COALESCE($10::time, $16::time)
            ) AT TIME ZONE $11
          ) - interval '30 minutes',
          reminded_at = NULL,
          updated_at = $12
        FROM updated_routine
        WHERE routine_instances.routine_id = updated_routine.id
          AND routine_instances.user_id = $1
          AND routine_instances.status = 'pending'
          AND routine_instances.scheduled_date >= (
            ($12::timestamptz AT TIME ZONE $11)::date
          )
        RETURNING routine_instances.id
      )
      ${routineSelectFromCtes("updated_routine", "updated_rule")}
      `,
      [...routineParams(input), input.routineId, fallbackRoutineScheduledTime],
    )) as RoutineRow[];

    return rows[0] ? mapRoutine(rows[0]) : null;
  }

  async deleteRoutine(input: {
    userId: string;
    routineId: string;
    occurredAt: Date;
  }) {
    const rows = (await this.getSql()`
      UPDATE routines
      SET deleted_at = ${input.occurredAt},
          updated_at = ${input.occurredAt}
      WHERE user_id = ${input.userId}
        AND id = ${input.routineId}
        AND deleted_at IS NULL
      RETURNING id
    `) as Array<{ id: string }>;

    return rows.length > 0;
  }

  async ensureRoutineInstance(input: {
    userId: string;
    routineId: string;
    scheduledDate: string;
    scheduledTime: string | null;
    remindAt: Date | null;
    occurredAt: Date;
  }) {
    const rows = (await this.getSql().query(
      `
      WITH target AS (
        SELECT id, user_id
        FROM routines
        WHERE id = $2
          AND user_id = $1
          AND deleted_at IS NULL
        LIMIT 1
      ),
      existing_instance AS (
        SELECT routine_instances.*
        FROM routine_instances
        INNER JOIN target ON target.id = routine_instances.routine_id
        WHERE routine_instances.scheduled_date = $3
          AND (
            routine_instances.scheduled_time IS NOT DISTINCT FROM $4::time
            OR (
              $4::time = $7::time
              AND routine_instances.scheduled_time IS NULL
            )
          )
        LIMIT 1
      ),
      inserted_instance AS (
        INSERT INTO routine_instances (
          user_id,
          routine_id,
          scheduled_date,
          scheduled_time,
          remind_at,
          created_at,
          updated_at
        )
        SELECT user_id, id, $3, $4, $6, $5, $5
        FROM target
        WHERE NOT EXISTS (SELECT 1 FROM existing_instance)
        ON CONFLICT DO NOTHING
        RETURNING *
      ),
      updated_existing AS (
        UPDATE routine_instances
        SET
          remind_at = COALESCE(routine_instances.remind_at, $6::timestamptz),
          updated_at = CASE
            WHEN routine_instances.remind_at IS NULL
              AND $6::timestamptz IS NOT NULL
            THEN $5::timestamptz
            ELSE routine_instances.updated_at
          END
        FROM target
        WHERE routine_instances.id IN (SELECT id FROM existing_instance)
          AND routine_instances.status = 'pending'
          AND routine_instances.remind_at IS NULL
          AND $6::timestamptz IS NOT NULL
        RETURNING routine_instances.*
      ),
      selected_instance AS (
        SELECT * FROM inserted_instance
        UNION ALL
        SELECT * FROM updated_existing
        UNION ALL
        SELECT * FROM existing_instance
        WHERE NOT EXISTS (SELECT 1 FROM inserted_instance)
          AND NOT EXISTS (SELECT 1 FROM updated_existing)
        LIMIT 1
      )
      ${routineInstanceSelectFromCte("selected_instance")}
      `,
      [
        input.userId,
        input.routineId,
        input.scheduledDate,
        input.scheduledTime,
        input.occurredAt,
        input.remindAt,
        fallbackRoutineScheduledTime,
      ],
    )) as RoutineInstanceRow[];

    return rows[0] ? mapRoutineInstance(rows[0]) : null;
  }

  async listPendingRoutineInstancesForReminderWindow(input: {
    occurredAt: Date;
    windowMinutes: number;
  }) {
    const rows = (await this.getSql().query(
      `${routineInstanceSelect}
       WHERE routine_instances.status = 'pending'
         AND routine_instances.remind_at IS NOT NULL
         AND routine_instances.reminded_at IS NULL
         AND routine_instances.remind_at >= (
           $1::timestamptz - ($2::int * interval '1 minute')
         )
         AND routine_instances.remind_at <= (
           $1::timestamptz + ($2::int * interval '1 minute')
         )
         AND routines.deleted_at IS NULL
       ORDER BY routine_instances.remind_at, routines.title`,
      [input.occurredAt, input.windowMinutes],
    )) as RoutineInstanceRow[];

    return rows.map(mapRoutineInstance);
  }

  async markRoutineInstanceReminded(input: {
    userId: string;
    instanceId: string;
    remindedAt: Date;
  }) {
    const rows = (await this.getSql().query(
      `
      WITH updated_instance AS (
        UPDATE routine_instances
        SET
          reminded_at = $3::timestamptz,
          updated_at = $3::timestamptz
        WHERE user_id = $1
          AND id = $2
          AND status = 'pending'
        RETURNING *
      )
      ${routineInstanceSelectFromCte("updated_instance")}
      `,
      [input.userId, input.instanceId, input.remindedAt],
    )) as RoutineInstanceRow[];

    return rows[0] ? mapRoutineInstance(rows[0]) : null;
  }

  async listRoutineInstancesForDate(userId: string, scheduledDate: string) {
    const rows = (await this.getSql().query(
      `${routineInstanceSelect}
       WHERE routine_instances.user_id = $1
         AND routine_instances.scheduled_date = $2
         AND routines.deleted_at IS NULL
       ORDER BY routine_instances.scheduled_time NULLS LAST, routines.title`,
      [userId, scheduledDate],
    )) as RoutineInstanceRow[];

    return rows.map(mapRoutineInstance);
  }

  async completeRoutineInstance(input: {
    userId: string;
    instanceId: string;
    occurredAt: Date;
  }) {
    return this.updateRoutineInstanceStatus(input, "completed");
  }

  async skipRoutineInstance(input: {
    userId: string;
    instanceId: string;
    occurredAt: Date;
  }) {
    return this.updateRoutineInstanceStatus(input, "skipped");
  }

  async reopenRoutineInstance(input: {
    userId: string;
    instanceId: string;
    occurredAt: Date;
  }) {
    return this.updateRoutineInstanceStatus(input, "pending");
  }

  private async updateRoutineInstanceStatus(
    input: {
      userId: string;
      instanceId: string;
      occurredAt: Date;
    },
    status: RoutineInstanceStatus,
  ) {
    const rows = (await this.getSql().query(
      `
      WITH updated_instance AS (
        UPDATE routine_instances
        SET
          status = $3::text,
          completed_at = CASE
            WHEN $3::text = 'completed' THEN $4::timestamptz
            ELSE NULL
          END,
          skipped_at = CASE
            WHEN $3::text = 'skipped' THEN $4::timestamptz
            ELSE NULL
          END,
          updated_at = $4::timestamptz
        WHERE user_id = $1
          AND id = $2
        RETURNING *
      ),
      event AS (
        INSERT INTO completion_events (
          user_id,
          target_type,
          target_id,
          event_type,
          occurred_at,
          source
        )
        SELECT user_id, 'routine_instance', id, $3::text, $4::timestamptz, 'web'
        FROM updated_instance
        WHERE $3::text != 'pending'
        RETURNING id
      )
      ${routineInstanceSelectFromCte("updated_instance")}
      `,
      [input.userId, input.instanceId, status, input.occurredAt],
    )) as RoutineInstanceRow[];

    return rows[0] ? mapRoutineInstance(rows[0]) : null;
  }
}
