import {
  readLanguagePreference,
  type LanguagePreference,
} from "../../messages/languages.ts";
import {
  defaultTimeZonePreference,
  readTimeZonePreference,
  type TimeZonePreference,
} from "./time-zones.ts";

export type ThemeMode = "light" | "dark";
export type ThemePreference = "system" | ThemeMode;
export type TimeFormatPreference = "12h" | "24h";

export type UserPreferences = {
  languagePreference: LanguagePreference;
  multipleTimezonesEnabled: boolean;
  themePreference: ThemePreference;
  timeFormatPreference: TimeFormatPreference;
  timeZonePreference: TimeZonePreference;
};

export const defaultUserPreferences: UserPreferences = {
  languagePreference: "en",
  multipleTimezonesEnabled: false,
  themePreference: "system",
  timeFormatPreference: "12h",
  timeZonePreference: defaultTimeZonePreference,
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

export function readMultipleTimezonesEnabled(value: unknown) {
  return value === true;
}

export function normalizeUserPreferences(
  input: Partial<UserPreferences>,
): UserPreferences {
  return {
    languagePreference: readLanguagePreference(input.languagePreference ?? null),
    multipleTimezonesEnabled: readMultipleTimezonesEnabled(
      input.multipleTimezonesEnabled,
    ),
    themePreference: readThemePreference(input.themePreference ?? null),
    timeFormatPreference: readTimeFormatPreference(input.timeFormatPreference),
    timeZonePreference: readTimeZonePreference(input.timeZonePreference),
  };
}
