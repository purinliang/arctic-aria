import {
  normalizeUserPreferences,
  type UserPreferences,
} from "../preferences.ts";
import { PostgresUserSettingsRepository } from "./postgres-user-settings-repository.ts";

export type SettingsActionResult =
  | {
      ok: true;
      code: "settings_preferences_saved" | "settings_preferences_loaded";
      preferences: UserPreferences;
    }
  | {
      ok: false;
      code:
        | "settings_unauthorized"
        | "settings_preferences_unavailable"
        | "settings_preferences_save_failed";
      message: string;
    };

type UserSettingsRepository = {
  getOrCreate(userId: string): Promise<UserPreferences>;
  upsert(userId: string, preferences: UserPreferences): Promise<UserPreferences>;
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
  };
}

export const settingsService = createSettingsService();
