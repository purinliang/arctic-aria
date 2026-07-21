import {
  normalizeUserPreferences,
  type UserPreferences,
} from "../preferences.ts";
import { readResolvedTimeZone } from "../time-zones.ts";
import { PostgresUserSettingsRepository } from "./postgres-user-settings-repository.ts";
import type { ActionFailureResult } from "../../../messages/action-result.ts";

export type SettingsActionResult =
  | {
      ok: true;
      code: "settings_preferences_saved" | "settings_preferences_loaded";
      preferences: UserPreferences;
    }
  | (ActionFailureResult & {
      code:
        | "settings_unauthorized"
        | "settings_resolved_timezone_invalid"
        | "settings_timezone_preferences_disabled"
        | "settings_preferences_unavailable"
        | "settings_preferences_save_failed";
    });

type UserSettingsRepository = {
  getOrCreate(userId: string): Promise<UserPreferences>;
  upsert(userId: string, preferences: UserPreferences): Promise<UserPreferences>;
  updateResolvedTimeZone(
    userId: string,
    resolvedTimeZone: string,
  ): Promise<UserPreferences>;
};

export function createSettingsService(
  settings: UserSettingsRepository = new PostgresUserSettingsRepository(),
) {
  return {
    async getPreferences(userId: string): Promise<SettingsActionResult> {
      try {
        return {
          ok: true,
          code: "settings_preferences_loaded",
          preferences: await settings.getOrCreate(userId),
        };
      } catch {
        return unavailableResult();
      }
    },

    async savePreferences(
      userId: string,
      preferences: UserPreferences,
    ): Promise<SettingsActionResult> {
      try {
        return {
          ok: true,
          code: "settings_preferences_saved",
          preferences: await settings.upsert(
            userId,
            normalizeUserPreferences(preferences),
          ),
        };
      } catch {
        return {
          ok: false,
          code: "settings_preferences_save_failed",
          message: "Settings could not be saved.",
          category: "database_update",
          action: "save",
          subject: "settings",
        };
      }
    },

    async saveResolvedTimeZone(
      userId: string,
      input: string,
    ): Promise<SettingsActionResult> {
      const resolvedTimeZone = readResolvedTimeZone(input);

      if (!resolvedTimeZone) {
        return {
          ok: false,
          code: "settings_resolved_timezone_invalid",
          message: "Timezone could not be resolved.",
          category: "invalid_parameter",
          subject: "settings",
          field: "timezone",
          reason: "invalid_value",
        };
      }

      try {
        return {
          ok: true,
          code: "settings_preferences_saved",
          preferences: await settings.updateResolvedTimeZone(
            userId,
            resolvedTimeZone,
          ),
        };
      } catch {
        return {
          ok: false,
          code: "settings_preferences_save_failed",
          message: "Settings could not be saved.",
          category: "database_update",
          action: "save",
          subject: "settings",
        };
      }
    },
  };
}

function unavailableResult(): SettingsActionResult {
  return {
    ok: false,
    code: "settings_preferences_unavailable",
    message: "Settings are unavailable.",
    category: "database_connection",
  };
}

export const settingsService = createSettingsService();
