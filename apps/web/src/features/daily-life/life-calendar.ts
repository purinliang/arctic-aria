import { addDaysToDateKey, localDateKey } from '../settings/time-zones.ts';
import { lifeActivities } from './types.ts';
import type { LifeEntry } from './types.ts';

export function lifeWeek(now: Date, timezone: string) {
  const today = localDateKey(now, timezone);
  return Array.from({ length: 7 }, (_, index) => addDaysToDateKey(today, -index));
}

export function entriesForDay(entries: LifeEntry[], day: string, timezone: string) {
  return entries.filter((entry) => localDateKey(new Date(entry.occurredAt), timezone) === day)
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt) || b.id.localeCompare(a.id));
}

export function durationWeek(entries: LifeEntry[], days: string[], timezone: string) {
  return [...days].reverse().map((day) => {
    const records = entriesForDay(entries, day, timezone);
    const totals = Object.fromEntries(lifeActivities.map((activity) => [activity,
      records.filter((entry) => entry.activity === activity).reduce((sum, entry) => sum + entry.durationMinutes, 0),
    ])) as Record<typeof lifeActivities[number], number>;
    return { day, totals, total: Object.values(totals).reduce((sum, value) => sum + value, 0) };
  });
}
