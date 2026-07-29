import {
  dateOnlyFieldToDateKey,
  nullableTimeOnlyFieldToTime,
} from "../../../server/database/postgres-fields.ts";
import type { EventRecord, SaveEventInput } from "./event-repository.ts";

export type EventRow = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  event_date: Date | string;
  event_time: string;
  estimated_duration_hours: number | string | null;
  location: string | null;
  created_at: Date | string;
  updated_at: Date | string;
  deleted_at: Date | string | null;
};

export const eventSelect = `
  SELECT
    id,
    user_id,
    title,
    description,
    event_date,
    event_time,
    estimated_duration_hours,
    location,
    created_at,
    updated_at,
    deleted_at
  FROM events
`;

export function mapEvent(row: EventRow): EventRecord {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    eventDate: dateOnlyFieldToDateKey(row.event_date),
    eventTime: nullableTimeOnlyFieldToTime(row.event_time) ?? row.event_time,
    estimatedDurationHours: toNullableNumber(row.estimated_duration_hours),
    location: row.location,
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at),
    deletedAt: toNullableDate(row.deleted_at),
  };
}

export function eventParams(input: SaveEventInput) {
  return [
    input.userId,
    input.title,
    input.description,
    input.eventDate,
    input.eventTime,
    input.estimatedDurationHours,
    input.location,
    input.occurredAt,
  ];
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
