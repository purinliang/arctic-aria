"use server";

import { getCurrentUser } from "@/features/auth/actions";
import {
  defaultUserPreferences,
  normalizeUserPreferences,
  type UserPreferences,
} from "./preferences";
import {
  settingsService,
  type SettingsActionResult,
} from "./server/settings-service";

export type { SettingsActionResult, UserPreferences };

export async function getUserPreferences(): Promise<SettingsActionResult> {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorizedResult();
  }

  return settingsService.getPreferences(user.id);
}

export async function saveUserPreferences(
  input: UserPreferences,
): Promise<SettingsActionResult> {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorizedResult();
  }

  return settingsService.savePreferences(user.id, normalizeUserPreferences(input));
}

function unauthorizedResult(): SettingsActionResult {
  return {
    ok: false,
    code: "settings_unauthorized",
    message: "Sign in before changing settings.",
  };
}

export async function getDefaultUserPreferences(): Promise<UserPreferences> {
  return defaultUserPreferences;
}
