import assert from "node:assert/strict";
import test from "node:test";
import {
  addPendingSuggestionId,
  applyOptimisticPinnedMemoryStatus,
  applyOptimisticRoutineStatus,
  removeMemorySuggestion,
  removePendingSuggestionId,
  restoreTaskSnapshot,
} from "../optimistic-updates.ts";
import type { MemorySuggestion, PinnedMemory, Routine, Task } from "../types.ts";

const routines: Routine[] = [
  {
    id: "routine-instance-1",
    routineId: "routine-1",
    title: "Evening review",
    description: "Review the day",
    scheduledTime: "22:00",
    status: "pending",
    reminderState: "reminding",
    streakText: "Due today",
  },
  {
    id: "routine-instance-2",
    routineId: "routine-2",
    title: "Sleep prep",
    description: "Prepare to sleep",
    scheduledTime: "23:30",
    status: "pending",
    reminderState: "idle",
    streakText: "Due today",
  },
];

const pinnedMemories: PinnedMemory[] = [
  {
    id: "pin-1",
    memoryId: "memory-1",
    category: "Cuisine",
    title: "Ramen",
    description: "Small ramen place",
    meta: "Visible until Jul 19",
    position: 1,
    status: "active",
  },
  {
    id: "pin-2",
    memoryId: "memory-2",
    category: "Sightseeing",
    title: "Harbor walk",
    description: "Quiet route",
    meta: "Visible until Jul 20",
    position: 2,
    status: "active",
  },
];

const memorySuggestions: MemorySuggestion[] = [
  {
    id: "memory-1",
    category: "Cuisine",
    title: "Ramen",
    description: "Small ramen place",
    lastDoneText: "Done last week",
    doneCount: 3,
  },
  {
    id: "memory-2",
    category: "Sightseeing",
    title: "Harbor walk",
    description: "Quiet route",
    lastDoneText: "Done last month",
    doneCount: 1,
  },
];

const projectTasks: Task[] = [
  {
    id: "task-1",
    title: "Prepare resume",
    description: "",
    projectLabel: "Find a job",
    milestoneLabel: "Applications",
    deadline: "Jul 20",
    priority: "high",
    status: "todo",
    scheduledDate: "2026-07-14",
    startDate: "2026-07-14",
    deadlineDate: "2026-07-20",
  },
  {
    id: "task-2",
    title: "Draft email",
    description: "",
    projectLabel: "Find a job",
    milestoneLabel: "Applications",
    deadline: "Jul 22",
    priority: "medium",
    status: "todo",
    scheduledDate: "2026-07-15",
    startDate: "2026-07-15",
    deadlineDate: "2026-07-22",
  },
];

test("optimistically marks a routine instance as completed", () => {
  const updated = applyOptimisticRoutineStatus(
    routines,
    "routine-instance-1",
    "completed",
  );

  assert.equal(updated[0].status, "completed");
  assert.equal(updated[0].reminderState, "idle");
  assert.equal(updated[0].streakText, "Answered today");
  assert.equal(updated[1], routines[1]);
});

test("optimistically marks a pinned memory as completed", () => {
  const updated = applyOptimisticPinnedMemoryStatus(
    pinnedMemories,
    "pin-1",
    "completed",
  );

  assert.equal(updated[0].status, "completed");
  assert.equal(updated[0].meta, "Completed; cleanup is pending");
  assert.equal(updated[1], pinnedMemories[1]);
});

test("restores one failed project task without rolling back other tasks", () => {
  const updated = projectTasks.map((task) =>
    task.id === "task-1" ? { ...task, status: "done" as const } : task,
  );
  const unrelatedChange = updated.map((task) =>
    task.id === "task-2" ? { ...task, status: "blocked" as const } : task,
  );
  const restored = restoreTaskSnapshot(unrelatedChange, projectTasks, "task-1");

  assert.equal(restored[0].status, "todo");
  assert.equal(restored[1].status, "blocked");
});

test("restores a failed project task that was optimistically removed", () => {
  const current = projectTasks.filter((task) => task.id !== "task-1");
  const restored = restoreTaskSnapshot(current, projectTasks, "task-1");

  assert.equal(restored[0].id, "task-1");
  assert.equal(restored[1].id, "task-2");
});

test("optimistically restores a completed pinned memory", () => {
  const completed = applyOptimisticPinnedMemoryStatus(
    pinnedMemories,
    "pin-1",
    "completed",
  );
  const restored = applyOptimisticPinnedMemoryStatus(
    completed,
    "pin-1",
    "active",
  );

  assert.equal(restored[0].status, "active");
  assert.equal(restored[0].meta, "Visible window restored");
});

test("tracks pending memory suggestion pins independently", () => {
  const firstPending = addPendingSuggestionId([], "memory-1");
  const repeatedPending = addPendingSuggestionId(firstPending, "memory-1");
  const concurrentPending = addPendingSuggestionId(repeatedPending, "memory-2");

  assert.deepEqual(repeatedPending, ["memory-1"]);
  assert.deepEqual(concurrentPending, ["memory-1", "memory-2"]);
  assert.deepEqual(removePendingSuggestionId(concurrentPending, "memory-1"), [
    "memory-2",
  ]);
});

test("removes only the successfully pinned memory suggestion", () => {
  const updated = removeMemorySuggestion(memorySuggestions, "memory-1");

  assert.deepEqual(updated, [memorySuggestions[1]]);
});
