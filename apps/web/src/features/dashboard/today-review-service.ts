import { randomUUID } from "node:crypto";
import { englishDashboardMessages } from "../../messages/dashboard-messages.ts";
import {
  defaultResolvedTimeZone,
  readResolvedTimeZone,
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
  todayReviewDateKey,
} from "./today-review-text.ts";
import type { PinnedMemory, Routine, Task } from "./types.ts";

export type TodayReviewActionResult =
  | {
      ok: true;
      code: "today_review_sent";
      message: string;
    }
  | {
      ok: false;
      code:
        | "auth_required"
        | "today_review_delivery_failed"
        | "today_review_no_binding";
      message: string;
    };

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
    source: "manual" | "scheduler";
    metadata: Record<string, unknown>;
    logEventName: string;
  }): Promise<DiscordNotificationResult>;
};

type DailyReviewTargetRepository = {
  listActiveDailyReviewTargets(): Promise<DiscordDailyReviewTarget[]>;
};

type ProjectDataLoader = (userId: string) => Promise<{ tasks: Task[] }>;
type RoutineDataLoader = (userId: string) => Promise<{ routines: Routine[] }>;
type MemoryDataLoader = (
  userId: string,
) => Promise<{ pinnedMemories: PinnedMemory[] }>;

export function createTodayReviewService({
  memoryDataLoader = defaultMemoryDataLoader,
  now = () => new Date(),
  notifier = discordNotificationService,
  projectDataLoader = defaultProjectDataLoader,
  reviewTargets = new PostgresDiscordAccountRepository(),
  routineDataLoader = defaultRoutineDataLoader,
}: {
  memoryDataLoader?: MemoryDataLoader;
  now?: () => Date;
  notifier?: TodayReviewNotifier;
  projectDataLoader?: ProjectDataLoader;
  reviewTargets?: DailyReviewTargetRepository;
  routineDataLoader?: RoutineDataLoader;
} = {}) {
  return {
    async sendTodayReview(userId: string): Promise<TodayReviewActionResult> {
      const dateKey = todayReviewDateKey(now());

      return sendReview({
        dateKey,
        idempotencyKey: `today-review:${dateKey}:${randomUUID()}`,
        source: "manual",
        userId,
      });
    },

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
        const local = localReviewMoment(occurredAt, target.timeZonePreference);

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
    source: "manual" | "scheduler";
    userId: string;
  }): Promise<TodayReviewActionResult> {
    const [projectData, routineData, memoryData] = await Promise.all([
      projectDataLoader(userId),
      routineDataLoader(userId),
      memoryDataLoader(userId),
    ]);
    const text = buildTodayReviewText({
      dateKey,
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
        taskCount: projectData.tasks.length,
        routineCount: routineData.routines.length,
        pinnedMemoryCount: memoryData.pinnedMemories.length,
      },
      logEventName: "daily_review_notification_handled",
    });

    if (notification.ok) {
      return {
        ok: true,
        code: "today_review_sent",
        message: "Daily Review sent to Discord.",
      };
    }

    if (notification.code === "discord_notification_no_binding") {
      return {
        ok: false,
        code: "today_review_no_binding",
        message: "No active Discord binding.",
      };
    }

    return {
      ok: false,
      code: "today_review_delivery_failed",
      message: "Daily Review could not be sent to Discord.",
    };
  }
}

function localReviewMoment(date: Date, timeZonePreference: string) {
  const timeZone =
    readResolvedTimeZone(timeZonePreference) ?? defaultResolvedTimeZone;
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    hourCycle: "h23",
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
    date: `${values.year}-${values.month}-${values.day}`,
    hour: Number(values.hour),
    minute: Number(values.minute),
    timeZone,
  };
}

function dailyReviewSchedule(local: {
  date: string;
  hour: number;
  minute: number;
}) {
  if (local.hour === 23 && local.minute >= 48) {
    return {
      due: true,
      date: local.date,
    };
  }

  if (local.hour === 0 && local.minute <= 12) {
    return {
      due: true,
      date: previousDateKey(local.date),
    };
  }

  return {
    due: false,
    date: local.date,
  };
}

function previousDateKey(date: string) {
  const previous = new Date(`${date}T00:00:00.000Z`);

  previous.setUTCDate(previous.getUTCDate() - 1);

  return previous.toISOString().slice(0, 10);
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

async function defaultMemoryDataLoader(userId: string) {
  const { loadMemoryDashboardData } = await import(
    "../memories/memory-action-helpers.ts"
  );

  return loadMemoryDashboardData(userId);
}

export const todayReviewService = createTodayReviewService();
