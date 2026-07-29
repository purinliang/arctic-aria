import type { RoutineDashboardData } from "./actions";
import {
  toRoutineDefinition,
  toRoutineGroupOption,
  toRoutineInstance,
} from "./routine-dashboard-mappers";
import { routineService } from "./server/routine-service";

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
