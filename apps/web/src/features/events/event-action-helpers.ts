import { isValidDateKey } from "../routines/routine-recurrence.ts";

const maxEstimatedDurationHours = 24;

export type EventInput = {
  id?: string;
  title: string;
  description: string;
  eventDate: string;
  eventTime: string;
  estimatedDurationHours?: string | null;
  location: string;
};

export function validateEventInput(input: EventInput) {
  const title = input.title.trim();
  const description = input.description.trim();
  const eventDate = input.eventDate.trim();
  const eventTime = input.eventTime.trim();
  const location = input.location.trim();
  const estimatedDuration = validateOptionalEstimatedDurationHours(
    input.estimatedDurationHours,
  );

  if (title.length < 1) {
    return {
      ok: false as const,
      message: "Event title is required.",
      code: "event_title_invalid",
      category: "missing_parameter" as const,
      subject: "event" as const,
      field: "title",
      reason: "required" as const,
    };
  }

  if (title.length > 120) {
    return {
      ok: false as const,
      message: "Event title must be 120 characters or fewer.",
      code: "event_title_invalid",
      category: "invalid_parameter" as const,
      subject: "event" as const,
      field: "title",
      reason: "too_long" as const,
      limit: 120,
    };
  }

  if (description.length > 2000) {
    return {
      ok: false as const,
      message: "Event description must be 2000 characters or fewer.",
      code: "event_description_invalid",
      category: "invalid_parameter" as const,
      subject: "event" as const,
      field: "description",
      reason: "too_long" as const,
      limit: 2000,
    };
  }

  if (!eventDate) {
    return {
      ok: false as const,
      message: "Choose an event date.",
      code: "event_date_missing",
      category: "missing_parameter" as const,
      subject: "event" as const,
      field: "date",
      reason: "required" as const,
    };
  }

  if (!isValidDateKey(eventDate)) {
    return {
      ok: false as const,
      message: "Event date must be a real date in YYYY-MM-DD format.",
      code: "event_date_invalid",
      category: "invalid_parameter" as const,
      subject: "event" as const,
      field: "date",
      reason: "invalid_format" as const,
    };
  }

  if (!eventTime) {
    return {
      ok: false as const,
      message: "Choose an event time.",
      code: "event_time_missing",
      category: "missing_parameter" as const,
      subject: "event" as const,
      field: "time",
      reason: "required" as const,
    };
  }

  if (!isValidEventTime(eventTime)) {
    return {
      ok: false as const,
      message: "Event time must use HH:MM.",
      code: "event_time_invalid",
      category: "invalid_parameter" as const,
      subject: "event" as const,
      field: "time",
      reason: "invalid_format" as const,
    };
  }

  if (!estimatedDuration.ok) {
    return estimatedDuration;
  }

  if (location.length > 500) {
    return {
      ok: false as const,
      message: "Event location must be 500 characters or fewer.",
      code: "event_location_invalid",
      category: "invalid_parameter" as const,
      subject: "event" as const,
      field: "location",
      reason: "too_long" as const,
      limit: 500,
    };
  }

  return {
    ok: true as const,
    title,
    description: description || null,
    eventDate,
    eventTime,
    estimatedDurationHours: estimatedDuration.value,
    location: location || null,
  };
}

export function isValidEventTime(value: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(value);

  if (!match) {
    return false;
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);

  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
}

function validateOptionalEstimatedDurationHours(value?: string | null) {
  const text = value?.trim() ?? "";

  if (!text) {
    return {
      ok: true as const,
      value: null,
    };
  }

  if (!/^\d+(?:\.\d+)?$/.test(text)) {
    return invalidEstimatedDurationHours();
  }

  const parsed = Number(text);
  const rounded = Math.round((parsed + Number.EPSILON) * 100) / 100;

  if (
    !Number.isFinite(parsed) ||
    parsed <= 0 ||
    rounded <= 0 ||
    rounded > maxEstimatedDurationHours
  ) {
    return invalidEstimatedDurationHours();
  }

  return {
    ok: true as const,
    value: rounded,
  };
}

function invalidEstimatedDurationHours() {
  return {
    ok: false as const,
    message: "Event estimated duration must be a positive number up to 24 hours.",
    code: "event_estimated_duration_invalid",
    category: "invalid_parameter" as const,
    subject: "event" as const,
    field: "estimated_duration_hours",
    reason: "invalid_value" as const,
    limit: maxEstimatedDurationHours,
  };
}
