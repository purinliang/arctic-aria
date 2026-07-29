import assert from "node:assert/strict";
import test from "node:test";
import {
  mapEvent,
  type EventRow,
} from "../server/postgres-event-mappers.ts";

test("event date and time fields preserve plain local values", () => {
  const dateOnlyValue = new Date(2026, 6, 22);
  const event = mapEvent({
    id: "event-1",
    user_id: "user-1",
    title: "Visa appointment",
    description: null,
    event_date: dateOnlyValue,
    event_time: "09:30:00",
    estimated_duration_hours: "1.25",
    location: "Office",
    created_at: new Date("2026-07-22T00:00:00.000Z"),
    updated_at: new Date("2026-07-22T00:00:00.000Z"),
    deleted_at: null,
  } satisfies EventRow);

  assert.equal(event.eventDate, "2026-07-22");
  assert.equal(event.eventTime, "09:30");
  assert.equal(event.estimatedDurationHours, 1.25);
});
