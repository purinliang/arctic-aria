import assert from "node:assert/strict";
import test from "node:test";
import { validateRoutineInput } from "../routine-action-helpers.ts";

test("routine validation reports missing first start dates with structured metadata", () => {
  assert.deepEqual(
    validateRoutineInput({
      title: "Morning walk",
      description: "",
      firstStartDate: "   ",
      ruleType: "daily",
      timezone: "UTC",
    }),
    {
      ok: false,
      message: "Choose a first start date.",
      code: "routine_first_start_date_missing",
      category: "missing_parameter",
      field: "first_start_date",
      reason: "required",
    },
  );
});
