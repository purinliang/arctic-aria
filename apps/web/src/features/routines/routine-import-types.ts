import type { ActionFailureResult } from "../../messages/action-result.ts";
import type { RoutineInput } from "./routine-action-helpers.ts";
import type { RoutineRecurrenceOption } from "./routine-recurrence.ts";
import type { RoutineRuleInput } from "./server/routine-repository.ts";

export type RoutineImportRoutine = {
  title: string;
  description?: string;
  firstStartDate?: string;
  endDate?: string;
  recurrence?: RoutineRecurrenceOption;
  fixedIntervalDays?: number;
  preferredTime?: string;
  timezone?: string;
};

export type RoutineImportDocument = {
  routine: RoutineImportRoutine;
};

export type RoutineImportBatchDocument = {
  routines: RoutineImportRoutine[];
};

export type RoutineImportResult<T> =
  | {
      ok: true;
      data: T;
    }
  | ActionFailureResult;

export type RoutineImportCommand = {
  groupId: string | null;
  title: string;
  description: string | null;
  firstStartDate: string;
  endDate: string | null;
  rule: RoutineRuleInput;
};

export type RoutineImportInput = Omit<RoutineInput, "id">;
