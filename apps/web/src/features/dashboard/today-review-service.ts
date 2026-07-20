import { randomUUID } from "node:crypto";
import {
  discordNotificationService,
  type DiscordNotificationResult,
} from "../discord/server/notification-service.ts";
import { loadProjectDashboardData } from "../projects/project-view-models.ts";
import { loadMemoryDashboardData } from "../memories/memory-action-helpers.ts";
import { loadRoutineDashboardData } from "../routines/actions.ts";
import { buildTodayReviewText } from "./today-review-text.ts";

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

type TodayReviewNotifier = {
  sendUserNotification(input: {
    userId: string;
    idempotencyKey: string;
    text: string;
    source: "manual";
    metadata: Record<string, unknown>;
    logEventName: string;
  }): Promise<DiscordNotificationResult>;
};

export function createTodayReviewService({
  notifier = discordNotificationService,
}: {
  notifier?: TodayReviewNotifier;
} = {}) {
  return {
    async sendTodayReview(userId: string): Promise<TodayReviewActionResult> {
      const [projectData, routineData, memoryData] = await Promise.all([
        loadProjectDashboardData(userId),
        loadRoutineDashboardData(userId),
        loadMemoryDashboardData(userId),
      ]);
      const text = buildTodayReviewText({
        memories: memoryData.pinnedMemories,
        routines: routineData.routines,
        tasks: projectData.tasks,
      });
      const result = await notifier.sendUserNotification({
        userId,
        idempotencyKey: `today-review:${todayKey()}:${randomUUID()}`,
        text,
        source: "manual",
        metadata: {
          feature: "dashboard",
          action: "today-review",
          taskCount: projectData.tasks.length,
          routineCount: routineData.routines.length,
          pinnedMemoryCount: memoryData.pinnedMemories.length,
        },
        logEventName: "today_review_notification_handled",
      });

      if (result.ok) {
        return {
          ok: true,
          code: "today_review_sent",
          message: "Today Review sent to Discord.",
        };
      }

      if (result.code === "discord_notification_no_binding") {
        return {
          ok: false,
          code: "today_review_no_binding",
          message: "No active Discord binding.",
        };
      }

      return {
        ok: false,
        code: "today_review_delivery_failed",
        message: "Today Review could not be sent to Discord.",
      };
    },
  };
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export const todayReviewService = createTodayReviewService();
