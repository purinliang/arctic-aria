import assert from "node:assert/strict";
import test from "node:test";
import {
  dateOnlyFieldToDateKey,
  nullableDateOnlyFieldToDateKey,
  nullableTimeOnlyFieldToTime,
} from "../postgres-fields.ts";

test("date-only fields preserve Date local calendar parts", () => {
  const dateOnlyValue = new Date(2026, 6, 22);

  assert.equal(dateOnlyFieldToDateKey(dateOnlyValue), "2026-07-22");
});

test("date-only fields preserve string calendar parts", () => {
  assert.equal(dateOnlyFieldToDateKey("2026-07-22"), "2026-07-22");
  assert.equal(dateOnlyFieldToDateKey("2026-07-22T00:00:00.000Z"), "2026-07-22");
  assert.equal(nullableDateOnlyFieldToDateKey(null), null);
});

test("time-only fields use HH:mm display precision", () => {
  assert.equal(nullableTimeOnlyFieldToTime("08:30:00"), "08:30");
  assert.equal(nullableTimeOnlyFieldToTime("08:30"), "08:30");
  assert.equal(nullableTimeOnlyFieldToTime(null), null);
});
