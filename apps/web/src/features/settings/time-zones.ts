export type TimeZonePreference = "system" | string;

export const defaultTimeZonePreference: TimeZonePreference = "system";
export const defaultResolvedTimeZone = "UTC";

const fallbackTimeZones = [
  "UTC",
  "Australia/Melbourne",
  "Australia/Sydney",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Europe/London",
  "America/New_York",
  "America/Los_Angeles",
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
    const values = Object.fromEntries(
      parts
        .filter((part) => part.type !== "literal")
        .map((part) => [part.type, part.value]),
    );
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
