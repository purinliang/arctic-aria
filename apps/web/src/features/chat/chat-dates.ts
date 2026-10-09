import { addDaysToDateKey, localDateKey } from '../settings/time-zones.ts';
import type { ChatExchange } from './types.ts';

export function chatDateSeparator(entries: ChatExchange[], index: number, options: {
  now?: Date; timeZone: string; language: string; today: string; yesterday: string;
}) {
  if (index === 0) return null;
  const date = new Date(entries[index].createdAt);
  const day = localDateKey(date, options.timeZone);
  if (day === localDateKey(new Date(entries[index - 1].createdAt), options.timeZone)) return null;
  const today = localDateKey(options.now ?? new Date(), options.timeZone);
  if (day === today) return options.today;
  if (day === addDaysToDateKey(today, -1)) return options.yesterday;
  return new Intl.DateTimeFormat(options.language, { weekday: 'long', timeZone: options.timeZone }).format(date);
}
