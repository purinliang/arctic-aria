"use server";

import { getCurrentUser } from "@/features/auth/actions";
import type {
  Routine,
  RoutineDefinition,
  RoutineGroupOption,
} from "@/features/dashboard/types";
import { routineService } from "./server/routine-service";
import { loadRoutineDashboardData } from "./routine-dashboard-data";
import {
  validateRoutineGroupInput,
  validateRoutineInput,
} from "./routine-action-helpers";
import type {
  RoutineGroupInput,
  RoutineInput,
} from "./routine-action-helpers";
import {
  applyRoutineTemplateCommands,
  prepareRoutineTemplateForUser,
} from "./routine-template-actions";
import type { RoutineTemplateParseData } from "./routine-template-types";
import type { ActionFailureResult } from "../../messages/action-result.ts";

export type {
  RoutineGroupInput,
  RoutineInput,
} from "./routine-action-helpers";
export type { RoutineTemplateParseData } from "./routine-template-types";

export type RoutineDashboardData = {
  routines: Routine[];
  routineInstances: Routine[];
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
      startDate: validation.startDate,
      endDate: validation.endDate,
      estimatedDurationMinutes: validation.estimatedDurationMinutes,
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

export async function parseRoutineTemplate(
  routineId: string | null,
  source: string,
): Promise<RoutineActionResult<RoutineTemplateParseData>> {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorizedResult();
  }

  try {
    const prepared = await prepareRoutineTemplateForUser(
      user.id,
      routineId,
      source,
    );

    if (!prepared.ok) {
      return prepared;
    }

    return {
      ok: true,
      data: {
        preview: prepared.data.preview,
      },
    };
  } catch {
    return databaseResult();
  }
}

export async function applyRoutineTemplate(
  routineId: string | null,
  source: string,
): Promise<RoutineActionResult<RoutineDashboardData>> {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorizedResult();
  }

  try {
    const prepared = await prepareRoutineTemplateForUser(
      user.id,
      routineId,
      source,
    );

    if (!prepared.ok) {
      return prepared;
    }

    const applied = await applyRoutineTemplateCommands(user.id, prepared.data);

    if (!applied.ok) {
      return applied;
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
