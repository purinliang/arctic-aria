import assert from "node:assert/strict";
import test from "node:test";
import { validateRoutineInput } from "../routine-action-helpers.ts";

test("routine validation reports missing start dates with structured metadata", () => {
  assert.deepEqual(
    validateRoutineInput({
      title: "Morning walk",
      description: "",
      startDate: "   ",
      ruleType: "daily",
      timezone: "UTC",
    }),
    {
      ok: false,
      message: "Choose a start date.",
      code: "routine_start_date_missing",
      category: "missing_parameter",
      field: "start_date",
      reason: "required",
    },
  );
});

test("routine validation rejects malformed group ids", () => {
  const result = validateRoutineInput({
    groupId: "not-a-uuid",
    title: "Morning walk",
    description: "",
    startDate: "2026-07-22",
    ruleType: "daily",
    timezone: "UTC",
  });

  assert.equal(result.ok, false);

  if (!result.ok) {
    assert.equal(result.code, "routine_group_invalid");
    assert.equal(result.field, "group");
  }
});

test("routine validation accepts optional estimated duration minutes", () => {
  const result = validateRoutineInput({
    title: "Morning walk",
    description: "",
    startDate: "2026-07-22",
    estimatedDurationMinutes: "20",
    ruleType: "daily",
    timezone: "UTC",
  });

  assert.equal(result.ok, true);

  if (result.ok) {
    assert.equal(result.estimatedDurationMinutes, 20);
  }
});

test("routine validation rejects estimated durations over one day", () => {
  assert.deepEqual(
    validateRoutineInput({
      title: "Morning walk",
      description: "",
      startDate: "2026-07-22",
      estimatedDurationMinutes: "1441",
      ruleType: "daily",
      timezone: "UTC",
    }),
    {
      ok: false,
      message:
        "Estimated duration must be a positive whole number up to 1440 minutes.",
      code: "routine_estimated_duration_invalid",
      category: "invalid_parameter",
      subject: "routine",
      field: "estimated_duration",
      reason: "invalid_value",
      limit: 1440,
    },
  );
});
