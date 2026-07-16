import {
  readLanguagePreference,
  type LanguagePreference,
} from "../../messages/languages.ts";

export type ThemeMode = "light" | "dark";
export type ThemePreference = "system" | ThemeMode;
export type TimeFormatPreference = "12h" | "24h";

export type UserPreferences = {
  languagePreference: LanguagePreference;
  themePreference: ThemePreference;
  timeFormatPreference: TimeFormatPreference;
};

export const defaultUserPreferences: UserPreferences = {
  languagePreference: "en",
  themePreference: "system",
  timeFormatPreference: "12h",
};

export function readThemePreference(value: string | null): ThemePreference {
  if (value === "system" || value === "light" || value === "dark") {
    return value;
  }

  return "system";
}

export function readTimeFormatPreference(
  value: string | null | undefined,
): TimeFormatPreference {
  return value === "24h" ? "24h" : "12h";
}

export function normalizeUserPreferences(
  input: Partial<UserPreferences>,
): UserPreferences {
  return {
    languagePreference: readLanguagePreference(input.languagePreference ?? null),
    themePreference: readThemePreference(input.themePreference ?? null),
    timeFormatPreference: readTimeFormatPreference(input.timeFormatPreference),
  };
}
