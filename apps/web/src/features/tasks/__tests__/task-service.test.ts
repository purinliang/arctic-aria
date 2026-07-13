import assert from "node:assert/strict";
import test from "node:test";
import {
  InMemoryTaskRepository,
  type TaskRecord,
} from "../server/task-repository.ts";
import { createTaskService } from "../server/task-service.ts";

const userId = "user-1";
const now = new Date("2026-07-14T10:00:00.000Z");

function task(input: Partial<TaskRecord> & Pick<TaskRecord, "id" | "title">): TaskRecord {
  return {
    id: input.id,
    userId,
    planId: input.planId ?? null,
    planTitle: input.planTitle ?? null,
    parentTaskId: input.parentTaskId ?? null,
    title: input.title,
    description: input.description ?? "",
    status: input.status ?? "todo",
    priority: input.priority ?? "medium",
    weight: input.weight ?? 1,
    completedWeight: input.completedWeight ?? 0,
    deadlineAt: input.deadlineAt ?? null,
    scheduledDate: input.scheduledDate ?? null,
    sortOrder: input.sortOrder ?? 0,
    completedAt: input.completedAt ?? null,
    skippedAt: input.skippedAt ?? null,
    blockedAt: input.blockedAt ?? null,
    archivedAt: input.archivedAt ?? null,
    createdAt: input.createdAt ?? now,
    updatedAt: input.updatedAt ?? now,
    children: input.children ?? [],
  };
}

test("dashboard tasks prefer tasks scheduled for today", async () => {
  const repository = new InMemoryTaskRepository({
    tasks: [
      task({
        id: "later",
        title: "Later task",
        priority: "high",
        scheduledDate: "2026-07-16",
      }),
      task({
        id: "today",
        title: "Today task",
        priority: "low",
        scheduledDate: "2026-07-14",
      }),
    ],
  });
  const service = createTaskService({
    tasks: repository,
    now: () => now,
  });

  const tasks = await service.listDashboardTasks(userId);

  assert.equal(tasks[0].id, "today");
});

test("saving a task can create child tasks", async () => {
  const repository = new InMemoryTaskRepository();
  const service = createTaskService({
    tasks: repository,
    now: () => now,
  });

  const saved = await service.saveTask(userId, {
    title: "Write report",
    description: "Draft the report.",
    planTitle: "Research",
    priority: "high",
    status: "todo",
    weight: 2,
    completedWeight: 0,
    deadlineAt: new Date("2026-07-20T10:00:00.000Z"),
    scheduledDate: "2026-07-14",
    children: [
      {
        title: "Outline",
        description: "",
        weight: 1,
        completedWeight: 0,
        status: "todo",
      },
    ],
  });
  const tasks = await service.listTasks(userId);

  assert.equal(saved, true);
  assert.equal(tasks.length, 1);
  assert.equal(tasks[0].children.length, 1);
  assert.equal(tasks[0].children[0].title, "Outline");
});

test("completing a child updates parent progress", async () => {
  const repository = new InMemoryTaskRepository({
    tasks: [
      task({
        id: "parent",
        title: "Parent",
        weight: 2,
      }),
      task({
        id: "child-1",
        title: "Child 1",
        parentTaskId: "parent",
        weight: 1,
      }),
      task({
        id: "child-2",
        title: "Child 2",
        parentTaskId: "parent",
        weight: 1,
      }),
    ],
  });
  const service = createTaskService({
    tasks: repository,
    now: () => now,
  });

  await service.updateTaskStatus(userId, "child-1", "done");
  const tasks = await service.listTasks(userId);

  assert.equal(tasks[0].completedWeight, 1);
  assert.equal(tasks[0].status, "doing");
});
