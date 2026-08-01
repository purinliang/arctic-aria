import type { RoutineDashboardData } from "./actions";
import {
  toRoutineDefinition,
  toRoutineGroupOption,
  toRoutineInstance,
} from "./routine-dashboard-mappers";
import { loadUserResolvedTimeZone } from "@/features/settings/server/user-time-zone";
import { routineService } from "./server/routine-service";

export async function loadRoutineDashboardData(
  userId: string,
): Promise<RoutineDashboardData> {
  const timeZone = await loadUserResolvedTimeZone(userId);
  const [
    routineDefinitions,
    routines,
    routineInstances,
    routineGroups,
  ] = await Promise.all([
    routineService.listRoutineDefinitions(userId),
    routineService.listTodayRoutineInstances(userId),
    routineService.listUpcomingRoutineInstances(userId, timeZone),
    routineService.listRoutineGroups(userId),
  ]);

  return {
    routines: routines.map(toRoutineInstance),
    routineInstances: routineInstances.map(toRoutineInstance),
    routineDefinitions: routineDefinitions.map(toRoutineDefinition),
    routineGroups: routineGroups.map(toRoutineGroupOption),
  };
}
