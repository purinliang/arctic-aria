import type {
  RoutineInstanceRecord,
  RoutineRecord,
  RoutineRuleRecord,
  RoutineRuleType,
  SaveRoutineInput,
} from "./routine-repository.ts";

export type RoutineRow = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
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

export type RoutineInstanceRow = {
  id: string;
  user_id: string;
  routine_id: string;
  title: string;
  description: string | null;
  scheduled_date: Date | string;
  scheduled_time: string | null;
  status: "pending" | "completed" | "skipped";
  completed_at: Date | string | null;
  skipped_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
};

export const routineSelect = `
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

export const routineInstanceSelect = `
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

export function mapRoutine(row: RoutineRow): RoutineRecord {
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

export function mapRoutineInstance(
  row: RoutineInstanceRow,
): RoutineInstanceRecord {
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

export function routineParams(input: SaveRoutineInput) {
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

export function routineSelectFromCtes(routineCte: string, ruleCte: string) {
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

export function routineInstanceSelectFromCte(cteName: string) {
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
