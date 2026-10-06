import { addDaysToDateKey, localDateKey } from '../settings/time-zones.ts';
import type { LifeEntry } from './types.ts';

export function lifeWeek(now: Date, timezone: string) {
  const today = localDateKey(now, timezone);
  return Array.from({ length: 7 }, (_, index) => addDaysToDateKey(today, -index));
}

export function entriesForDay(entries: LifeEntry[], day: string, timezone: string) {
  return entries.filter((entry) => localDateKey(new Date(entry.occurredAt), timezone) === day)
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt) || b.id.localeCompare(a.id));
}
