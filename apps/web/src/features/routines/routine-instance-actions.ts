"use server";

import { getCurrentUser } from "@/features/auth/actions";
import type { RoutineStatus } from "@/features/dashboard/types";
import type {
  RoutineActionResult,
  RoutineDashboardData,
} from "./actions";
import { loadRoutineDashboardData } from "./routine-dashboard-data";
import { routineService } from "./server/routine-service";

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
