import assert from "node:assert/strict";
import test from "node:test";
import {
  buildTodayReviewText,
  reviewSummaryForDate,
} from "../today-review-text.ts";

test("selects a stable review summary from the date key", () => {
  assert.equal(
    reviewSummaryForDate("2026-07-18", ["first", "second"]),
    "first",
  );
  assert.equal(
    reviewSummaryForDate("2026-07-19", ["first", "second"]),
    "second",
  );
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
    summaryOptions: ["A steady day still counts."],
  });

  assert.equal(
    text,
    [
      "## Today Review",
      "",
      "A steady day still counts.",
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
    ].join("\n"),
  );
});
