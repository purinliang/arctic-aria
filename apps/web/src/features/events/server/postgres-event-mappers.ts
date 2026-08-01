import {
  dateOnlyFieldToDateKey,
  nullableTimeOnlyFieldToTime,
} from "../../../server/database/postgres-fields.ts";
import type {
  EventGroupRecord,
  EventInstanceRecord,
  EventRecord,
  EventRuleType,
  SaveEventInput,
} from "./event-repository.ts";

export type EventRow = {
  id: string;
  user_id: string;
  group_id: string | null;
  group_name: string | null;
  title: string;
  description: string | null;
  start_date: Date | string;
  end_date: Date | string | null;
  estimated_duration_hours: number | string | null;
  location: string | null;
  created_at: Date | string;
  updated_at: Date | string;
  deleted_at: Date | string | null;
  rule_id: string;
  rule_type: EventRuleType;
  scheduled_time: string;
  weekday: number | null;
  timezone: string;
  rule_created_at: Date | string;
  rule_updated_at: Date | string;
};

export type EventGroupRow = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: Date | string;
  updated_at: Date | string;
  deleted_at: Date | string | null;
};

export type EventInstanceRow = {
  id: string;
  user_id: string;
  event_id: string;
  title: string;
  description: string | null;
  rule_date: Date | string;
  rule_time: string;
  scheduled_date: Date | string;
  scheduled_time: string;
  estimated_duration_hours: number | string | null;
  location: string | null;
  location_override: string | null;
  status: "scheduled" | "canceled";
  canceled_at: Date | string | null;
  cancellation_reason: string | null;
  rescheduled_at: Date | string | null;
  reschedule_reason: string | null;
  created_at: Date | string;
  updated_at: Date | string;
};

export const eventSelect = `
  SELECT
    events.id,
    events.user_id,
    events.group_id,
    event_groups.name AS group_name,
    events.title,
    events.description,
    events.start_date,
    events.end_date,
    events.estimated_duration_hours,
    events.location,
    events.created_at,
    events.updated_at,
    events.deleted_at,
    event_rules.id AS rule_id,
    event_rules.rule_type,
    event_rules.scheduled_time,
    event_rules.weekday,
    event_rules.timezone,
    event_rules.created_at AS rule_created_at,
    event_rules.updated_at AS rule_updated_at
  FROM events
  INNER JOIN event_rules ON event_rules.event_id = events.id
  LEFT JOIN event_groups
    ON event_groups.id = events.group_id
    AND event_groups.deleted_at IS NULL
`;

export const eventInstanceSelect = `
  SELECT
    event_instances.id,
    event_instances.user_id,
    event_instances.event_id,
    events.title,
    events.description,
    event_instances.rule_date,
    event_instances.rule_time,
    event_instances.scheduled_date,
    event_instances.scheduled_time,
    events.estimated_duration_hours,
    events.location,
    event_instances.location_override,
    event_instances.status,
    event_instances.canceled_at,
    event_instances.cancellation_reason,
    event_instances.rescheduled_at,
    event_instances.reschedule_reason,
    event_instances.created_at,
    event_instances.updated_at
  FROM event_instances
  INNER JOIN events ON events.id = event_instances.event_id
`;

export function mapEvent(row: EventRow): EventRecord {
  return {
    id: row.id,
    userId: row.user_id,
    groupId: row.group_id,
    groupName: row.group_name,
    title: row.title,
    description: row.description,
    startDate: dateOnlyFieldToDateKey(row.start_date),
    endDate: row.end_date ? dateOnlyFieldToDateKey(row.end_date) : null,
    estimatedDurationHours: toNullableNumber(row.estimated_duration_hours),
    location: row.location,
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at),
    deletedAt: toNullableDate(row.deleted_at),
    rule: {
      id: row.rule_id,
      eventId: row.id,
      ruleType: row.rule_type,
      scheduledTime:
        nullableTimeOnlyFieldToTime(row.scheduled_time) ?? row.scheduled_time,
      weekday: row.weekday,
      timezone: row.timezone,
      createdAt: toDate(row.rule_created_at),
      updatedAt: toDate(row.rule_updated_at),
    },
  };
}

export function mapEventGroup(row: EventGroupRow): EventGroupRecord {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description,
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at),
    deletedAt: toNullableDate(row.deleted_at),
  };
}

export function mapEventInstance(
  row: EventInstanceRow,
): EventInstanceRecord {
  const locationOverride = row.location_override;

  return {
    id: row.id,
    userId: row.user_id,
    eventId: row.event_id,
    title: row.title,
    description: row.description,
    ruleDate: dateOnlyFieldToDateKey(row.rule_date),
    ruleTime: nullableTimeOnlyFieldToTime(row.rule_time) ?? row.rule_time,
    scheduledDate: dateOnlyFieldToDateKey(row.scheduled_date),
    scheduledTime:
      nullableTimeOnlyFieldToTime(row.scheduled_time) ?? row.scheduled_time,
    estimatedDurationHours: toNullableNumber(row.estimated_duration_hours),
    location: row.location,
    locationOverride,
    effectiveLocation: locationOverride ?? row.location,
    status: row.status,
    canceledAt: toNullableDate(row.canceled_at),
    cancellationReason: row.cancellation_reason,
    rescheduledAt: toNullableDate(row.rescheduled_at),
    rescheduleReason: row.reschedule_reason,
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at),
  };
}

export function eventParams(input: SaveEventInput) {
  return [
    input.userId,
    input.title,
    input.description,
    input.startDate,
    input.endDate,
    input.estimatedDurationHours,
    input.location,
    input.rule.ruleType,
    input.rule.scheduledTime,
    input.rule.weekday,
    input.rule.timezone,
    input.occurredAt,
    input.groupId,
  ];
}

export function eventSelectFromCtes(eventCte: string, ruleCte: string) {
  return `
    SELECT
      ${eventCte}.id,
      ${eventCte}.user_id,
      ${eventCte}.group_id,
      event_groups.name AS group_name,
      ${eventCte}.title,
      ${eventCte}.description,
      ${eventCte}.start_date,
      ${eventCte}.end_date,
      ${eventCte}.estimated_duration_hours,
      ${eventCte}.location,
      ${eventCte}.created_at,
      ${eventCte}.updated_at,
      ${eventCte}.deleted_at,
      ${ruleCte}.id AS rule_id,
      ${ruleCte}.rule_type,
      ${ruleCte}.scheduled_time,
      ${ruleCte}.weekday,
      ${ruleCte}.timezone,
      ${ruleCte}.created_at AS rule_created_at,
      ${ruleCte}.updated_at AS rule_updated_at
    FROM ${eventCte}
    INNER JOIN ${ruleCte} ON ${ruleCte}.event_id = ${eventCte}.id
    LEFT JOIN event_groups
      ON event_groups.id = ${eventCte}.group_id
      AND event_groups.deleted_at IS NULL
  `;
}

export function eventInstanceSelectFromCte(cteName: string) {
  return `
    SELECT
      ${cteName}.id,
      ${cteName}.user_id,
      ${cteName}.event_id,
      events.title,
      events.description,
      ${cteName}.rule_date,
      ${cteName}.rule_time,
      ${cteName}.scheduled_date,
      ${cteName}.scheduled_time,
      events.estimated_duration_hours,
      events.location,
      ${cteName}.location_override,
      ${cteName}.status,
      ${cteName}.canceled_at,
      ${cteName}.cancellation_reason,
      ${cteName}.rescheduled_at,
      ${cteName}.reschedule_reason,
      ${cteName}.created_at,
      ${cteName}.updated_at
    FROM ${cteName}
    INNER JOIN events ON events.id = ${cteName}.event_id
  `;
}

function toDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}

function toNullableDate(value: Date | string | null) {
  return value ? toDate(value) : null;
}

function toNullableNumber(value: number | string | null) {
  return value === null ? null : Number(value);
}
