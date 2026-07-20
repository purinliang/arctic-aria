import {
  discordNotificationService,
  type DiscordNotificationResult,
} from "../../discord/server/notification-service.ts";
import { dateKey, shouldGenerateInstance } from "./routine-service.ts";
import { PostgresRoutineRepository } from "./postgres-routine-repository.ts";
import type {
  RoutineRecord,
  RoutineRepository,
} from "./routine-repository.ts";

export type RoutineReminderRunResult = {
  checked: number;
  due: number;
  sent: number;
  skipped: number;
  failed: number;
};

type RoutineReminderNotifier = {
  sendUserNotification(input: {
    userId: string;
    idempotencyKey: string;
    text: string;
    source: "scheduler";
    metadata: Record<string, unknown>;
    logEventName: string;
  }): Promise<DiscordNotificationResult>;
};

export function createRoutineReminderService({
  now = () => new Date(),
  notifier = discordNotificationService,
  routines = new PostgresRoutineRepository(),
}: {
  now?: () => Date;
  notifier?: RoutineReminderNotifier;
  routines?: RoutineRepository;
} = {}) {
  return {
    async sendDueRoutineReminders(): Promise<RoutineReminderRunResult> {
      const occurredAt = now();
      const activeRoutines = await routines.listActiveRoutinesForReminders();
      const result: RoutineReminderRunResult = {
        checked: activeRoutines.length,
        due: 0,
        sent: 0,
        skipped: 0,
        failed: 0,
      };

      for (const routine of activeRoutines) {
        const local = localRoutineMoment(routine, occurredAt);

        if (!local || !shouldGenerateInstance(routine, local.date)) {
          result.skipped += 1;
          continue;
        }

        result.due += 1;

        const instance = await routines.ensureRoutineInstance({
          userId: routine.userId,
          routineId: routine.id,
          scheduledDate: local.date,
          scheduledTime: routine.rule.preferredTime,
          occurredAt,
        });

        if (!instance || instance.status !== "pending") {
          result.skipped += 1;
          continue;
        }

        const notification = await notifier.sendUserNotification({
          userId: routine.userId,
          idempotencyKey: routineReminderIdempotencyKey(instance.id),
          text: routineReminderText(routine),
          source: "scheduler",
          metadata: {
            feature: "routines",
            action: "routine-reminder",
            routineId: routine.id,
            routineInstanceId: instance.id,
            scheduledDate: instance.scheduledDate,
            scheduledTime: instance.scheduledTime,
          },
          logEventName: "routine_reminder_notification_handled",
        });

        if (notification.ok) {
          result.sent += 1;
          continue;
        }

        if (notification.code === "discord_notification_no_binding") {
          result.skipped += 1;
          continue;
        }

        result.failed += 1;
      }

      return result;
    },
  };
}

function localRoutineMoment(routine: RoutineRecord, occurredAt: Date) {
  if (!routine.rule.preferredTime) {
    return null;
  }

  const local = localDateTimeParts(occurredAt, routine.rule.timezone);

  return local.time === routine.rule.preferredTime ? local : null;
}

function localDateTimeParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
    hour12: false,
    minute: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric",
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return {
    date: dateKey(
      new Date(`${values.year}-${values.month}-${values.day}T00:00:00.000Z`),
    ),
    time: `${values.hour}:${values.minute}`,
  };
}

function routineReminderIdempotencyKey(instanceId: string) {
  return `routine-reminder:${instanceId}`;
}

function routineReminderText(routine: RoutineRecord) {
  return routine.rule.preferredTime
    ? `Routine reminder: ${routine.title} is due at ${routine.rule.preferredTime}.`
    : `Routine reminder: ${routine.title} is due.`;
}

export const routineReminderService = createRoutineReminderService();
