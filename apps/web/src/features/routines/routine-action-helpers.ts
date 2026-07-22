import {
  isValidDateKey,
  normalizeRoutineRecurrence,
} from "./routine-recurrence.ts";
import { readResolvedTimeZone } from "../settings/time-zones.ts";
import type {
  RoutineRuleInput,
  RoutineRuleType,
} from "./server/routine-repository.ts";

export type RoutineInput = {
  id?: string;
  groupId?: string | null;
  title: string;
  description: string;
  firstStartDate: string;
  endDate?: string | null;
  ruleType: RoutineRuleType;
  intervalValue?: number | null;
  weekdays?: number[] | null;
  dayOfMonth?: number | null;
  preferredTime?: string | null;
  timezone?: string;
};

export type RoutineGroupInput = {
  id?: string;
  name: string;
  description: string;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validateRoutineInput(input: RoutineInput) {
  const groupId = input.groupId?.trim() || null;
  const title = input.title.trim();
  const description = input.description.trim();
  const firstStartDate = input.firstStartDate.trim();
  const endDate = input.endDate?.trim() || null;

  if (title.length < 1) {
    return {
      ok: false as const,
      message: "Routine title is required.",
      code: "routine_title_invalid",
      category: "missing_parameter" as const,
      subject: "routine" as const,
      field: "title",
      reason: "required" as const,
    };
  }

  if (title.length > 120) {
    return {
      ok: false as const,
      message: "Routine title must be 120 characters or fewer.",
      code: "routine_title_invalid",
      category: "invalid_parameter" as const,
      subject: "routine" as const,
      field: "title",
      reason: "too_long" as const,
      limit: 120,
    };
  }

  if (description.length > 2000) {
    return {
      ok: false as const,
      message: "Routine description must be 2000 characters or fewer.",
      code: "routine_description_invalid",
      category: "invalid_parameter" as const,
      subject: "routine" as const,
      field: "description",
      reason: "too_long" as const,
      limit: 2000,
    };
  }

  if (groupId && !uuidPattern.test(groupId)) {
    return {
      ok: false as const,
      message: "Routine group is invalid.",
      code: "routine_group_invalid",
      category: "invalid_parameter" as const,
      subject: "group" as const,
      field: "group",
      reason: "invalid_value" as const,
    };
  }

  if (!firstStartDate) {
    return {
      ok: false as const,
      message: "Choose a first start date.",
      code: "routine_first_start_date_missing",
      category: "missing_parameter" as const,
      field: "first_start_date",
      reason: "required" as const,
    };
  }

  if (!isValidDateKey(firstStartDate)) {
    return {
      ok: false as const,
      message: "First start date must be a real date in YYYY-MM-DD format.",
      code: "routine_first_start_date_invalid",
      category: "invalid_parameter" as const,
      field: "first_start_date",
      reason: "invalid_format" as const,
    };
  }

  if (endDate && !isValidDateKey(endDate)) {
    return {
      ok: false as const,
      message: "End date must be a real date in YYYY-MM-DD format.",
      code: "routine_end_date_invalid",
      category: "invalid_parameter" as const,
      field: "end_date",
      reason: "invalid_format" as const,
    };
  }

  if (endDate && endDate < firstStartDate) {
    return {
      ok: false as const,
      message: "End date cannot be before start date.",
      code: "routine_end_date_invalid",
      category: "invalid_parameter" as const,
      field: "end_date",
      reason: "before_start" as const,
    };
  }

  if (!validateTime(input.preferredTime)) {
    return {
      ok: false as const,
      message: "Preferred time must use HH:MM.",
      code: "routine_preferred_time_invalid",
      category: "invalid_parameter" as const,
      field: "preferred_time",
      reason: "invalid_format" as const,
    };
  }

  if (!readResolvedTimeZone(input.timezone)) {
    return {
      ok: false as const,
      message: "Choose a valid timezone.",
      code: "routine_timezone_invalid",
      category: "invalid_parameter" as const,
      field: "timezone",
      reason: "invalid_value" as const,
    };
  }

  const rule = normalizeRule({
    ...input,
    firstStartDate,
    endDate,
  });

  if (!rule) {
    return {
      ok: false as const,
      message: "Routine rule is invalid.",
      code: "routine_rule_invalid",
      category: "invalid_parameter" as const,
      subject: "routine" as const,
      field: "rule",
      reason: "invalid_value" as const,
    };
  }

  return {
    ok: true as const,
    groupId,
    title,
    description: description || null,
    firstStartDate,
    endDate,
    rule,
  };
}

export function validateRoutineGroupInput(input: RoutineGroupInput) {
  const name = input.name.trim();
  const description = input.description.trim();

  if (name.length < 1) {
    return {
      ok: false as const,
      message: "Routine group name is required.",
      code: "routine_group_name_invalid",
      category: "missing_parameter" as const,
      subject: "group" as const,
      field: "name",
      reason: "required" as const,
    };
  }

  if (name.length > 80) {
    return {
      ok: false as const,
      message: "Routine group name must be 80 characters or fewer.",
      code: "routine_group_name_invalid",
      category: "invalid_parameter" as const,
      subject: "group" as const,
      field: "name",
      reason: "too_long" as const,
      limit: 80,
    };
  }

  if (description.length > 500) {
    return {
      ok: false as const,
      message: "Routine group description must be 500 characters or fewer.",
      code: "routine_group_description_invalid",
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

function validateTime(value: string | null | undefined) {
  return !value || /^\d{2}:\d{2}$/.test(value);
}

function normalizeRule(input: RoutineInput): RoutineRuleInput | null {
  const rule = normalizeRoutineRecurrence(input);
  const timezone = readResolvedTimeZone(input.timezone) ?? null;

  if (!rule || !timezone) {
    return null;
  }

  return {
    ...rule,
    preferredTime: input.preferredTime || null,
    timezone,
  };
}
