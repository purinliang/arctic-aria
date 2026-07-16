import type { DatePickerMessages } from "@/messages/form-messages";

export function formatDateKey(
  value: string,
  messages: DatePickerMessages,
  fallback = value,
) {
  const parsed = parseDateKey(value);

  if (!parsed) {
    return fallback;
  }

  return messages.dateValue(
    messages.shortMonthNames[parsed.monthIndex],
    parsed.day,
    parsed.year,
    messages.longWeekdayNames[parsed.weekdayIndex],
  );
}

function parseDateKey(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, monthIndex, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== monthIndex ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return {
    year,
    monthIndex,
    day,
    weekdayIndex: date.getUTCDay(),
  };
}
