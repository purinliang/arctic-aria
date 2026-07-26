export type TimeZonePreference = "system" | string;

export const defaultTimeZonePreference: TimeZonePreference = "system";
export const defaultResolvedTimeZone = "UTC";

const fallbackTimeZones = [
  "Australia/Sydney",
  "Australia/Melbourne",
  "Australia/Brisbane",
  "Australia/Perth",
  "Australia/Adelaide",
  "Asia/Shanghai",
];

type IntlWithSupportedValues = typeof Intl & {
  supportedValuesOf?: (key: "timeZone") => string[];
};

export function readTimeZonePreference(
  value: string | null | undefined,
): TimeZonePreference {
  if (value === "system") {
    return "system";
  }

  return readResolvedTimeZone(value) ?? defaultTimeZonePreference;
}

export function readResolvedTimeZone(value: string | null | undefined) {
  if (!value || value === "system") {
    return null;
  }

  return isSupportedTimeZone(value) ? value : null;
}

export function resolveTimeZonePreference(
  preference: TimeZonePreference,
  browserTimeZone: string,
) {
  if (preference === "system") {
    return readResolvedTimeZone(browserTimeZone) ?? defaultResolvedTimeZone;
  }

  return readResolvedTimeZone(preference) ?? defaultResolvedTimeZone;
}

export function isSupportedTimeZone(value: string) {
  try {
    Intl.DateTimeFormat("en-US", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

export function formatTimeZoneOffset(
  timeZone: string,
  date: Date = new Date(),
) {
  try {
    const parts = Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "shortOffset",
    }).formatToParts(date);
    const offset = parts.find((part) => part.type === "timeZoneName")?.value;

    return offset ?? timeZone;
  } catch {
    return timeZone;
  }
}

export function localDateTimeParts(date: Date, timeZone: string) {
  const resolvedTimeZone = readResolvedTimeZone(timeZone);

  if (!resolvedTimeZone) {
    return null;
  }

  try {
    const parts = Intl.DateTimeFormat("en-US", {
      day: "2-digit",
      hour: "2-digit",
      hour12: false,
      hourCycle: "h23",
      minute: "2-digit",
      month: "2-digit",
      second: "2-digit",
      timeZone: resolvedTimeZone,
      year: "numeric",
    }).formatToParts(date);
    const values = dateTimeValues(parts);

    if (
      !values.year ||
      !values.month ||
      !values.day ||
      !values.hour ||
      !values.minute ||
      !values.second
    ) {
      return null;
    }

    const dateKey = `${values.year}-${values.month}-${values.day}`;
    const fallbackDate = new Date(`${dateKey}T00:00:00.000Z`);

    return {
      dateKey,
      day: Number(values.day),
      hour: Number(values.hour) % 24,
      minute: Number(values.minute),
      second: Number(values.second),
      timeZone: resolvedTimeZone,
      weekday: fallbackDate.getUTCDay(),
    };
  } catch {
    return null;
  }
}

export function localDateKey(date: Date, timeZone: string) {
  return localDateTimeParts(date, timeZone)?.dateKey ?? date.toISOString().slice(0, 10);
}

export function localScheduledDateKey({
  date,
  dayStartHour = 4,
  timeZone,
}: {
  date: Date;
  dayStartHour?: number;
  timeZone: string;
}) {
  const parts = localDateTimeParts(date, timeZone);

  if (!parts) {
    return date.toISOString().slice(0, 10);
  }

  return parts.hour < dayStartHour
    ? addDaysToDateKey(parts.dateKey, -1)
    : parts.dateKey;
}

export function localCalendarParts(date: Date, timeZone: string) {
  const parts = localDateTimeParts(date, timeZone);

  if (parts) {
    return {
      dateKey: parts.dateKey,
      day: parts.day,
      weekday: parts.weekday,
    };
  }

  const dateKey = date.toISOString().slice(0, 10);
  const fallbackDate = new Date(dateKey);

  return {
    dateKey,
    day: fallbackDate.getUTCDate(),
    weekday: fallbackDate.getUTCDay(),
  };
}

export function timeZoneOffsetMinutes(timeZone: string, date: Date) {
  try {
    const parts = Intl.DateTimeFormat("en-US", {
      day: "2-digit",
      hour: "2-digit",
      hour12: false,
      hourCycle: "h23",
      minute: "2-digit",
      month: "2-digit",
      second: "2-digit",
      timeZone,
      year: "numeric",
    }).formatToParts(date);
    const values = dateTimeValues(parts);
    const zonedTimestamp = Date.UTC(
      Number(values.year),
      Number(values.month) - 1,
      Number(values.day),
      Number(values.hour) % 24,
      Number(values.minute),
      Number(values.second),
    );

    return Math.round((zonedTimestamp - date.getTime()) / 60000);
  } catch {
    return null;
  }
}

function dateTimeValues(parts: Intl.DateTimeFormatPart[]) {
  return Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
}

export function addDaysToDateKey(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T00:00:00.000Z`);

  date.setUTCDate(date.getUTCDate() + days);

  return date.toISOString().slice(0, 10);
}

export function zonedDateTimeToUtcDate({
  dateKey,
  time,
  timeZone,
}: {
  dateKey: string;
  time: string;
  timeZone: string;
}) {
  const dateParts = parseDateKey(dateKey);
  const timeParts = parseTime(time);

  if (!dateParts || !timeParts || !readResolvedTimeZone(timeZone)) {
    return null;
  }

  const localTimestamp = Date.UTC(
    dateParts.year,
    dateParts.monthIndex,
    dateParts.day,
    timeParts.hour,
    timeParts.minute,
  );
  const initialOffset = timeZoneOffsetMinutes(timeZone, new Date(localTimestamp));

  if (initialOffset === null) {
    return null;
  }

  const firstPass = new Date(localTimestamp - initialOffset * 60_000);
  const finalOffset = timeZoneOffsetMinutes(timeZone, firstPass);

  if (finalOffset === null) {
    return null;
  }

  return new Date(localTimestamp - finalOffset * 60_000);
}

export function selectableTimeZones(extraTimeZones: readonly string[] = []) {
  const platformTimeZones =
    (Intl as IntlWithSupportedValues).supportedValuesOf?.("timeZone") ??
    fallbackTimeZones;
  const timeZones = new Set<string>(["UTC"]);

  for (const timeZone of [...extraTimeZones, ...platformTimeZones]) {
    const supportedTimeZone = readResolvedTimeZone(timeZone);

    if (supportedTimeZone) {
      timeZones.add(supportedTimeZone);
    }
  }

  return [...timeZones].sort((left, right) => left.localeCompare(right));
}

function parseDateKey(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }

  return { day, monthIndex: month - 1, year };
}

function parseTime(value: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(value);

  if (!match) {
    return null;
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);

  if (hour > 23 || minute > 59) {
    return null;
  }

  return { hour, minute };
}
