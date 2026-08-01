import { isValidDateKey } from "../routines/routine-recurrence.ts";

const maxEstimatedDurationHours = 24;
const maxEventInstanceReasonLength = 500;
const eventRuleTypes = new Set(["once", "daily", "weekly"]);

export type EventInput = {
  id?: string;
  groupId?: string | null;
  title: string;
  description: string;
  eventDate: string;
  endDate?: string | null;
  eventTime: string;
  ruleType?: string;
  estimatedDurationHours?: string | null;
  location: string;
  timezone?: string;
};

export type EventGroupInput = {
  id?: string;
  name: string;
  description: string;
};

export type EventInstanceInput = {
  id: string;
  title?: string;
  eventDate: string;
  eventTime: string;
  locationOverride?: string | null;
  reason?: string | null;
  effectiveLocation?: string | null;
};

export function validateEventInput(input: EventInput) {
  const title = input.title.trim();
  const description = input.description.trim();
  const eventDate = input.eventDate.trim();
  const endDate = input.endDate?.trim() ?? "";
  const eventTime = input.eventTime.trim();
  const ruleType = input.ruleType?.trim() || "once";
  const location = input.location.trim();
  const timezone = input.timezone?.trim() || "UTC";
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

  if (endDate && !isValidDateKey(endDate)) {
    return {
      ok: false as const,
      message: "Event end date must be a real date in YYYY-MM-DD format.",
      code: "event_end_date_invalid",
      category: "invalid_parameter" as const,
      subject: "event" as const,
      field: "end_date",
      reason: "invalid_format" as const,
    };
  }

  if (endDate && endDate < eventDate) {
    return {
      ok: false as const,
      message: "Event end date must be blank or after the start date.",
      code: "event_end_date_invalid",
      category: "invalid_parameter" as const,
      subject: "event" as const,
      field: "end_date",
      reason: "before_start" as const,
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

  if (!eventRuleTypes.has(ruleType)) {
    return {
      ok: false as const,
      message: "Event repeat rule is invalid.",
      code: "event_rule_invalid",
      category: "invalid_parameter" as const,
      subject: "event" as const,
      field: "rule_type",
      reason: "invalid_value" as const,
    };
  }

  if (!timezone) {
    return {
      ok: false as const,
      message: "Choose a valid timezone.",
      code: "event_timezone_invalid",
      category: "invalid_parameter" as const,
      subject: "event" as const,
      field: "timezone",
      reason: "invalid_value" as const,
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
    groupId: input.groupId?.trim() || null,
    description: description || null,
    eventDate,
    endDate: endDate || null,
    eventTime,
    ruleType: ruleType as "once" | "daily" | "weekly",
    estimatedDurationHours: estimatedDuration.value,
    location: location || null,
    timezone,
  };
}

export function validateEventGroupInput(input: EventGroupInput) {
  const name = input.name.trim();
  const description = input.description.trim();

  if (name.length < 1 || name.length > 80) {
    return {
      ok: false as const,
      message: "Event group name must be 1-80 characters.",
      code: "event_group_name_invalid",
      category: "invalid_parameter" as const,
      subject: "group" as const,
      field: "name",
      reason: name.length < 1 ? "required" as const : "too_long" as const,
      limit: 80,
    };
  }

  if (description.length > 500) {
    return {
      ok: false as const,
      message: "Event group description must be 500 characters or fewer.",
      code: "event_group_description_invalid",
      category: "invalid_parameter" as const,
      subject: "group" as const,
      field: "description",
      reason: "too_long" as const,
      limit: 500,
    };
  }

  return {
    ok: true as const,
    name,
    description: description || null,
  };
}

export function validateEventInstanceInput(input: EventInstanceInput) {
  const instanceId = input.id.trim();
  const eventDate = input.eventDate.trim();
  const eventTime = input.eventTime.trim();
  const locationOverride = input.locationOverride?.trim() ?? "";
  const reason = input.reason?.trim() ?? "";

  if (!instanceId) {
    return eventInstanceNotFoundResult();
  }

  if (!eventDate) {
    return {
      ok: false as const,
      message: "Choose an event instance date.",
      code: "event_instance_date_missing",
      category: "missing_parameter" as const,
      subject: "event" as const,
      field: "date",
      reason: "required" as const,
    };
  }

  if (!isValidDateKey(eventDate)) {
    return {
      ok: false as const,
      message:
        "Event instance date must be a real date in YYYY-MM-DD format.",
      code: "event_instance_date_invalid",
      category: "invalid_parameter" as const,
      subject: "event" as const,
      field: "date",
      reason: "invalid_format" as const,
    };
  }

  if (!eventTime) {
    return {
      ok: false as const,
      message: "Choose an event instance time.",
      code: "event_instance_time_missing",
      category: "missing_parameter" as const,
      subject: "event" as const,
      field: "time",
      reason: "required" as const,
    };
  }

  if (!isValidEventTime(eventTime)) {
    return {
      ok: false as const,
      message: "Event instance time must use HH:MM.",
      code: "event_instance_time_invalid",
      category: "invalid_parameter" as const,
      subject: "event" as const,
      field: "time",
      reason: "invalid_format" as const,
    };
  }

  if (locationOverride.length > 500) {
    return {
      ok: false as const,
      message: "Event instance location override must be 500 characters or fewer.",
      code: "event_instance_location_override_invalid",
      category: "invalid_parameter" as const,
      subject: "event" as const,
      field: "location_override",
      reason: "too_long" as const,
      limit: 500,
    };
  }

  const reasonValidation = validateEventInstanceReason(reason);

  if (!reasonValidation.ok) {
    return reasonValidation;
  }

  return {
    ok: true as const,
    instanceId,
    eventDate,
    eventTime,
    locationOverride: locationOverride || null,
    reason: reason || null,
  };
}

export function validateEventInstanceCancelInput(
  input: Pick<EventInstanceInput, "id" | "reason">,
) {
  const instanceId = input.id.trim();
  const reason = input.reason?.trim() ?? "";

  if (!instanceId) {
    return eventInstanceNotFoundResult();
  }

  const reasonValidation = validateEventInstanceReason(reason);

  if (!reasonValidation.ok) {
    return reasonValidation;
  }

  return {
    ok: true as const,
    instanceId,
    reason: reason || null,
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

function validateEventInstanceReason(reason: string) {
  if (reason.length > maxEventInstanceReasonLength) {
    return {
      ok: false as const,
      message: "Event instance reason must be 500 characters or fewer.",
      code: "event_instance_reason_invalid",
      category: "invalid_parameter" as const,
      subject: "event" as const,
      field: "reason",
      reason: "too_long" as const,
      limit: maxEventInstanceReasonLength,
    };
  }

  return {
    ok: true as const,
  };
}

function eventInstanceNotFoundResult() {
  return {
    ok: false as const,
    message: "Event instance was not found.",
    code: "event_instance_not_found",
    category: "not_found" as const,
    subject: "event" as const,
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
