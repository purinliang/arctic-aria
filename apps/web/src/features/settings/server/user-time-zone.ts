import {
  defaultResolvedTimeZone,
  localDateKey,
  resolveTimeZonePreference,
} from "../time-zones.ts";
import { settingsService } from "./settings-service.ts";

export async function loadUserResolvedTimeZone(userId: string) {
  const result = await settingsService.getPreferences(userId);

  if (!result.ok) {
    return defaultResolvedTimeZone;
  }

  return resolveTimeZonePreference(
    result.preferences.timeZonePreference,
    result.preferences.resolvedTimeZone ?? defaultResolvedTimeZone,
  );
}

export async function userLocalDateKey(userId: string, date = new Date()) {
  return localDateKey(date, await loadUserResolvedTimeZone(userId));
}
