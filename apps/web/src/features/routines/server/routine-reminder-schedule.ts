import { createHash } from "node:crypto";
import {
  addDaysToDateKey,
  localDateKey,
  zonedDateTimeToUtcDate,
} from "../../settings/time-zones.ts";
import type { RoutineInstanceRecord, RoutineRecord } from "./routine-repository.ts";

export const fallbackRoutineScheduledTime = "18:00";
export const routineReminderCronIntervalMinutes = 15;
export const routineReminderLeadMinutes = 30;
export const routineReminderWindowMinutes = 2;
export const routineReminderTextMaxLength = 2000;

const msPerMinute = 60 * 1000;
const routineReminderDescriptionMaxLength = 240;

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

  return snapToCronInterval(
    new Date(scheduledAt.getTime() - routineReminderLeadMinutes * msPerMinute),
  );
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

  const elapsedMs = Math.abs(occurredAt.getTime() - remindAt.getTime());

  return elapsedMs <= windowMinutes * msPerMinute;
}

export function routineReminderNotificationBatches(
  instances: RoutineInstanceRecord[],
  maxTextLength = routineReminderTextMaxLength,
) {
  const sortedInstances = [...instances].sort(compareRoutineReminderInstances);
  const batches: RoutineInstanceRecord[][] = [];
  let currentBatch: RoutineInstanceRecord[] = [];

  for (const instance of sortedInstances) {
    const nextBatch = [...currentBatch, instance];

    if (
      currentBatch.length > 0 &&
      routineReminderText(nextBatch).length > maxTextLength
    ) {
      batches.push(currentBatch);
      currentBatch = [instance];
      continue;
    }

    currentBatch = nextBatch;
  }

  if (currentBatch.length > 0) {
    batches.push(currentBatch);
  }

  return batches;
}

export function routineReminderIdempotencyKey(
  instances: RoutineInstanceRecord[],
) {
  const idempotencyInput = [...instances]
    .sort(compareRoutineReminderInstances)
    .map((instance) => ({
      id: instance.id,
      remindAt: instance.remindAt?.toISOString() ?? null,
      userId: instance.userId,
    }));
  const digest = createHash("sha256")
    .update(JSON.stringify(idempotencyInput))
    .digest("hex")
    .slice(0, 32);

  return `routine-reminder:${digest}`;
}

export function routineReminderText(instances: RoutineInstanceRecord[]) {
  const sortedInstances = [...instances].sort(compareRoutineReminderInstances);
  const heading =
    sortedInstances.length === 1 ? "### Routine Reminder" : "### Routine Reminders";
  const rows = sortedInstances.map(routineReminderRow);

  return [heading, "", ...rows].join("\n");
}

function routineReminderRow(instance: RoutineInstanceRecord) {
  const checkbox = "`[ ]`";
  const title = markdownText(instance.title);
  const description = descriptionPreview(instance.description);
  const dueText = instance.scheduledTime
    ? `Due at ${instance.scheduledTime}.`
    : "Due now.";

  if (!description) {
    return `- ${checkbox} **${title}**: ${dueText}`;
  }

  return `- ${checkbox} **${title}**: ${markdownText(description)} ${dueText}`;
}

function descriptionPreview(value: string | null) {
  const description = value?.trim().replace(/\s+/g, " ");

  if (!description) {
    return null;
  }

  if (description.length <= routineReminderDescriptionMaxLength) {
    return description;
  }

  return `${description.slice(0, routineReminderDescriptionMaxLength - 3).trimEnd()}...`;
}

function markdownText(value: string) {
  return value.replace(/([\\*_`~])/g, "\\$1");
}

function compareRoutineReminderInstances(
  left: RoutineInstanceRecord,
  right: RoutineInstanceRecord,
) {
  return (
    reminderTime(left) - reminderTime(right) ||
    scheduledTime(left).localeCompare(scheduledTime(right)) ||
    left.title.localeCompare(right.title) ||
    left.id.localeCompare(right.id)
  );
}

function reminderTime(instance: RoutineInstanceRecord) {
  return instance.remindAt?.getTime() ?? Number.MAX_SAFE_INTEGER;
}

function scheduledTime(instance: RoutineInstanceRecord) {
  return instance.scheduledTime ?? "";
}

function snapToCronInterval(date: Date) {
  const intervalMs = routineReminderCronIntervalMinutes * msPerMinute;

  return new Date(Math.round(date.getTime() / intervalMs) * intervalMs);
}
