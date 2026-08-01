import type {
  Routine,
  RoutineDefinition,
  RoutineGroupOption,
} from "@/features/dashboard/types";
import type {
  RoutineGroupRecord,
  RoutineInstanceRecord,
  RoutineRecord,
} from "./server/routine-repository";

export function toRoutineInstance(instance: RoutineInstanceRecord): Routine {
  return {
    id: instance.id,
    routineId: instance.routineId,
    title: instance.title,
    description: instance.description,
    scheduledDate: instance.scheduledDate,
    scheduledTime: instance.scheduledTime ?? "Flexible",
    status: instance.status,
    reminderState: "idle",
    streakText: instance.status === "pending" ? "Due today" : "Answered today",
  };
}

export function toRoutineDefinition(
  routine: RoutineRecord,
): RoutineDefinition {
  return {
    id: routine.id,
    groupId: routine.groupId,
    groupName: routine.groupName,
    title: routine.title,
    description: routine.description,
    startDate: routine.startDate,
    endDate: routine.endDate,
    estimatedDurationMinutes: routine.estimatedDurationMinutes,
    ruleType: routine.rule.ruleType,
    intervalValue: routine.rule.intervalValue,
    weekdays: routine.rule.weekdays,
    dayOfMonth: routine.rule.dayOfMonth,
    preferredTime: routine.rule.preferredTime,
    timezone: routine.rule.timezone,
  };
}

export function toRoutineGroupOption(
  group: RoutineGroupRecord,
): RoutineGroupOption {
  return {
    id: group.id,
    name: group.name,
    description: group.description,
  };
}
