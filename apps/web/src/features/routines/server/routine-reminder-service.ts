import {
  discordNotificationService,
  type DiscordNotificationResult,
} from "../../discord/server/notification-service.ts";
import { shouldGenerateInstance } from "./routine-service.ts";
import { PostgresRoutineRepository } from "./postgres-routine-repository.ts";
import type {
  RoutineInstanceRecord,
  RoutineRepository,
} from "./routine-repository.ts";
import {
  isRoutineReminderDueAt,
  resolveRoutineScheduledTime,
  routineReminderAt,
  routineReminderCandidateDates,
  routineReminderIdempotencyKey,
  routineReminderNotificationBatches,
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

      for (const instances of routineReminderNotificationGroups(dueInstances)) {
        const userId = instances[0]?.userId;

        if (!userId) {
          continue;
        }

        const notification = await notifier.sendUserNotification({
          userId,
          idempotencyKey: routineReminderIdempotencyKey(instances),
          text: routineReminderText(instances),
          source: "scheduler",
          metadata: routineReminderMetadata(instances),
          logEventName: "routine_reminder_notification_handled",
        });

        if (notification.ok) {
          for (const instance of instances) {
            await routines.markRoutineInstanceReminded({
              userId: instance.userId,
              instanceId: instance.id,
              remindedAt: occurredAt,
            });
          }
          result.sent += instances.length;
          continue;
        }

        if (notification.code === "discord_notification_no_binding") {
          result.skipped += instances.length;
          continue;
        }

        result.failed += instances.length;
      }

      return result;
    },
  };
}

export const routineReminderService = createRoutineReminderService();

function routineReminderNotificationGroups(
  instances: RoutineInstanceRecord[],
) {
  const userGroups = new Map<string, RoutineInstanceRecord[]>();

  for (const instance of instances) {
    const group = userGroups.get(instance.userId) ?? [];
    group.push(instance);
    userGroups.set(instance.userId, group);
  }

  return [...userGroups.values()].flatMap((group) =>
    routineReminderNotificationBatches(group),
  );
}

function routineReminderMetadata(instances: RoutineInstanceRecord[]) {
  const firstInstance = instances[0];
  const metadata: Record<string, unknown> = {
    feature: "routines",
    action: "routine-reminder",
    routineCount: instances.length,
    routineIds: uniqueValues(instances.map((instance) => instance.routineId)),
    routineInstanceIds: instances.map((instance) => instance.id),
    scheduledDates: uniqueValues(
      instances.map((instance) => instance.scheduledDate),
    ),
    scheduledTimes: uniqueValues(
      instances.map((instance) => instance.scheduledTime),
    ),
    remindAts: uniqueValues(
      instances.map((instance) => instance.remindAt?.toISOString() ?? null),
    ),
  };

  if (instances.length === 1 && firstInstance) {
    metadata.routineId = firstInstance.routineId;
    metadata.routineInstanceId = firstInstance.id;
    metadata.scheduledDate = firstInstance.scheduledDate;
    metadata.scheduledTime = firstInstance.scheduledTime;
    metadata.remindAt = firstInstance.remindAt?.toISOString() ?? null;
  }

  return metadata;
}

function uniqueValues<T>(values: T[]) {
  return [...new Set(values)];
}
