import type { NeonQueryFunction } from "@neondatabase/serverless";
import { getSql } from "../../../server/database/neon.ts";
import type {
  RoutineInstanceStatus,
  RoutineRepository,
  SaveRoutineInput,
} from "./routine-repository.ts";
import {
  mapRoutine,
  mapRoutineInstance,
  routineInstanceSelect,
  routineInstanceSelectFromCte,
  routineParams,
  routineSelect,
  routineSelectFromCtes,
} from "./postgres-routine-mappers.ts";
import type {
  RoutineInstanceRow,
  RoutineRow,
} from "./postgres-routine-mappers.ts";

export class PostgresRoutineRepository implements RoutineRepository {
  private readonly sql?: NeonQueryFunction<false, false>;

  constructor(sql?: NeonQueryFunction<false, false>) {
    this.sql = sql;
  }

  private getSql() {
    return this.sql ?? getSql();
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
         AND routine_rules.preferred_time IS NOT NULL
       ORDER BY routine_rules.preferred_time, routines.created_at`,
      [],
    )) as RoutineRow[];

    return rows.map(mapRoutine);
  }

  async createRoutine(input: SaveRoutineInput) {
    const rows = (await this.getSql().query(
      `
      WITH inserted_routine AS (
        INSERT INTO routines (
          user_id,
          title,
          description,
          first_start_date,
          end_date,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $12, $12)
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
      WITH updated_routine AS (
        UPDATE routines
        SET
          title = $2,
          description = $3,
          first_start_date = $4,
          end_date = $5,
          updated_at = $12
        WHERE user_id = $1
          AND id = $13
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
      )
      ${routineSelectFromCtes("updated_routine", "updated_rule")}
      `,
      [...routineParams(input), input.routineId],
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
      inserted_instance AS (
        INSERT INTO routine_instances (
          user_id,
          routine_id,
          scheduled_date,
          scheduled_time,
          created_at,
          updated_at
        )
        SELECT user_id, id, $3, $4, $5, $5
        FROM target
        ON CONFLICT DO NOTHING
        RETURNING *
      ),
      selected_instance AS (
        SELECT * FROM inserted_instance
        UNION ALL
        SELECT routine_instances.*
        FROM routine_instances
        INNER JOIN target ON target.id = routine_instances.routine_id
        WHERE routine_instances.scheduled_date = $3
          AND routine_instances.scheduled_time IS NOT DISTINCT FROM $4::time
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
      ],
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
