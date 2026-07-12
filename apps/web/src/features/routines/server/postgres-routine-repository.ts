import type { NeonQueryFunction } from "@neondatabase/serverless";
import { getSql } from "../../../server/database/neon.ts";
import type {
  RoutineInstanceRecord,
  RoutineRecord,
  RoutineRepository,
  RoutineRuleRecord,
  RoutineRuleType,
  SaveRoutineInput,
} from "./routine-repository.ts";

type RoutineRow = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  status: "active" | "deleted";
  first_start_date: Date | string;
  end_date: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
  rule_id: string;
  rule_type: RoutineRuleType;
  interval_value: number | null;
  weekdays: number[] | string | null;
  day_of_month: number | null;
  preferred_time: string | null;
  timezone: string;
  rule_created_at: Date | string;
  rule_updated_at: Date | string;
};

type RoutineInstanceRow = {
  id: string;
  user_id: string;
  routine_id: string;
  title: string;
  description: string;
  scheduled_date: Date | string;
  scheduled_time: string | null;
  status: "pending" | "completed" | "skipped";
  completed_at: Date | string | null;
  skipped_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
};

function toDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}

function toNullableDate(value: Date | string | null) {
  return value ? toDate(value) : null;
}

function toDateString(value: Date | string) {
  if (typeof value === "string") {
    return value.slice(0, 10);
  }

  return value.toISOString().slice(0, 10);
}

function normalizeTime(value: string | null) {
  return value ? value.slice(0, 5) : null;
}

function normalizeWeekdays(value: number[] | string | null) {
  if (!value) {
    return null;
  }

  if (Array.isArray(value)) {
    return value;
  }

  const parsed = JSON.parse(value) as unknown;

  return Array.isArray(parsed)
    ? parsed.filter((day): day is number => Number.isInteger(day))
    : null;
}

function mapRoutine(row: RoutineRow): RoutineRecord {
  const rule: RoutineRuleRecord = {
    id: row.rule_id,
    routineId: row.id,
    ruleType: row.rule_type,
    intervalValue: row.interval_value,
    weekdays: normalizeWeekdays(row.weekdays),
    dayOfMonth: row.day_of_month,
    preferredTime: normalizeTime(row.preferred_time),
    timezone: row.timezone,
    createdAt: toDate(row.rule_created_at),
    updatedAt: toDate(row.rule_updated_at),
  };

  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    status: row.status,
    firstStartDate: toDateString(row.first_start_date),
    endDate: row.end_date ? toDateString(row.end_date) : null,
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at),
    rule,
  };
}

function mapRoutineInstance(row: RoutineInstanceRow): RoutineInstanceRecord {
  return {
    id: row.id,
    userId: row.user_id,
    routineId: row.routine_id,
    title: row.title,
    description: row.description,
    scheduledDate: toDateString(row.scheduled_date),
    scheduledTime: normalizeTime(row.scheduled_time),
    status: row.status,
    completedAt: toNullableDate(row.completed_at),
    skippedAt: toNullableDate(row.skipped_at),
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at),
  };
}

const routineSelect = `
  SELECT
    routines.id,
    routines.user_id,
    routines.title,
    routines.description,
    routines.status,
    routines.first_start_date,
    routines.end_date,
    routines.created_at,
    routines.updated_at,
    routine_rules.id AS rule_id,
    routine_rules.rule_type,
    routine_rules.interval_value,
    routine_rules.weekdays,
    routine_rules.day_of_month,
    routine_rules.preferred_time,
    routine_rules.timezone,
    routine_rules.created_at AS rule_created_at,
    routine_rules.updated_at AS rule_updated_at
  FROM routines
  INNER JOIN routine_rules ON routine_rules.routine_id = routines.id
`;

const routineInstanceSelect = `
  SELECT
    routine_instances.id,
    routine_instances.user_id,
    routine_instances.routine_id,
    routines.title,
    routines.description,
    routine_instances.scheduled_date,
    routine_instances.scheduled_time,
    routine_instances.status,
    routine_instances.completed_at,
    routine_instances.skipped_at,
    routine_instances.created_at,
    routine_instances.updated_at
  FROM routine_instances
  INNER JOIN routines ON routines.id = routine_instances.routine_id
`;

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
         AND routines.status != 'deleted'
       ORDER BY routines.created_at DESC`,
      [userId],
    )) as RoutineRow[];

    return rows.map(mapRoutine);
  }

  async listActiveRoutines(userId: string) {
    const rows = (await this.getSql().query(
      `${routineSelect}
       WHERE routines.user_id = $1
         AND routines.status = 'active'
       ORDER BY routines.created_at DESC`,
      [userId],
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
          AND status != 'deleted'
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
      SET status = 'deleted',
          updated_at = ${input.occurredAt}
      WHERE user_id = ${input.userId}
        AND id = ${input.routineId}
        AND status != 'deleted'
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
          AND status = 'active'
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
         AND routines.status != 'deleted'
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

  private async updateRoutineInstanceStatus(
    input: {
      userId: string;
      instanceId: string;
      occurredAt: Date;
    },
    status: "completed" | "skipped",
  ) {
    const rows = (await this.getSql().query(
      `
      WITH updated_instance AS (
        UPDATE routine_instances
        SET
          status = $3,
          completed_at = CASE WHEN $3 = 'completed' THEN $4 ELSE NULL END,
          skipped_at = CASE WHEN $3 = 'skipped' THEN $4 ELSE NULL END,
          updated_at = $4
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
        SELECT user_id, 'routine_instance', id, $3, $4, 'web'
        FROM updated_instance
        RETURNING id
      )
      ${routineInstanceSelectFromCte("updated_instance")}
      `,
      [input.userId, input.instanceId, status, input.occurredAt],
    )) as RoutineInstanceRow[];

    return rows[0] ? mapRoutineInstance(rows[0]) : null;
  }
}

function routineParams(input: SaveRoutineInput) {
  return [
    input.userId,
    input.title,
    input.description,
    input.firstStartDate,
    input.endDate,
    input.rule.ruleType,
    input.rule.intervalValue,
    JSON.stringify(input.rule.weekdays),
    input.rule.dayOfMonth,
    input.rule.preferredTime,
    input.rule.timezone,
    input.occurredAt,
  ];
}

function routineSelectFromCtes(routineCte: string, ruleCte: string) {
  return `
    SELECT
      ${routineCte}.id,
      ${routineCte}.user_id,
      ${routineCte}.title,
      ${routineCte}.description,
      ${routineCte}.status,
      ${routineCte}.first_start_date,
      ${routineCte}.end_date,
      ${routineCte}.created_at,
      ${routineCte}.updated_at,
      ${ruleCte}.id AS rule_id,
      ${ruleCte}.rule_type,
      ${ruleCte}.interval_value,
      ${ruleCte}.weekdays,
      ${ruleCte}.day_of_month,
      ${ruleCte}.preferred_time,
      ${ruleCte}.timezone,
      ${ruleCte}.created_at AS rule_created_at,
      ${ruleCte}.updated_at AS rule_updated_at
    FROM ${routineCte}
    INNER JOIN ${ruleCte} ON ${ruleCte}.routine_id = ${routineCte}.id
  `;
}

function routineInstanceSelectFromCte(cteName: string) {
  return `
    SELECT
      ${cteName}.id,
      ${cteName}.user_id,
      ${cteName}.routine_id,
      routines.title,
      routines.description,
      ${cteName}.scheduled_date,
      ${cteName}.scheduled_time,
      ${cteName}.status,
      ${cteName}.completed_at,
      ${cteName}.skipped_at,
      ${cteName}.created_at,
      ${cteName}.updated_at
    FROM ${cteName}
    INNER JOIN routines ON routines.id = ${cteName}.routine_id
  `;
}
