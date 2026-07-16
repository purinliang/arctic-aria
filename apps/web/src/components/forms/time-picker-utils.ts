export type Period = "AM" | "PM";

export type TimeParts = {
  hour12: number;
  minute: number;
  period: Period;
};

export type DayPeriod =
  | "midnight"
  | "morning"
  | "noon"
  | "afternoon"
  | "evening"
  | "night";

export function defaultTimePartsFromNow(now = new Date()) {
  const date = new Date(now.getTime() + 15 * 60 * 1000);
  const roundedMinute = Math.ceil(date.getMinutes() / 15) * 15;

  if (roundedMinute === 60) {
    date.setHours(date.getHours() + 1, 0, 0, 0);
  } else {
    date.setMinutes(roundedMinute, 0, 0);
  }

  return toTimeParts(date.getHours(), date.getMinutes(), null, "AM") ?? {
    hour12: 9,
    minute: 0,
    period: "AM",
  };
}

export function formatTimeInputValue(parts: TimeParts) {
  return `${String(parts.hour12).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}`;
}

export function dayPeriodForTime(parts: TimeParts): DayPeriod {
  const hour24 = hour24FromParts(parts);

  if (hour24 < 5) {
    return "midnight";
  }

  if (hour24 < 12) {
    return "morning";
  }

  if (hour24 < 13) {
    return "noon";
  }

  if (hour24 < 17) {
    return "afternoon";
  }

  if (hour24 < 21) {
    return "evening";
  }

  return "night";
}

export function parseTimeValue(value: string): TimeParts | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value);

  if (!match) {
    return null;
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);

  if (hour > 23 || minute > 59) {
    return null;
  }

  const hour12 = hour % 12 || 12;
  const period = hour < 12 ? "AM" : "PM";

  return { hour12, minute, period };
}

export function parseTypedTimeInput(
  rawValue: string,
  fallbackPeriod: Period,
): TimeParts | null {
  const normalized = rawValue.trim().toUpperCase();

  if (!normalized) {
    return null;
  }

  const explicitPeriod = normalized.includes("PM")
    ? "PM"
    : normalized.includes("AM")
      ? "AM"
      : null;
  const timeText = normalized.replace(/[APM\s]/g, "");
  const parsed = timeText.includes(":")
    ? parseColonTime(timeText)
    : parseCompactTime(timeText);

  if (
    !parsed ||
    !Number.isInteger(parsed.hour) ||
    !Number.isInteger(parsed.minute) ||
    parsed.minute > 59
  ) {
    return null;
  }

  return toTimeParts(parsed.hour, parsed.minute, explicitPeriod, fallbackPeriod);
}

export function toTimeValue(parts: TimeParts) {
  const hour24 = hour24FromParts(parts);

  return `${String(hour24).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}`;
}

function hour24FromParts(parts: TimeParts) {
  return parts.period === "AM"
    ? parts.hour12 % 12
    : parts.hour12 === 12
      ? 12
      : parts.hour12 + 12;
}

function parseColonTime(value: string) {
  const [hourText, minuteText] = value.split(":");

  if (!hourText || minuteText === undefined || minuteText.length < 1) {
    return null;
  }

  return {
    hour: Number(hourText),
    minute: Number(minuteText.slice(0, 2).padStart(2, "0")),
  };
}

function parseCompactTime(value: string) {
  const digits = value.replace(/\D/g, "");

  if (digits.length === 0 || digits.length > 4) {
    return null;
  }

  if (digits.length <= 2) {
    return { hour: Number(digits), minute: 0 };
  }

  const hourText = digits.length === 3 ? digits.slice(0, 1) : digits.slice(0, 2);
  const minuteText = digits.length === 3 ? digits.slice(1) : digits.slice(2);

  return { hour: Number(hourText), minute: Number(minuteText) };
}

function toTimeParts(
  hour: number,
  minute: number,
  explicitPeriod: Period | null,
  fallbackPeriod: Period,
): TimeParts | null {
  if (explicitPeriod) {
    if (hour < 1 || hour > 12) {
      return null;
    }

    return { hour12: hour, minute, period: explicitPeriod };
  }

  if (hour < 0 || hour > 23) {
    return null;
  }

  if (hour === 0) {
    return { hour12: 12, minute, period: "AM" };
  }

  if (hour > 12) {
    return { hour12: hour - 12, minute, period: "PM" };
  }

  if (hour === 12) {
    return { hour12: 12, minute, period: "PM" };
  }

  return { hour12: hour, minute, period: fallbackPeriod };
}
