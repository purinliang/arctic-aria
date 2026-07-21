import { getCurrentUser } from "../../auth/actions";
import { loadUserResolvedTimeZone } from "../../settings/server/user-time-zone";
import {
  defaultResolvedTimeZone,
  localDateKey,
} from "../../settings/time-zones";

export async function loadDeveloperImportDefaults(now = new Date()) {
  const user = await getCurrentUser();
  const timeZone = user
    ? await loadUserResolvedTimeZone(user.id)
    : defaultResolvedTimeZone;

  return {
    today: localDateKey(now, timeZone),
    timeZone,
  };
}
