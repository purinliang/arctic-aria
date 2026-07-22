"use server";

import { getCurrentUser } from "@/features/auth/actions";
import type {
  Routine,
  RoutineDefinition,
  RoutineGroupOption,
  RoutineStatus,
} from "@/features/dashboard/types";
import { routineService } from "./server/routine-service";
import type {
  RoutineInstanceRecord,
  RoutineGroupRecord,
  RoutineRecord,
} from "./server/routine-repository";
import {
  validateRoutineGroupInput,
  validateRoutineInput,
} from "./routine-action-helpers";
import type {
  RoutineGroupInput,
  RoutineInput,
} from "./routine-action-helpers";
import type { ActionFailureResult } from "../../messages/action-result.ts";

export type {
  RoutineGroupInput,
  RoutineInput,
} from "./routine-action-helpers";

export type RoutineDashboardData = {
  routines: Routine[];
  routineDefinitions: RoutineDefinition[];
  routineGroups: RoutineGroupOption[];
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

function duplicateRoutineGroupResult<T>(): RoutineActionResult<T> {
  return {
    ok: false,
    message: "A routine group with that name already exists.",
    code: "routine_group_duplicate",
    category: "domain",
    action: "save",
    subject: "group",
    field: "name",
    reason: "duplicate",
  };
}

function isDatabaseUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
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
    groupId: routine.groupId,
    groupName: routine.groupName,
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

function toRoutineGroupOption(group: RoutineGroupRecord): RoutineGroupOption {
  return {
    id: group.id,
    name: group.name,
    description: group.description,
  };
}

export async function loadRoutineDashboardData(
  userId: string,
): Promise<RoutineDashboardData> {
  const [routineDefinitions, routines, routineGroups] = await Promise.all([
    routineService.listRoutineDefinitions(userId),
    routineService.listTodayRoutineInstances(userId),
    routineService.listRoutineGroups(userId),
  ]);

  return {
    routines: routines.map(toRoutineInstance),
    routineDefinitions: routineDefinitions.map(toRoutineDefinition),
    routineGroups: routineGroups.map(toRoutineGroupOption),
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
    if (validation.groupId) {
      const group = (await routineService.listRoutineGroups(user.id)).find(
        (item) => item.id === validation.groupId,
      );

      if (!group) {
        return {
          ok: false,
          message: "Routine group was not found.",
          code: "routine_group_not_found",
          category: "not_found",
          subject: "group",
        };
      }
    }

    const saved = await routineService.saveRoutine(user.id, {
      id: input.id,
      groupId: validation.groupId,
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

export async function saveRoutineGroup(
  input: RoutineGroupInput,
): Promise<RoutineActionResult<RoutineDashboardData>> {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorizedResult();
  }

  const validation = validateRoutineGroupInput(input);

  if (!validation.ok) {
    return validation;
  }

  try {
    const groups = await routineService.listRoutineGroups(user.id);
    const duplicate = groups.some(
      (group) =>
        group.id !== input.id &&
        group.name.toLocaleLowerCase() ===
          validation.name.toLocaleLowerCase(),
    );

    if (duplicate) {
      return duplicateRoutineGroupResult();
    }

    const saved = await routineService.saveRoutineGroup(user.id, {
      id: input.id,
      name: validation.name,
      description: validation.description,
    });

    if (!saved) {
      return {
        ok: false,
        message: "Routine group was not found.",
        code: "routine_group_not_found",
        category: "not_found",
        subject: "group",
      };
    }

    return {
      ok: true,
      data: await loadRoutineDashboardData(user.id),
    };
  } catch (error) {
    if (isDatabaseUniqueViolation(error)) {
      return duplicateRoutineGroupResult();
    }

    return databaseResult();
  }
}

export async function deleteRoutineGroup(
  groupId: string,
): Promise<RoutineActionResult<RoutineDashboardData>> {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorizedResult();
  }

  try {
    const deleted = await routineService.deleteRoutineGroup(user.id, groupId);

    if (!deleted) {
      return {
        ok: false,
        message: "Routine group was not found.",
        code: "routine_group_not_found",
        category: "not_found",
        subject: "group",
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
