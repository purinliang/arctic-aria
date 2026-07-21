"use server";

import { getCurrentUser } from "@/features/auth/actions";
import type {
  Routine,
  RoutineDefinition,
  RoutineStatus,
} from "@/features/dashboard/types";
import { routineService } from "./server/routine-service";
import type {
  RoutineInstanceRecord,
  RoutineRecord,
} from "./server/routine-repository";
import { validateRoutineInput } from "./routine-action-helpers";
import type { RoutineInput } from "./routine-action-helpers";
import type { ActionFailureResult } from "../../messages/action-result.ts";

export type { RoutineInput } from "./routine-action-helpers";

export type RoutineDashboardData = {
  routines: Routine[];
  routineDefinitions: RoutineDefinition[];
};

export type RoutineActionResult<T> =
  | {
      ok: true;
      data: T;
    }
  | ActionFailureResult;

function unauthorizedResult<T>(): RoutineActionResult<T> {
  return {
    ok: false,
    message: "Please sign in again.",
    code: "auth_required",
    category: "auth",
  };
}

function databaseResult<T>(): RoutineActionResult<T> {
  return {
    ok: false,
    message: "Database update failed.",
    code: "routine_database_update_failed",
    category: "database_update",
  };
}

function toRoutineInstance(instance: RoutineInstanceRecord): Routine {
  return {
    id: instance.id,
    routineId: instance.routineId,
    title: instance.title,
    description: instance.description,
    scheduledTime: instance.scheduledTime ?? "Flexible",
    status: instance.status,
    reminderState: "idle",
    streakText: instance.status === "pending" ? "Due today" : "Answered today",
  };
}

function toRoutineDefinition(routine: RoutineRecord): RoutineDefinition {
  return {
    id: routine.id,
    title: routine.title,
    description: routine.description,
    firstStartDate: routine.firstStartDate,
    endDate: routine.endDate,
    ruleType: routine.rule.ruleType,
    intervalValue: routine.rule.intervalValue,
    weekdays: routine.rule.weekdays,
    dayOfMonth: routine.rule.dayOfMonth,
    preferredTime: routine.rule.preferredTime,
    timezone: routine.rule.timezone,
  };
}

export async function loadRoutineDashboardData(
  userId: string,
): Promise<RoutineDashboardData> {
  const [routineDefinitions, routines] = await Promise.all([
    routineService.listRoutineDefinitions(userId),
    routineService.listTodayRoutineInstances(userId),
  ]);

  return {
    routines: routines.map(toRoutineInstance),
    routineDefinitions: routineDefinitions.map(toRoutineDefinition),
  };
}

export async function getRoutineDashboardData(): Promise<
  RoutineActionResult<RoutineDashboardData>
> {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorizedResult();
  }

  try {
    return {
      ok: true,
      data: await loadRoutineDashboardData(user.id),
    };
  } catch {
    return databaseResult();
  }
}

export async function saveRoutine(
  input: RoutineInput,
): Promise<RoutineActionResult<RoutineDashboardData>> {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorizedResult();
  }

  const validation = validateRoutineInput(input);

  if (!validation.ok) {
    return validation;
  }

  try {
    const saved = await routineService.saveRoutine(user.id, {
      id: input.id,
      title: validation.title,
      description: validation.description,
      firstStartDate: validation.firstStartDate,
      endDate: validation.endDate,
      rule: validation.rule,
    });

    if (!saved) {
      return {
        ok: false,
        message: "Routine was not found.",
        code: "routine_not_found",
        category: "not_found",
        subject: "routine",
      };
    }

    return {
      ok: true,
      data: await loadRoutineDashboardData(user.id),
    };
  } catch {
    return databaseResult();
  }
}

export async function deleteRoutine(
  routineId: string,
): Promise<RoutineActionResult<RoutineDashboardData>> {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorizedResult();
  }

  try {
    const deleted = await routineService.deleteRoutine(user.id, routineId);

    if (!deleted) {
      return {
        ok: false,
        message: "Routine was not found.",
        code: "routine_not_found",
        category: "not_found",
        subject: "routine",
      };
    }

    return {
      ok: true,
      data: await loadRoutineDashboardData(user.id),
    };
  } catch {
    return databaseResult();
  }
}

export async function completeRoutineInstance(
  instanceId: string,
): Promise<RoutineActionResult<RoutineDashboardData>> {
  return updateRoutineInstance(instanceId, "completed");
}

export async function skipRoutineInstance(
  instanceId: string,
): Promise<RoutineActionResult<RoutineDashboardData>> {
  return updateRoutineInstance(instanceId, "skipped");
}

export async function reopenRoutineInstance(
  instanceId: string,
): Promise<RoutineActionResult<RoutineDashboardData>> {
  return updateRoutineInstance(instanceId, "pending");
}

async function updateRoutineInstance(
  instanceId: string,
  status: RoutineStatus,
): Promise<RoutineActionResult<RoutineDashboardData>> {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorizedResult();
  }

  try {
    const instance =
      status === "completed"
        ? await routineService.completeRoutineInstance(user.id, instanceId)
        : status === "skipped"
          ? await routineService.skipRoutineInstance(user.id, instanceId)
          : await routineService.reopenRoutineInstance(user.id, instanceId);

    if (!instance) {
      return {
        ok: false,
        message: "Routine instance was not found.",
        code: "routine_instance_not_found",
        category: "not_found",
        subject: "routine",
      };
    }

    return {
      ok: true,
      data: await loadRoutineDashboardData(user.id),
    };
  } catch {
    return databaseResult();
  }
}
