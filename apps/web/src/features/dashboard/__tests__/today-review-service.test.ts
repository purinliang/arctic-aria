import assert from "node:assert/strict";
import test from "node:test";
import {
  buildTodayReviewSummary,
  buildTodayReviewText,
} from "../today-review-text.ts";
import type { TodayReviewSummaryMessages } from "../today-review-text.ts";
import { createTodayReviewService } from "../today-review-service.ts";
import type { DiscordNotificationResult } from "../../discord/server/notification-service.ts";

const summaryMessages: TodayReviewSummaryMessages = {
  fulfilled: ["fulfilled"],
  near: ["near"],
  steady: ["steady"],
  started: ["started"],
  life: ["life"],
  gentle: ["gentle"],
  open: ["open"],
};

test("selects a status-aware review summary", () => {
  assert.equal(
    summaryFor({ doneTaskCount: 1, doneRoutineCount: 1 }),
    "fulfilled",
  );
  assert.equal(
    summaryFor({
      doneTaskCount: 1,
      doneRoutineCount: 1,
      openRoutineCount: 1,
    }),
    "near",
  );
  assert.equal(summaryFor({ doneTaskCount: 1, openTaskCount: 1 }), "steady");
  assert.equal(
    summaryFor({ doneRoutineCount: 1, openTaskCount: 1, openRoutineCount: 1 }),
    "started",
  );
  assert.equal(summaryFor({ doneRoutineCount: 1, openTaskCount: 2 }), "started");
  assert.equal(summaryFor({ experiencedMemoryCount: 1 }), "life");
  assert.equal(summaryFor({ openTaskCount: 1 }), "gentle");
  assert.equal(summaryFor({}), "open");
});

test("builds Today Review text from dashboard items", () => {
  const text = buildTodayReviewText({
    dateKey: "2026-07-18",
    tasks: [
      {
        id: "task-1",
        projectId: "project-1",
        title: "Submit form",
        description: "Send the application form.",
        projectLabel: "Application",
        milestoneLabel: "",
        deadline: "",
        status: "done",
        startDate: "",
        deadlineDate: "",
      },
      {
        id: "task-2",
        projectId: "project-1",
        title: "Write notes",
        description: "Prepare tomorrow's notes.",
        projectLabel: "Application",
        milestoneLabel: "",
        deadline: "",
        status: "todo",
        startDate: "",
        deadlineDate: "",
      },
    ],
    routines: [
      {
        id: "routine-instance-1",
        routineId: "routine-1",
        title: "Evening cleanup",
        description: "Reset the desk.",
        scheduledTime: "20:00",
        status: "completed",
        reminderState: "idle",
        streakText: "",
      },
    ],
    memories: [
      {
        id: "pinned-memory-2",
        memoryId: "memory-2",
        category: "Cuisine",
        categoryBuiltInKey: "cuisine",
        title: "Soup place",
        description: "A calm dinner spot.",
        position: 0,
        status: "completed",
      },
      {
        id: "pinned-memory-1",
        memoryId: "memory-1",
        category: "Book",
        categoryBuiltInKey: "book",
        title: "Quiet book",
        description: null,
        position: 1,
        status: "active",
      },
    ],
    summaryMessages: {
      ...summaryMessages,
      steady: ["Some work is done, and the rest has shape."],
    },
  });

  assert.equal(
    text,
    [
      "### Daily Review for Jul 18, 2026 Sat",
      "",
      "Some work is done, and the rest has shape. You finished 1 task and 1 routine today. You also experienced 1 pinned memory.",
      "",
      "### Tasks",
      "- `[x]` **Submit form**: Send the application form.",
      "- `[ ]` **Write notes**: Prepare tomorrow's notes.",
      "### Routines",
      "- `[x]` **Evening cleanup**: Reset the desk.",
      "### Pinned Memories",
      "- `[x]` **Soup place**: A calm dinner spot.",
      "- `[ ]` **Quiet book**",
    ].join("\n"),
  );
});

test("uses friendly zero-count Today Review text", () => {
  const text = buildTodayReviewText({
    dateKey: "2026-07-18",
    memories: [],
    routines: [],
    summaryMessages: {
      ...summaryMessages,
      open: ["A quiet slate can still be useful."],
    },
    tasks: [],
  });

  assert.equal(
    text,
    [
      "### Daily Review for Jul 18, 2026 Sat",
      "",
      "A quiet slate can still be useful. No tasks or routines were finished today. No pinned memories were experienced today.",
      "",
      "### Tasks",
      "No tasks were selected today.",
      "### Routines",
      "No routines were due today.",
      "### Pinned Memories",
      "No pinned memories yet.",
    ].join("\n"),
  );
});

test("scheduled Daily Review sends during local day-end window", async () => {
  const notifications: Array<{
    idempotencyKey: string;
    source: string;
    text: string;
  }> = [];
  const service = createTodayReviewService({
    now: () => new Date("2026-07-18T13:45:00.000Z"),
    notifier: {
      async sendUserNotification(input) {
        notifications.push(input);

        return discordSentResult();
      },
    },
    reviewTargets: {
      async listActiveDailyReviewTargets() {
        return [
          {
            userId: "user-1",
            timeZonePreference: "Australia/Sydney",
          },
        ];
      },
    },
    projectDataLoader: async () => ({
      projects: [],
      tasks: [],
    }),
    routineDataLoader: async () => ({
      routineDefinitions: [],
      routines: [],
    }),
    memoryDataLoader: async () => ({
      categories: [],
      memoryRecords: [],
      pinnedMemories: [],
    }),
  });

  const result = await service.sendScheduledDailyReviews();

  assert.deepEqual(result, {
    checked: 1,
    due: 1,
    failed: 0,
    sent: 1,
    skipped: 0,
  });
  assert.equal(notifications.length, 1);
  assert.equal(notifications[0]?.idempotencyKey, "daily-review:2026-07-18");
  assert.equal(notifications[0]?.source, "scheduler");
  assert.match(
    notifications[0]?.text ?? "",
    /^### Daily Review for Jul 18, 2026 Sat/,
  );
});

test("scheduled Daily Review skips outside local day-end window", async () => {
  let loaderCalled = false;
  const service = createTodayReviewService({
    now: () => new Date("2026-07-18T13:30:00.000Z"),
    notifier: {
      async sendUserNotification() {
        throw new Error("notification should not be sent");
      },
    },
    reviewTargets: {
      async listActiveDailyReviewTargets() {
        return [
          {
            userId: "user-1",
            timeZonePreference: "Australia/Sydney",
          },
        ];
      },
    },
    projectDataLoader: async () => {
      loaderCalled = true;

      return {
        projects: [],
        tasks: [],
      };
    },
  });

  const result = await service.sendScheduledDailyReviews();

  assert.deepEqual(result, {
    checked: 1,
    due: 0,
    failed: 0,
    sent: 0,
    skipped: 1,
  });
  assert.equal(loaderCalled, false);
});

function summaryFor(
  input: Partial<{
    doneTaskCount: number;
    openTaskCount: number;
    doneRoutineCount: number;
    openRoutineCount: number;
    experiencedMemoryCount: number;
  }>,
) {
  return buildTodayReviewSummary({
    dateKey: "2026-07-18",
    doneTaskCount: input.doneTaskCount ?? 0,
    openTaskCount: input.openTaskCount ?? 0,
    doneRoutineCount: input.doneRoutineCount ?? 0,
    openRoutineCount: input.openRoutineCount ?? 0,
    experiencedMemoryCount: input.experiencedMemoryCount ?? 0,
    messages: summaryMessages,
  });
}

function discordSentResult(): DiscordNotificationResult {
  return {
    ok: true,
    code: "discord_notification_sent",
  };
}
