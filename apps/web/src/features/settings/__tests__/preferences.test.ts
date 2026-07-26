import assert from "node:assert/strict";
import test from "node:test";
import {
  defaultUserPreferences,
  normalizeUserPreferences,
  readMultipleTimezonesEnabled,
  readThemePreference,
  readTimeFormatPreference,
} from "../preferences.ts";
import {
  localCalendarParts,
  localDateKey,
  localDateTimeParts,
  localScheduledDateKey,
  localScheduledDayProgress,
  localScheduledDayStartHour,
  readTimeZonePreference,
  resolveTimeZonePreference,
  selectableTimeZones,
  timeZoneOffsetMinutes,
  zonedDateTimeToUtcDate,
} from "../time-zones.ts";

test("settings preferences normalize unsupported values to defaults", () => {
  assert.deepEqual(
    normalizeUserPreferences({
      languagePreference: "unsupported" as never,
      multipleTimezonesEnabled: "yes" as never,
      resolvedTimeZone: "not-a-timezone",
      themePreference: "blue" as never,
      timeFormatPreference: "system" as never,
      timeZonePreference: "not-a-timezone",
    }),
    defaultUserPreferences,
  );
});

test("settings preferences accept supported theme, time, and timezone values", () => {
  assert.equal(readThemePreference("dark"), "dark");
  assert.equal(readThemePreference("light"), "light");
  assert.equal(readThemePreference("system"), "system");
  assert.equal(readTimeFormatPreference("24h"), "24h");
  assert.equal(readTimeFormatPreference("12h"), "12h");
  assert.equal(readTimeZonePreference("system"), "system");
  assert.equal(readTimeZonePreference("Australia/Melbourne"), "Australia/Melbourne");
  assert.equal(readTimeZonePreference("not-a-timezone"), "system");
  assert.equal(readMultipleTimezonesEnabled(true), true);
  assert.equal(readMultipleTimezonesEnabled(false), false);
  assert.equal(readMultipleTimezonesEnabled("true"), false);
  assert.equal(
    normalizeUserPreferences({ resolvedTimeZone: "Australia/Sydney" })
      .resolvedTimeZone,
    "Australia/Sydney",
  );
  assert.equal(
    normalizeUserPreferences({ resolvedTimeZone: "system" }).resolvedTimeZone,
    null,
  );
});

test("timezone preference resolves system against browser timezone", () => {
  assert.equal(
    resolveTimeZonePreference("system", "Australia/Melbourne"),
    "Australia/Melbourne",
  );
  assert.equal(resolveTimeZonePreference("UTC", "Australia/Melbourne"), "UTC");
  assert.equal(resolveTimeZonePreference("system", "not-a-timezone"), "UTC");
});

test("timezone helpers derive local calendar dates", () => {
  const date = new Date("2026-07-21T23:30:00.000Z");

  assert.equal(localDateKey(date, "UTC"), "2026-07-21");
  assert.equal(localDateKey(date, "Australia/Sydney"), "2026-07-22");
  assert.deepEqual(localCalendarParts(date, "Australia/Sydney"), {
    dateKey: "2026-07-22",
    day: 22,
    weekday: 3,
  });
  assert.deepEqual(localDateTimeParts(date, "Australia/Sydney"), {
    dateKey: "2026-07-22",
    day: 22,
    hour: 9,
    minute: 30,
    second: 0,
    timeZone: "Australia/Sydney",
    weekday: 3,
  });
  assert.equal(localDateTimeParts(date, "not-a-timezone"), null);
});

test("timezone helpers use the shared scheduled day boundary", () => {
  assert.equal(localScheduledDayStartHour, 4);
  assert.equal(
    localScheduledDateKey({
      date: new Date("2026-07-21T17:30:00.000Z"),
      timeZone: "Australia/Sydney",
    }),
    "2026-07-21",
  );
  assert.equal(
    localScheduledDateKey({
      date: new Date("2026-07-21T18:00:00.000Z"),
      timeZone: "Australia/Sydney",
    }),
    "2026-07-22",
  );
  assert.equal(
    localScheduledDayProgress({
      date: new Date("2026-07-21T18:00:00.000Z"),
      timeZone: "Australia/Sydney",
    }),
    0,
  );
  assert.equal(
    localScheduledDayProgress({
      date: new Date("2026-07-22T06:00:00.000Z"),
      timeZone: "Australia/Sydney",
    }),
    0.5,
  );
  assert.equal(
    localScheduledDayProgress({
      date: new Date("2026-07-21T17:30:00.000Z"),
      timeZone: "Australia/Sydney",
    }),
    23.5 / 24,
  );
});

test("timezone selector keeps valid extra zones available", () => {
  const options = selectableTimeZones([
    "Australia/Melbourne",
    "not-a-timezone",
  ]);

  assert.ok(options.includes("Australia/Melbourne"));
  assert.ok(!options.includes("not-a-timezone"));
});

test("timezone helpers account for Melbourne daylight saving offsets", () => {
  assert.equal(
    timeZoneOffsetMinutes(
      "Australia/Melbourne",
      new Date("2026-07-01T00:00:00.000Z"),
    ),
    600,
  );
  assert.equal(
    timeZoneOffsetMinutes(
      "Australia/Melbourne",
      new Date("2026-01-01T00:00:00.000Z"),
    ),
    660,
  );
  assert.equal(
    zonedDateTimeToUtcDate({
      dateKey: "2026-07-01",
      time: "09:30",
      timeZone: "Australia/Melbourne",
    })?.toISOString(),
    "2026-06-30T23:30:00.000Z",
  );
  assert.equal(
    zonedDateTimeToUtcDate({
      dateKey: "2026-01-01",
      time: "09:30",
      timeZone: "Australia/Melbourne",
    })?.toISOString(),
    "2025-12-31T22:30:00.000Z",
  );
});
