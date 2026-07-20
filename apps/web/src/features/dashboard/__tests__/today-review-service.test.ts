import assert from "node:assert/strict";
import test from "node:test";
import { buildTodayReviewText } from "../today-review-text.ts";

test("builds Today Review text from dashboard items", () => {
  const text = buildTodayReviewText({
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
  });

  assert.equal(
    text,
    [
      "Today Review",
      "",
      "Done tasks: Submit form.",
      "Open tasks: Write notes.",
      "Done routines: Evening cleanup.",
      "Open routines: none.",
      "Pinned memories: Quiet book.",
    ].join("\n"),
  );
});
