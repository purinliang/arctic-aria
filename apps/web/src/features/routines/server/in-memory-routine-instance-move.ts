import { addDaysToDateKey, localScheduledDateKey } from "../../settings/time-zones.ts";
import type {
  RoutineInstanceRecord,
  RoutineRecord,
} from "./routine-repository.ts";
import {
  nextRoutineCronTick,
  resolveRoutineScheduledTime,
  routineReminderAt,
} from "./routine-reminder-schedule.ts";

export function moveRoutineInstanceToTomorrowInMemory(
  routines: RoutineRecord[],
  instances: RoutineInstanceRecord[],
  completionHistoryInstanceIds: Set<string>,
  input: { userId: string; instanceId: string; occurredAt: Date },
) {
  const instance = instances.find(
    (current) => current.userId === input.userId && current.id === input.instanceId,
  );
  const routine = routines.find(
    (current) =>
      current.userId === input.userId &&
      current.id === instance?.routineId &&
      current.deletedAt === null,
  );

  if (
    !instance ||
    !routine ||
    instance.status !== "pending" ||
    instance.scheduledDate !==
      localScheduledDateKey({ date: input.occurredAt, timeZone: routine.rule.timezone })
  ) {
    return null;
  }

  const scheduledDate = addDaysToDateKey(instance.scheduledDate, 1);
  const tomorrowRows = instances.filter(
    (current) =>
      current.userId === input.userId &&
      current.routineId === routine.id &&
      current.scheduledDate === scheduledDate,
  );

  if (
    tomorrowRows.some(
      (current) =>
        current.status !== "pending" ||
        current.remindedAt !== null ||
        current.movedAt !== null ||
        current.movedFromDate !== null ||
        current.updatedAt.getTime() !== current.createdAt.getTime() ||
        completionHistoryInstanceIds.has(current.id),
    )
  ) {
    return null;
  }

  const scheduledTime = resolveRoutineScheduledTime(routine);
  const plannedRemindAt = routineReminderAt({
    scheduledDate,
    scheduledTime,
    timeZone: routine.rule.timezone,
  });
  const nextTick = nextRoutineCronTick(input.occurredAt);
  instance.movedFromDate = instance.scheduledDate;
  instance.scheduledDate = scheduledDate;
  instance.scheduledTime = scheduledTime;
  instance.remindAt =
    plannedRemindAt && plannedRemindAt > nextTick ? plannedRemindAt : nextTick;
  instance.remindedAt = null;
  instance.movedAt = input.occurredAt;
  instance.updatedAt = input.occurredAt;

  return {
    instance,
    instances: instances.filter((current) => !tomorrowRows.includes(current)),
  };
}
