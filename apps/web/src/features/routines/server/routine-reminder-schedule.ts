import { zonedDateTimeToUtcDate } from "../../settings/time-zones.ts";
import type { RoutineInstanceRecord, RoutineRecord } from "./routine-repository.ts";

export const fallbackRoutineScheduledTime = "18:00";
export const routineReminderLeadMinutes = 30;
export const routineReminderWindowMinutes = 25;

const msPerMinute = 60 * 1000;
const msPerDay = 24 * 60 * 60 * 1000;

export function resolveRoutineScheduledTime(routine: RoutineRecord) {
  return routine.rule.preferredTime ?? fallbackRoutineScheduledTime;
}

export function routineReminderAt({
  scheduledDate,
  scheduledTime,
  timeZone,
}: {
  scheduledDate: string;
  scheduledTime: string;
  timeZone: string;
}) {
  const scheduledAt = zonedDateTimeToUtcDate({
    dateKey: scheduledDate,
    time: scheduledTime,
    timeZone,
  });

  if (!scheduledAt) {
    return null;
  }

  return new Date(scheduledAt.getTime() - routineReminderLeadMinutes * msPerMinute);
}

export function routineReminderCandidateDates(
  routine: RoutineRecord,
  occurredAt: Date,
) {
  const today = localDateKey(occurredAt, routine.rule.timezone);

  return [today, addDaysToDateKey(today, 1)];
}

export function isRoutineReminderDueAt({
  occurredAt,
  remindAt,
  windowMinutes = routineReminderWindowMinutes,
}: {
  occurredAt: Date;
  remindAt: Date | null;
  windowMinutes?: number;
}) {
  if (!remindAt) {
    return false;
  }

  const elapsedMs = occurredAt.getTime() - remindAt.getTime();

  return elapsedMs >= 0 && elapsedMs <= windowMinutes * msPerMinute;
}

export function routineReminderIdempotencyKey(
  instance: RoutineInstanceRecord,
) {
  const reminderKey = instance.remindAt?.toISOString() ?? "unscheduled";

  return `routine-reminder:${instance.id}:${reminderKey}`;
}

export function routineReminderText(instance: RoutineInstanceRecord) {
  return instance.scheduledTime
    ? `Routine reminder: ${instance.title} is due at ${instance.scheduledTime}.`
    : `Routine reminder: ${instance.title} is due.`;
}

function localDateKey(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric",
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return `${values.year}-${values.month}-${values.day}`;
}

function addDaysToDateKey(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T00:00:00.000Z`);

  return new Date(date.getTime() + days * msPerDay).toISOString().slice(0, 10);
}
