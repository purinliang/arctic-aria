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
    group_id: null,
    group_name: null,
    title: "Visa appointment",
    description: null,
    start_date: dateOnlyValue,
    end_date: null,
    estimated_duration_hours: "1.25",
    location: "Office",
    created_at: new Date("2026-07-22T00:00:00.000Z"),
    updated_at: new Date("2026-07-22T00:00:00.000Z"),
    deleted_at: null,
    rule_id: "event-1-rule",
    rule_type: "once",
    scheduled_time: "09:30:00",
    weekday: null,
    timezone: "UTC",
    rule_created_at: new Date("2026-07-22T00:00:00.000Z"),
    rule_updated_at: new Date("2026-07-22T00:00:00.000Z"),
  } satisfies EventRow);

  assert.equal(event.startDate, "2026-07-22");
  assert.equal(event.rule.scheduledTime, "09:30");
  assert.equal(event.estimatedDurationHours, 1.25);
});
