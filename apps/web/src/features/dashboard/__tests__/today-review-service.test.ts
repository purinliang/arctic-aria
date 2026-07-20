import assert from "node:assert/strict";
import test from "node:test";
import {
  buildTodayReviewSummary,
  buildTodayReviewText,
} from "../today-review-text.ts";
import type { TodayReviewSummaryMessages } from "../today-review-text.ts";

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
        description: null,
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
        description: null,
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
        description: null,
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
        description: null,
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
      "## Today Review",
      "",
      "### Tasks",
      "You completed 1 task today:",
      "- Submit form",
      "",
      "Open tasks:",
      "- Write notes",
      "",
      "### Routines",
      "You completed 1 routine today:",
      "- Evening cleanup",
      "",
      "Open routines:",
      "None.",
      "",
      "### Pinned Memories",
      "You experienced 1 pinned memory today:",
      "- Soup place",
      "",
      "Not yet:",
      "- Quiet book",
      "",
      "### Summary",
      "Some work is done, and the rest has shape.",
    ].join("\n"),
  );
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
