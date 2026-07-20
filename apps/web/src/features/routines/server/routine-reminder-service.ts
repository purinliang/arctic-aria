import {
  discordNotificationService,
  type DiscordNotificationResult,
} from "../../discord/server/notification-service.ts";
import { shouldGenerateInstance } from "./routine-service.ts";
import { PostgresRoutineRepository } from "./postgres-routine-repository.ts";
import type {
  RoutineRepository,
} from "./routine-repository.ts";
import {
  isRoutineReminderDueAt,
  resolveRoutineScheduledTime,
  routineReminderAt,
  routineReminderCandidateDates,
  routineReminderIdempotencyKey,
  routineReminderText,
  routineReminderWindowMinutes,
} from "./routine-reminder-schedule.ts";

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
        let hasDueCandidate = false;
        let hasPendingDueCandidate = false;

        for (const scheduledDate of routineReminderCandidateDates(
          routine,
          occurredAt,
        )) {
          if (!shouldGenerateInstance(routine, scheduledDate)) {
            continue;
          }

          const scheduledTime = resolveRoutineScheduledTime(routine);
          const remindAt = routineReminderAt({
            scheduledDate,
            scheduledTime,
            timeZone: routine.rule.timezone,
          });

          if (
            !isRoutineReminderDueAt({
              occurredAt,
              remindAt,
            })
          ) {
            continue;
          }

          hasDueCandidate = true;

          const instance = await routines.ensureRoutineInstance({
            userId: routine.userId,
            routineId: routine.id,
            scheduledDate,
            scheduledTime,
            remindAt,
            occurredAt,
          });

          if (instance?.status === "pending" && instance.remindedAt === null) {
            hasPendingDueCandidate = true;
          }
        }

        if (!hasDueCandidate || !hasPendingDueCandidate) {
          result.skipped += 1;
        }
      }

      const dueInstances =
        await routines.listPendingRoutineInstancesForReminderWindow({
          occurredAt,
          windowMinutes: routineReminderWindowMinutes,
        });

      result.due = dueInstances.length;

      for (const instance of dueInstances) {
        const notification = await notifier.sendUserNotification({
          userId: instance.userId,
          idempotencyKey: routineReminderIdempotencyKey(instance),
          text: routineReminderText(instance),
          source: "scheduler",
          metadata: {
            feature: "routines",
            action: "routine-reminder",
            routineId: instance.routineId,
            routineInstanceId: instance.id,
            scheduledDate: instance.scheduledDate,
            scheduledTime: instance.scheduledTime,
            remindAt: instance.remindAt?.toISOString() ?? null,
          },
          logEventName: "routine_reminder_notification_handled",
        });

        if (notification.ok) {
          await routines.markRoutineInstanceReminded({
            userId: instance.userId,
            instanceId: instance.id,
            remindedAt: occurredAt,
          });
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

export const routineReminderService = createRoutineReminderService();
