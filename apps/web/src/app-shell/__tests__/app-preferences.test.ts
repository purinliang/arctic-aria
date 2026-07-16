import assert from "node:assert/strict";
import test from "node:test";
import {
  detectBrowserDefaults,
  detectBrowserLanguage,
  readThemePreference,
  resolveThemeMode,
} from "../app-preferences.ts";

test("theme preference parsing falls back to system", () => {
  assert.equal(readThemePreference("dark"), "dark");
  assert.equal(readThemePreference("light"), "light");
  assert.equal(readThemePreference("system"), "system");
  assert.equal(readThemePreference("unknown"), "system");
  assert.equal(readThemePreference(null), "system");
});

test("browser language detection maps Chinese languages to zh-CN", () => {
  assert.equal(detectBrowserLanguage(["en-US"]), "en");
  assert.equal(detectBrowserLanguage(["zh-TW", "en-US"]), "zh-CN");
  assert.equal(detectBrowserLanguage(["fr-FR", "zh-CN"]), "zh-CN");
  assert.equal(detectBrowserLanguage(undefined), "en");
});

test("theme preference resolves against browser theme", () => {
  assert.equal(resolveThemeMode("system", "dark"), "dark");
  assert.equal(resolveThemeMode("system", "light"), "light");
  assert.equal(resolveThemeMode("dark", "light"), "dark");
  assert.equal(resolveThemeMode("light", "dark"), "light");
});

test("browser defaults use safe server fallback", () => {
  assert.deepEqual(detectBrowserDefaults(), {
    language: "en",
    themeMode: "light",
    timeZone: "UTC",
  });
});
