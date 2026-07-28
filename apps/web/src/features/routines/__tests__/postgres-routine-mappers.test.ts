import assert from "node:assert/strict";
import test from "node:test";
import {
  mapRoutine,
  mapRoutineInstance,
  type RoutineInstanceRow,
  type RoutineRow,
} from "../server/postgres-routine-mappers.ts";

test("routine date-only fields preserve the local calendar date", () => {
  const dateOnlyValue = new Date(2026, 6, 22);
  const routine = mapRoutine({
    id: "routine-1",
    user_id: "user-1",
    group_id: null,
    group_name: null,
    title: "Morning check",
    description: null,
    start_date: dateOnlyValue,
    end_date: dateOnlyValue,
    estimated_duration_minutes: 15,
    created_at: new Date("2026-07-22T00:00:00.000Z"),
    updated_at: new Date("2026-07-22T00:00:00.000Z"),
    deleted_at: null,
    rule_id: "rule-1",
    rule_type: "daily",
    interval_value: null,
    weekdays: null,
    day_of_month: null,
    preferred_time: "08:00:00",
    timezone: "Australia/Melbourne",
    rule_created_at: new Date("2026-07-22T00:00:00.000Z"),
    rule_updated_at: new Date("2026-07-22T00:00:00.000Z"),
  } satisfies RoutineRow);
  const instance = mapRoutineInstance({
    id: "instance-1",
    user_id: "user-1",
    routine_id: "routine-1",
    title: "Morning check",
    description: null,
    scheduled_date: dateOnlyValue,
    scheduled_time: "08:00:00",
    remind_at: null,
    reminded_at: null,
    moved_at: null,
    moved_from_date: dateOnlyValue,
    status: "pending",
    completed_at: null,
    skipped_at: null,
    created_at: new Date("2026-07-22T00:00:00.000Z"),
    updated_at: new Date("2026-07-22T00:00:00.000Z"),
  } satisfies RoutineInstanceRow);

  assert.equal(routine.startDate, "2026-07-22");
  assert.equal(routine.endDate, "2026-07-22");
  assert.equal(routine.estimatedDurationMinutes, 15);
  assert.equal(instance.scheduledDate, "2026-07-22");
  assert.equal(instance.movedFromDate, "2026-07-22");
});
