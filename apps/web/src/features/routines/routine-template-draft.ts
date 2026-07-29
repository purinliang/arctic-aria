import type { RoutineDefinition } from "../dashboard/types.ts";
import { normalizeTemplateFieldName } from "../template-parser.ts";
import type { RoutineInput } from "./routine-action-helpers.ts";
import {
  applyRecurrenceOption,
  recurrenceOptionFromRule,
  type RoutineRecurrenceOption,
} from "./routine-recurrence.ts";
import type { RoutineRuleInput } from "./server/routine-repository.ts";

export type ValidatedRoutineTemplateInput = {
  groupId: string | null;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  estimatedDurationMinutes: number | null;
  rule: RoutineRuleInput;
};

export function routineTemplateDraft({
  fields,
  currentRoutine,
  defaultTimeZone,
}: {
  fields: Map<string, string>;
  currentRoutine: RoutineDefinition | null;
  defaultTimeZone: string;
}): RoutineInput {
  const base: RoutineInput = currentRoutine
    ? {
        id: currentRoutine.id,
        groupId: currentRoutine.groupId,
        title: currentRoutine.title,
        description: currentRoutine.description ?? "",
        startDate: currentRoutine.startDate,
        endDate: currentRoutine.endDate ?? "",
        estimatedDurationMinutes:
          currentRoutine.estimatedDurationMinutes?.toString() ?? "",
        ruleType: currentRoutine.ruleType,
        recurrenceOption: recurrenceOptionFromRule(currentRoutine),
        intervalValue: currentRoutine.intervalValue,
        weekdays: currentRoutine.weekdays,
        dayOfMonth: currentRoutine.dayOfMonth,
        preferredTime: currentRoutine.preferredTime ?? "",
        timezone: currentRoutine.timezone,
      }
    : {
        groupId: null,
        title: "",
        description: "",
        startDate: "",
        endDate: "",
        estimatedDurationMinutes: "",
        ruleType: "once",
        recurrenceOption: "once",
        intervalValue: null,
        weekdays: null,
        dayOfMonth: null,
        preferredTime: "",
        timezone: defaultTimeZone,
      };
  let draft: RoutineInput = {
    ...base,
    groupId: fieldValue(fields, "group_id", base.groupId ?? "") || null,
    title: fieldValue(fields, "title", base.title),
    description: fieldValue(fields, "description", base.description),
    startDate: fieldValue(fields, "start_date", base.startDate),
    endDate: fieldValue(fields, "end_date", base.endDate ?? ""),
    preferredTime: fieldValue(
      fields,
      "preferred_time",
      base.preferredTime ?? "",
    ),
    estimatedDurationMinutes: fieldValue(
      fields,
      "estimated_duration_minutes",
      base.estimatedDurationMinutes ?? "",
    ),
    timezone:
      fieldValue(fields, "timezone", base.timezone ?? defaultTimeZone) ||
      defaultTimeZone,
  };
  const recurrence = fields.has("recurrence")
    ? normalizeRoutineTemplateRecurrence(fields.get("recurrence") ?? "")
    : null;

  if (fields.has("recurrence") && !recurrence) {
    return {
      ...draft,
      ruleType: "day_interval",
      intervalValue: null,
    };
  }

  if (recurrence) {
    draft = applyRecurrenceOption(draft, recurrence);
  }

  if ((fields.get("fixed_interval_days") ?? "").trim()) {
    draft = {
      ...draft,
      recurrenceOption: "fixed_days",
      ruleType: "day_interval",
      intervalValue: Number(fields.get("fixed_interval_days") ?? ""),
      weekdays: null,
      dayOfMonth: null,
    };
  }

  return draft;
}

export function currentRoutineMatchesValidation(
  currentRoutine: RoutineDefinition | null,
  validation: ValidatedRoutineTemplateInput,
) {
  if (!currentRoutine) {
    return false;
  }

  return (
    currentRoutine.groupId === validation.groupId &&
    currentRoutine.title === validation.title &&
    currentRoutine.description === validation.description &&
    currentRoutine.startDate === validation.startDate &&
    currentRoutine.endDate === validation.endDate &&
    currentRoutine.estimatedDurationMinutes ===
      validation.estimatedDurationMinutes &&
    currentRoutine.ruleType === validation.rule.ruleType &&
    currentRoutine.intervalValue === validation.rule.intervalValue &&
    numberArraysEqual(currentRoutine.weekdays, validation.rule.weekdays) &&
    currentRoutine.dayOfMonth === validation.rule.dayOfMonth &&
    currentRoutine.preferredTime === validation.rule.preferredTime &&
    currentRoutine.timezone === validation.rule.timezone
  );
}

function fieldValue(
  fields: Map<string, string>,
  name: string,
  fallback: string,
) {
  return fields.has(name) ? fields.get(name) ?? "" : fallback;
}

function normalizeRoutineTemplateRecurrence(
  value: string,
): RoutineRecurrenceOption | null {
  const normalized = normalizeTemplateFieldName(value);

  if (normalized === "every_14_days" || normalized === "bi_weekly") {
    return "every_14_days";
  }

  if (normalized === "every_30_days") {
    return "every_30_days";
  }

  if (normalized === "fixed_days" || normalized === "fixed_interval") {
    return "fixed_days";
  }

  if (
    normalized === "once" ||
    normalized === "daily" ||
    normalized === "weekly" ||
    normalized === "monthly" ||
    normalized === "yearly"
  ) {
    return normalized;
  }

  return null;
}

function numberArraysEqual(left: number[] | null, right: number[] | null) {
  if (!left || !right) {
    return left === right;
  }

  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}
