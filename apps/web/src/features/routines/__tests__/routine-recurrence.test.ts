import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeRoutineRecurrence,
  previewRoutineDateKeys,
  recurrenceOptionFromRule,
} from "../routine-recurrence.ts";

test("weekly recurrence derives weekday from first start date", () => {
  assert.deepEqual(
    normalizeRoutineRecurrence({
      firstStartDate: "2026-07-16",
      ruleType: "weekly",
    }),
    {
      ruleType: "weekly",
      intervalValue: null,
      weekdays: [4],
      dayOfMonth: null,
    },
  );
});

test("monthly recurrence derives day from first start date", () => {
  assert.deepEqual(
    normalizeRoutineRecurrence({
      firstStartDate: "2026-07-16",
      ruleType: "monthly_by_date",
      intervalValue: 3,
      dayOfMonth: 1,
    }),
    {
      ruleType: "monthly_by_date",
      intervalValue: 1,
      weekdays: null,
      dayOfMonth: 16,
    },
  );
});

test("fixed day interval defaults to 90 days", () => {
  assert.deepEqual(
    normalizeRoutineRecurrence({
      firstStartDate: "2026-07-16",
      ruleType: "day_interval",
      intervalValue: null,
    }),
    {
      ruleType: "day_interval",
      intervalValue: 90,
      weekdays: null,
      dayOfMonth: null,
    },
  );
});

test("recurrence option distinguishes every 30 days from fixed days", () => {
  assert.equal(
    recurrenceOptionFromRule({ ruleType: "day_interval", intervalValue: 30 }),
    "every_30_days",
  );
  assert.equal(
    recurrenceOptionFromRule({ ruleType: "day_interval", intervalValue: 90 }),
    "fixed_days",
  );
});

test("routine preview shows first three weekly dates and continuation", () => {
  assert.deepEqual(
    previewRoutineDateKeys({
      firstStartDate: "2026-07-16",
      ruleType: "weekly",
    }),
    {
      dates: ["2026-07-16", "2026-07-23", "2026-07-30"],
      continues: true,
    },
  );
});

test("routine preview respects inclusive end date", () => {
  assert.deepEqual(
    previewRoutineDateKeys({
      firstStartDate: "2026-07-16",
      endDate: "2026-07-23",
      ruleType: "weekly",
    }),
    {
      dates: ["2026-07-16", "2026-07-23"],
      continues: false,
    },
  );
});
