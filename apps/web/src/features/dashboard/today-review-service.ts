import { englishDashboardMessages } from "../../messages/dashboard-messages.ts";
import {
  addDaysToDateKey,
  localDateTimeParts,
} from "../settings/time-zones.ts";
import {
  PostgresDiscordAccountRepository,
} from "../../server/discord/discord-account-repository.ts";
import type {
  DiscordDailyReviewTarget,
} from "../../server/discord/discord-account-repository.ts";
import { discordNotificationService } from "../discord/server/notification-service.ts";
import type { DiscordNotificationResult } from "../discord/server/notification-service.ts";
import {
  buildTodayReviewText,
} from "./today-review-text.ts";
import type { PinnedMemory, Routine, ScheduledEvent, Task } from "./types.ts";

export type DailyReviewCronRunResult = {
  checked: number;
  due: number;
  sent: number;
  skipped: number;
  failed: number;
};

type TodayReviewNotifier = {
  sendUserNotification(input: {
    userId: string;
    idempotencyKey: string;
    text: string;
    source: "scheduler";
    metadata: Record<string, unknown>;
    logEventName: string;
  }): Promise<DiscordNotificationResult>;
};

type DailyReviewTargetRepository = {
  listActiveDailyReviewTargets(): Promise<DiscordDailyReviewTarget[]>;
};

type ProjectDataLoader = (userId: string) => Promise<{ tasks: Task[] }>;
type RoutineDataLoader = (userId: string) => Promise<{ routines: Routine[] }>;
type EventDataLoader = (
  userId: string,
  dateKey: string,
) => Promise<{ events: ScheduledEvent[] }>;
type MemoryDataLoader = (
  userId: string,
) => Promise<{ pinnedMemories: PinnedMemory[] }>;
type DailyReviewSendResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      code: "today_review_delivery_failed" | "today_review_no_binding";
    };

const dailyReviewHour = 2;
const dailyReviewWindowMinutes = 2;

export function createTodayReviewService({
  eventDataLoader = defaultEventDataLoader,
  memoryDataLoader = defaultMemoryDataLoader,
  now = () => new Date(),
  notifier = discordNotificationService,
  projectDataLoader = defaultProjectDataLoader,
  reviewTargets = new PostgresDiscordAccountRepository(),
  routineDataLoader = defaultRoutineDataLoader,
}: {
  eventDataLoader?: EventDataLoader;
  memoryDataLoader?: MemoryDataLoader;
  now?: () => Date;
  notifier?: TodayReviewNotifier;
  projectDataLoader?: ProjectDataLoader;
  reviewTargets?: DailyReviewTargetRepository;
  routineDataLoader?: RoutineDataLoader;
} = {}) {
  return {
    async sendScheduledDailyReviews(): Promise<DailyReviewCronRunResult> {
      const occurredAt = now();
      const targets = await reviewTargets.listActiveDailyReviewTargets();
      const result: DailyReviewCronRunResult = {
        checked: targets.length,
        due: 0,
        sent: 0,
        skipped: 0,
        failed: 0,
      };

      for (const target of targets) {
        const local = localReviewMoment(occurredAt, target.timeZone);

        if (!local) {
          result.skipped += 1;
          continue;
        }

        const schedule = dailyReviewSchedule(local);

        if (!schedule.due) {
          result.skipped += 1;
          continue;
        }

        result.due += 1;

        const review = await sendReview({
          dateKey: schedule.date,
          idempotencyKey: `daily-review:${schedule.date}`,
          source: "scheduler",
          userId: target.userId,
        });

        if (review.ok) {
          result.sent += 1;
          continue;
        }

        if (review.code === "today_review_no_binding") {
          result.skipped += 1;
          continue;
        }

        result.failed += 1;
      }

      return result;
    },
  };

  async function sendReview({
    dateKey,
    idempotencyKey,
    source,
    userId,
  }: {
    dateKey: string;
    idempotencyKey: string;
    source: "scheduler";
    userId: string;
  }): Promise<DailyReviewSendResult> {
    const [projectData, routineData, eventData, memoryData] = await Promise.all([
      projectDataLoader(userId),
      routineDataLoader(userId),
      eventDataLoader(userId, dateKey),
      memoryDataLoader(userId),
    ]);
    const text = buildTodayReviewText({
      dateKey,
      events: eventData.events,
      memories: memoryData.pinnedMemories,
      routines: routineData.routines,
      summaryMessages: englishDashboardMessages.review.dailySummaryMessages,
      tasks: projectData.tasks,
    });
    const notification = await notifier.sendUserNotification({
      userId,
      idempotencyKey,
      text,
      source,
      metadata: {
        feature: "dashboard",
        action: "daily-review",
        dateKey,
        eventCount: eventData.events.length,
        taskCount: projectData.tasks.length,
        routineCount: routineData.routines.length,
        pinnedMemoryCount: memoryData.pinnedMemories.length,
      },
      logEventName: "daily_review_notification_handled",
    });

    if (notification.ok) {
      return {
        ok: true,
      };
    }

    if (notification.code === "discord_notification_no_binding") {
      return {
        ok: false,
        code: "today_review_no_binding",
      };
    }

    return {
      ok: false,
      code: "today_review_delivery_failed",
    };
  }
}

function localReviewMoment(date: Date, timeZone: string | null) {
  if (!timeZone) {
    return null;
  }

  return localDateTimeParts(date, timeZone);
}

function dailyReviewSchedule(local: {
  dateKey: string;
  hour: number;
  minute: number;
  second: number;
}) {
  if (isWithinDailyReviewWindow(local)) {
    return {
      due: true,
      date: addDaysToDateKey(local.dateKey, -1),
    };
  }

  return {
    due: false,
    date: local.dateKey,
  };
}

function isWithinDailyReviewWindow(local: {
  hour: number;
  minute: number;
  second: number;
}) {
  const actualSeconds =
    (local.hour * 60 + local.minute) * 60 + local.second;
  const targetSeconds = dailyReviewHour * 60 * 60;
  const windowSeconds = dailyReviewWindowMinutes * 60;

  return Math.abs(actualSeconds - targetSeconds) <= windowSeconds;
}

async function defaultProjectDataLoader(userId: string) {
  const { loadProjectDashboardData } = await import(
    "../projects/project-view-models.ts"
  );

  return loadProjectDashboardData(userId);
}

async function defaultRoutineDataLoader(userId: string) {
  const { loadRoutineDashboardData } = await import("../routines/actions.ts");

  return loadRoutineDashboardData(userId);
}

async function defaultEventDataLoader(userId: string, dateKey: string) {
  const { loadEventsForDateData } = await import("../events/actions.ts");

  return loadEventsForDateData(userId, dateKey);
}

async function defaultMemoryDataLoader(userId: string) {
  const { loadMemoryDashboardData } = await import(
    "../memories/memory-action-helpers.ts"
  );

  return loadMemoryDashboardData(userId);
}

export const todayReviewService = createTodayReviewService();
