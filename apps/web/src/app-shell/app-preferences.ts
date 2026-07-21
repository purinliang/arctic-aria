"use client";

import { useCallback, useEffect, useState } from "react";
import {
  defaultLanguage,
  readLanguagePreference,
  resolveLanguage,
} from "../messages/languages.ts";
import type {
  LanguagePreference,
  SupportedLanguage,
} from "../messages/languages.ts";
import {
  readThemePreference,
  readTimeFormatPreference,
  normalizeUserPreferences,
} from "../features/settings/preferences.ts";
import type {
  ThemeMode,
  ThemePreference,
  TimeFormatPreference,
  UserPreferences,
} from "../features/settings/preferences.ts";
import {
  defaultTimeZonePreference,
  readResolvedTimeZone,
  readTimeZonePreference,
  resolveTimeZonePreference,
  type TimeZonePreference,
} from "../features/settings/time-zones.ts";

export type AppLanguage = SupportedLanguage;
export type { ThemeMode, ThemePreference, TimeZonePreference };
export { readThemePreference };

export type BrowserDefaults = {
  language: AppLanguage;
  themeMode: ThemeMode;
  timeZone: string;
};

const defaultBrowserDefaults: BrowserDefaults = {
  language: defaultLanguage,
  themeMode: "light",
  timeZone: "UTC",
};

const themePreferenceStorageKey = "arctic-aria.theme-preference";
const languagePreferenceStorageKey = "arctic-aria.language-preference";
const timeFormatPreferenceStorageKey = "arctic-aria.time-format-preference";
const timeZonePreferenceStorageKey = "arctic-aria.timezone-preference";
const multipleTimezonesEnabledStorageKey =
  "arctic-aria.multiple-timezones-enabled";
const preferenceCacheUpdatedAtStorageKey = "arctic-aria.preferences-updated-at";
const systemDarkModeQuery = "(prefers-color-scheme: dark)";
const timeZonePreferenceUiEnabled = false;
export const recentPreferenceCacheWindowMs = 5_000;

export function detectBrowserLanguage(
  languages: readonly string[] | undefined,
): AppLanguage {
  const normalizedLanguages = languages?.length ? languages : ["en"];

  return normalizedLanguages.some((language) =>
    language.toLowerCase().startsWith("zh"),
  )
    ? "zh-CN"
    : "en";
}

export function resolveThemeMode(
  preference: ThemePreference,
  browserThemeMode: ThemeMode,
): ThemeMode {
  if (preference === "system") {
    return browserThemeMode;
  }

  return preference;
}

export function mergeUserPreferenceUpdate(
  current: UserPreferences,
  input: Partial<UserPreferences>,
) {
  return normalizeUserPreferences({
    ...current,
    ...input,
  });
}

export function hasRecentLocalPreferenceCache(now = Date.now()) {
  try {
    return isRecentPreferenceCacheTimestamp(
      window.localStorage.getItem(preferenceCacheUpdatedAtStorageKey),
      now,
    );
  } catch {
    return false;
  }
}

export function isRecentPreferenceCacheTimestamp(
  value: string | null,
  now: number,
  windowMs = recentPreferenceCacheWindowMs,
) {
  if (value === null) {
    return false;
  }

  const timestamp = Number(value);

  return (
    Number.isFinite(timestamp) &&
    timestamp <= now &&
    now - timestamp < windowMs
  );
}

export function detectBrowserDefaults(): BrowserDefaults {
  if (typeof window === "undefined") {
    return defaultBrowserDefaults;
  }

  return {
    language: detectBrowserLanguage(navigator.languages),
    themeMode: window.matchMedia?.(systemDarkModeQuery).matches
      ? "dark"
      : "light",
    timeZone:
      Intl.DateTimeFormat().resolvedOptions().timeZone ??
      defaultBrowserDefaults.timeZone,
  };
}

export function useAppPreferences() {
  const [browserDefaults, setBrowserDefaults] = useState(detectBrowserDefaults);
  const [themePreference, setThemePreferenceState] =
    useState<ThemePreference>(() =>
      readThemePreference(readStoredThemePreference()),
    );
  const [languagePreference, setLanguagePreference] =
    useState<LanguagePreference>(() =>
      readLanguagePreference(readStoredLanguagePreference()),
    );
  const [timeFormatPreference, setTimeFormatPreferenceState] =
    useState<TimeFormatPreference>(() =>
      readTimeFormatPreference(readStoredTimeFormatPreference()),
    );
  const [timeZonePreference, setTimeZonePreferenceState] =
    useState<TimeZonePreference>(() =>
      readTimeZonePreference(readStoredTimeZonePreference()),
    );
  const [multipleTimezonesEnabled, setMultipleTimezonesEnabledState] =
    useState<boolean>(() => readStoredMultipleTimezonesEnabled());

  useEffect(() => {
    const mediaQuery = window.matchMedia?.(systemDarkModeQuery);

    if (!mediaQuery) {
      return;
    }

    function handleSystemThemeChange(event: MediaQueryListEvent) {
      setBrowserDefaults((current) => ({
        ...current,
        themeMode: event.matches ? "dark" : "light",
      }));
    }

    mediaQuery.addEventListener("change", handleSystemThemeChange);

    return () => {
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
    };
  }, []);

  const setThemePreference = useCallback((preference: ThemePreference) => {
    setThemePreferenceState(preference);
    writeStoredThemePreference(preference);
  }, []);

  const setLanguagePreferenceValue = useCallback(
    (preference: LanguagePreference) => {
      setLanguagePreference(preference);
      writeStoredLanguagePreference(preference);
    },
    [],
  );
  const setTimeFormatPreference = useCallback(
    (preference: TimeFormatPreference) => {
      setTimeFormatPreferenceState(preference);
      writeStoredTimeFormatPreference(preference);
    },
    [],
  );
  const setTimeZonePreference = useCallback(
    (preference: TimeZonePreference) => {
      const normalized = readTimeZonePreference(preference);

      setTimeZonePreferenceState(normalized);
      writeStoredTimeZonePreference(normalized);
    },
    [],
  );
  const setMultipleTimezonesEnabled = useCallback((enabled: boolean) => {
    setMultipleTimezonesEnabledState(enabled);
    writeStoredMultipleTimezonesEnabled(enabled);
  }, []);
  const applyUserPreferences = useCallback((preferences: UserPreferences) => {
    const normalized = normalizeUserPreferences(preferences);
    const activeTimeZonePreference = timeZonePreferenceUiEnabled
      ? normalized.timeZonePreference
      : defaultTimeZonePreference;
    const activeMultipleTimezonesEnabled = timeZonePreferenceUiEnabled
      ? normalized.multipleTimezonesEnabled
      : false;

    setThemePreferenceState(normalized.themePreference);
    setLanguagePreference(normalized.languagePreference);
    setTimeFormatPreferenceState(normalized.timeFormatPreference);
    setTimeZonePreferenceState(activeTimeZonePreference);
    setMultipleTimezonesEnabledState(activeMultipleTimezonesEnabled);
    writeStoredThemePreference(normalized.themePreference);
    writeStoredLanguagePreference(normalized.languagePreference);
    writeStoredTimeFormatPreference(normalized.timeFormatPreference);
    writeStoredTimeZonePreference(activeTimeZonePreference);
    writeStoredMultipleTimezonesEnabled(activeMultipleTimezonesEnabled);
  }, []);

  const activeTimeZonePreference = timeZonePreferenceUiEnabled
    ? timeZonePreference
    : defaultTimeZonePreference;
  const activeMultipleTimezonesEnabled = timeZonePreferenceUiEnabled
    ? multipleTimezonesEnabled
    : false;
  const resolvedBrowserTimeZone = readResolvedTimeZone(browserDefaults.timeZone);

  const resolvedThemeMode = resolveThemeMode(
    themePreference,
    browserDefaults.themeMode,
  );
  const resolvedLanguage = resolveLanguage(
    languagePreference,
    browserDefaults.language,
  );
  const resolvedTimeZone = resolveTimeZonePreference(
    activeTimeZonePreference,
    browserDefaults.timeZone,
  );

  return {
    browserDefaults,
    darkMode: resolvedThemeMode === "dark",
    applyUserPreferences,
    languagePreference,
    multipleTimezonesEnabled: activeMultipleTimezonesEnabled,
    resolvedBrowserTimeZone,
    resolvedLanguage,
    resolvedThemeMode,
    resolvedTimeZone,
    setLanguagePreference: setLanguagePreferenceValue,
    setMultipleTimezonesEnabled,
    setThemePreference,
    setTimeFormatPreference,
    setTimeZonePreference,
    themePreference,
    timeFormatPreference,
    timeZonePreference: activeTimeZonePreference,
  };
}

function readStoredThemePreference() {
  try {
    return window.localStorage.getItem(themePreferenceStorageKey);
  } catch {
    return null;
  }
}

function writeStoredThemePreference(preference: ThemePreference) {
  try {
    window.localStorage.setItem(themePreferenceStorageKey, preference);
    writeStoredPreferenceUpdatedAt();
  } catch {
    // Theme selection still works for the current session if storage is blocked.
  }
}

function readStoredLanguagePreference() {
  try {
    return window.localStorage.getItem(languagePreferenceStorageKey);
  } catch {
    return null;
  }
}

function writeStoredLanguagePreference(preference: LanguagePreference) {
  try {
    window.localStorage.setItem(languagePreferenceStorageKey, preference);
    writeStoredPreferenceUpdatedAt();
  } catch {
    // Language selection still works for the current session if storage is blocked.
  }
}

function readStoredTimeFormatPreference() {
  try {
    return window.localStorage.getItem(timeFormatPreferenceStorageKey);
  } catch {
    return null;
  }
}

function writeStoredTimeFormatPreference(preference: TimeFormatPreference) {
  try {
    window.localStorage.setItem(timeFormatPreferenceStorageKey, preference);
    writeStoredPreferenceUpdatedAt();
  } catch {
    // Time display selection still works if storage is blocked.
  }
}

function readStoredTimeZonePreference() {
  try {
    return window.localStorage.getItem(timeZonePreferenceStorageKey);
  } catch {
    return null;
  }
}

function writeStoredTimeZonePreference(preference: TimeZonePreference) {
  try {
    window.localStorage.setItem(timeZonePreferenceStorageKey, preference);
    writeStoredPreferenceUpdatedAt();
  } catch {
    // Timezone selection still works for the current session if storage is blocked.
  }
}

function readStoredMultipleTimezonesEnabled() {
  try {
    return window.localStorage.getItem(multipleTimezonesEnabledStorageKey) ===
      "true";
  } catch {
    return false;
  }
}

function writeStoredMultipleTimezonesEnabled(enabled: boolean) {
  try {
    window.localStorage.setItem(
      multipleTimezonesEnabledStorageKey,
      enabled ? "true" : "false",
    );
    writeStoredPreferenceUpdatedAt();
  } catch {
    // Multiple-timezone mode still works for the current session if storage is blocked.
  }
}

function writeStoredPreferenceUpdatedAt(now = Date.now()) {
  window.localStorage.setItem(preferenceCacheUpdatedAtStorageKey, `${now}`);
}
