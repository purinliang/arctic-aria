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

export type AppLanguage = SupportedLanguage;
export type { ThemeMode, ThemePreference };
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
const systemDarkModeQuery = "(prefers-color-scheme: dark)";

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
  const applyUserPreferences = useCallback((preferences: UserPreferences) => {
    const normalized = normalizeUserPreferences(preferences);

    setThemePreferenceState(normalized.themePreference);
    setLanguagePreference(normalized.languagePreference);
    setTimeFormatPreferenceState(normalized.timeFormatPreference);
    writeStoredThemePreference(normalized.themePreference);
    writeStoredLanguagePreference(normalized.languagePreference);
    writeStoredTimeFormatPreference(normalized.timeFormatPreference);
  }, []);

  const resolvedThemeMode = resolveThemeMode(
    themePreference,
    browserDefaults.themeMode,
  );
  const resolvedLanguage = resolveLanguage(
    languagePreference,
    browserDefaults.language,
  );

  return {
    browserDefaults,
    darkMode: resolvedThemeMode === "dark",
    applyUserPreferences,
    languagePreference,
    resolvedLanguage,
    resolvedThemeMode,
    setLanguagePreference: setLanguagePreferenceValue,
    setThemePreference,
    setTimeFormatPreference,
    themePreference,
    timeFormatPreference,
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
  } catch {
    // Time display selection still works if storage is blocked.
  }
}
