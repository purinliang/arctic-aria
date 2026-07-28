import {
  applyRecurrenceOption,
  normalizeRoutineRecurrenceDraft,
} from "./routine-recurrence.ts";
import { validateRoutineInput } from "./routine-action-helpers.ts";
import type {
  RoutineImportCommand,
  RoutineImportDocument,
  RoutineImportInput,
  RoutineImportResult,
} from "./routine-import-types.ts";

export function normalizeRoutineImportDocument(
  document: RoutineImportDocument,
  today: string,
  defaultTimeZone = "UTC",
): RoutineImportResult<RoutineImportCommand> {
  const input = routineImportToInput(document, today, defaultTimeZone);
  const validation = validateRoutineInput(input);

  if (!validation.ok) {
    return validation;
  }

  return {
    ok: true,
    data: {
      groupId: null,
      title: validation.title,
      description: validation.description,
      estimatedDurationMinutes: validation.estimatedDurationMinutes,
      startDate: validation.startDate,
      endDate: validation.endDate,
      rule: validation.rule,
    },
  };
}

function routineImportToInput(
  document: RoutineImportDocument,
  today: string,
  defaultTimeZone: string,
): RoutineImportInput {
  const routine = document.routine;
  const recurrence = routine.recurrence ?? "once";
  const base: RoutineImportInput = {
    title: routine.title,
    description: routine.description ?? "",
    estimatedDurationMinutes: routine.estimatedDurationMinutes?.toString() ?? "",
    startDate: routine.startDate ?? today,
    endDate: routine.endDate ?? "",
    ruleType: "once",
    intervalValue: routine.fixedIntervalDays ?? null,
    weekdays: null,
    dayOfMonth: null,
    preferredTime: routine.preferredTime ?? "",
    timezone: routine.timezone ?? defaultTimeZone,
  };

  return normalizeRoutineRecurrenceDraft(
    applyRecurrenceOption(base, recurrence),
  );
}
