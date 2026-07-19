import type { NeonQueryFunction } from "@neondatabase/serverless";
import { getSql } from "../../../server/database/neon.ts";
import {
  defaultUserPreferences,
  normalizeUserPreferences,
  type UserPreferences,
} from "../preferences.ts";

type Sql = NeonQueryFunction<false, false>;

type UserSettingsRow = {
  language_preference: string;
  multiple_timezones_enabled: boolean;
  theme_preference: string;
  time_format_preference: string;
  timezone_preference: string;
};

function mapRow(row: UserSettingsRow): UserPreferences {
  return normalizeUserPreferences({
    languagePreference: row.language_preference as UserPreferences["languagePreference"],
    multipleTimezonesEnabled: row.multiple_timezones_enabled,
    themePreference: row.theme_preference as UserPreferences["themePreference"],
    timeFormatPreference:
      row.time_format_preference as UserPreferences["timeFormatPreference"],
    timeZonePreference: row.timezone_preference,
  });
}

export class PostgresUserSettingsRepository {
  private readonly sql?: Sql;

  constructor(sql?: Sql) {
    this.sql = sql;
  }

  async getOrCreate(userId: string) {
    const existing = await this.find(userId);

    if (existing) {
      return existing;
    }

    return this.upsert(userId, defaultUserPreferences);
  }

  async upsert(userId: string, preferences: UserPreferences) {
    const normalized = normalizeUserPreferences(preferences);
    const rows = (await this.getSql().query(
      `INSERT INTO user_settings (
         user_id, theme_preference, language_preference,
         time_format_preference, timezone_preference,
         multiple_timezones_enabled, created_at, updated_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, now(), now())
       ON CONFLICT (user_id) DO UPDATE SET
         theme_preference = EXCLUDED.theme_preference,
         language_preference = EXCLUDED.language_preference,
         time_format_preference = EXCLUDED.time_format_preference,
         timezone_preference = EXCLUDED.timezone_preference,
         multiple_timezones_enabled = EXCLUDED.multiple_timezones_enabled,
         updated_at = now()
       RETURNING theme_preference, language_preference, time_format_preference,
         timezone_preference, multiple_timezones_enabled`,
      [
        userId,
        normalized.themePreference,
        normalized.languagePreference,
        normalized.timeFormatPreference,
        normalized.timeZonePreference,
        normalized.multipleTimezonesEnabled,
      ],
    )) as UserSettingsRow[];

    return rows[0] ? mapRow(rows[0]) : normalized;
  }

  private async find(userId: string) {
    const rows = (await this.getSql().query(
      `SELECT theme_preference, language_preference, time_format_preference,
         timezone_preference, multiple_timezones_enabled
       FROM user_settings
       WHERE user_id = $1
       LIMIT 1`,
      [userId],
    )) as UserSettingsRow[];

    return rows[0] ? mapRow(rows[0]) : null;
  }

  private getSql() {
    return this.sql ?? getSql();
  }
}
