import type { ActionFailureResult } from "@/messages/action-result";
import { loadUserResolvedTimeZone } from "@/features/settings/server/user-time-zone";
import { routineService } from "./server/routine-service";
import {
  toRoutineDefinition,
  toRoutineGroupOption,
} from "./routine-dashboard-mappers";
import { normalizeRoutineTemplateDocument } from "./routine-template-normalizer";
import type { NormalizedRoutineTemplate } from "./routine-template-types";

export type RoutineTemplateActionResult<T> =
  | {
      ok: true;
      data: T;
    }
  | ActionFailureResult;

export async function prepareRoutineTemplateForUser(
  userId: string,
  routineId: string | null,
  source: string,
): Promise<RoutineTemplateActionResult<NormalizedRoutineTemplate>> {
  const trimmedSource = source.trim();

  if (!trimmedSource) {
    return {
      ok: false,
      message: "Paste a routine template first.",
      code: "routine_template_missing",
      category: "missing_parameter",
      subject: "routine",
      field: "template",
      reason: "required",
    };
  }

  const [routines, routineGroups, defaultTimeZone] = await Promise.all([
    routineService.listRoutineDefinitions(userId),
    routineService.listRoutineGroups(userId),
    loadUserResolvedTimeZone(userId),
  ]);

  return normalizeRoutineTemplateDocument({
    source: trimmedSource,
    currentRoutines: routines.map(toRoutineDefinition),
    routineGroups: routineGroups.map(toRoutineGroupOption),
    targetRoutineId: routineId?.trim() || null,
    defaultTimeZone,
  });
}

export async function applyRoutineTemplateCommands(
  userId: string,
  template: NormalizedRoutineTemplate,
): Promise<RoutineTemplateActionResult<null>> {
  for (const command of template.commands) {
    if (command.previewOperation === "preserve") {
      continue;
    }

    if (command.operation === "delete") {
      const deleted = await routineService.deleteRoutine(
        userId,
        command.routineId,
      );

      if (!deleted) {
        return routineNotFoundResult();
      }

      continue;
    }

    const saved = await routineService.saveRoutine(userId, {
      id: command.routineId ?? undefined,
      groupId: command.groupId,
      title: command.title,
      description: command.description,
      startDate: command.startDate,
      endDate: command.endDate,
      estimatedDurationMinutes: command.estimatedDurationMinutes,
      rule: command.rule,
    });

    if (!saved) {
      return routineNotFoundResult();
    }
  }

  return {
    ok: true,
    data: null,
  };
}

function routineNotFoundResult(): ActionFailureResult {
  return {
    ok: false,
    message: "Routine was not found.",
    code: "routine_not_found",
    category: "not_found",
    subject: "routine",
  };
}
