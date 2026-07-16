import assert from "node:assert/strict";
import test from "node:test";
import {
  dayPeriodForTime,
  defaultTimePartsFromNow,
  formatTimeInputValue,
  parseTypedTimeInput,
  toTimeValue,
} from "../time-picker-utils.ts";

test("typed compact time accepts 910 as 9:10 with fallback period", () => {
  assert.deepEqual(parseTypedTimeInput("910", "AM"), {
    hour12: 9,
    minute: 10,
    period: "AM",
  });
  assert.equal(
    toTimeValue({ hour12: 9, minute: 10, period: "PM" }),
    "21:10",
  );
});

test("time picker day period labels distinguish midnight and night", () => {
  assert.equal(
    dayPeriodForTime({ hour12: 12, minute: 30, period: "AM" }),
    "midnight",
  );
  assert.equal(
    dayPeriodForTime({ hour12: 9, minute: 30, period: "PM" }),
    "night",
  );
});

test("typed 24-hour time maps 19:30 to 7:30 PM", () => {
  assert.deepEqual(parseTypedTimeInput("19:30", "AM"), {
    hour12: 7,
    minute: 30,
    period: "PM",
  });
  assert.deepEqual(parseTypedTimeInput("1930", "AM"), {
    hour12: 7,
    minute: 30,
    period: "PM",
  });
});

test("default time adds 15 minutes and rounds up to the next quarter", () => {
  assert.deepEqual(
    defaultTimePartsFromNow(new Date("2026-07-16T21:20:00")),
    {
      hour12: 9,
      minute: 45,
      period: "PM",
    },
  );
});

test("time picker input display follows time format preference", () => {
  const parts = { hour12: 9, minute: 30, period: "PM" as const };

  assert.equal(formatTimeInputValue(parts, "12h"), "09:30");
  assert.equal(formatTimeInputValue(parts, "24h"), "21:30");
});
