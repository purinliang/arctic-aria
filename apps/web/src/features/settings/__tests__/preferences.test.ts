import assert from "node:assert/strict";
import test from "node:test";
import {
  defaultUserPreferences,
  normalizeUserPreferences,
  readThemePreference,
  readTimeFormatPreference,
} from "../preferences.ts";

test("settings preferences normalize unsupported values to defaults", () => {
  assert.deepEqual(
    normalizeUserPreferences({
      languagePreference: "unsupported" as never,
      themePreference: "blue" as never,
      timeFormatPreference: "system" as never,
    }),
    defaultUserPreferences,
  );
});

test("settings preferences accept supported theme and time values", () => {
  assert.equal(readThemePreference("dark"), "dark");
  assert.equal(readThemePreference("light"), "light");
  assert.equal(readThemePreference("system"), "system");
  assert.equal(readTimeFormatPreference("24h"), "24h");
  assert.equal(readTimeFormatPreference("12h"), "12h");
});
