"use client";

import { useCallback, useEffect, useState } from "react";

export type ThemeMode = "light" | "dark";
export type ThemePreference = "system" | ThemeMode;
export type AppLanguage = "en" | "zh-CN";
export type LanguagePreference = "en";

export type BrowserDefaults = {
  language: AppLanguage;
  themeMode: ThemeMode;
  timeZone: string;
};

const defaultBrowserDefaults: BrowserDefaults = {
  language: "en",
  themeMode: "light",
  timeZone: "UTC",
};

const themePreferenceStorageKey = "arctic-aria.theme-preference";
const systemDarkModeQuery = "(prefers-color-scheme: dark)";

export function readThemePreference(value: string | null): ThemePreference {
  if (value === "system" || value === "light" || value === "dark") {
    return value;
  }

  return "system";
}

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
    useState<LanguagePreference>("en");

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

  const resolvedThemeMode = resolveThemeMode(
    themePreference,
    browserDefaults.themeMode,
  );

  return {
    browserDefaults,
    darkMode: resolvedThemeMode === "dark",
    languagePreference,
    resolvedLanguage: languagePreference,
    resolvedThemeMode,
    setLanguagePreference,
    setThemePreference,
    themePreference,
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
