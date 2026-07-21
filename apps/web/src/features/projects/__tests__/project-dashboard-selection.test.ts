import assert from "node:assert/strict";
import test from "node:test";
import { InMemoryProjectRepository } from "../server/project-repository.ts";
import { createProjectService } from "../server/project-service.ts";
import type {
  ProjectRecord,
  ProjectTaskRecord,
} from "../server/project-repository.ts";

const userId = "user-1";
const now = new Date("2026-07-14T10:00:00.000Z");

function project(input: Partial<ProjectRecord> & Pick<ProjectRecord, "id" | "title">) {
  return {
    id: input.id,
    userId,
    title: input.title,
    objective: input.objective ?? "Finish the target outcome.",
    startDate: input.startDate ?? "2026-07-01",
    deadlineDate: input.deadlineDate ?? null,
    expectedDurationDays: input.expectedDurationDays ?? null,
    sidebarPinOrder: input.sidebarPinOrder ?? null,
    createdAt: input.createdAt ?? now,
    updatedAt: input.updatedAt ?? now,
    completedAt: input.completedAt ?? null,
    deletedAt: input.deletedAt ?? null,
    tasks: input.tasks ?? [],
    milestones: input.milestones ?? [],
  } satisfies ProjectRecord;
}

function task(
  input: Partial<ProjectTaskRecord> & Pick<ProjectTaskRecord, "id" | "title">,
): ProjectTaskRecord {
  return {
    id: input.id,
    userId,
    projectId: input.projectId ?? "project-1",
    projectTitle: input.projectTitle ?? "Test project",
    milestoneId: input.milestoneId ?? null,
    milestoneTitle: input.milestoneTitle ?? "",
    title: input.title,
    description: input.description ?? "",
    status: input.status ?? "todo",
    startDate: input.startDate ?? "2026-07-14",
    deadlineDate: input.deadlineDate ?? null,
    sortOrder: input.sortOrder ?? 0,
    createdAt: input.createdAt ?? now,
    updatedAt: input.updatedAt ?? now,
    completedAt: input.completedAt ?? null,
    deletedAt: input.deletedAt ?? null,
  };
}

test("dashboard task selections stay stable after completion", async () => {
  const repository = new InMemoryProjectRepository({
    projects: [
      project({
        id: "project-1",
        title: "Test project",
        tasks: Array.from({ length: 8 }, (_, index) =>
          task({
            id: `task-${index + 1}`,
            title: `Task ${index + 1}`,
            deadlineDate: `2026-07-${String(index + 14).padStart(2, "0")}`,
            sortOrder: index,
          }),
        ),
      }),
    ],
  });
  const service = createProjectService({
    projects: repository,
    now: () => now,
  });

  const firstLoad = await service.listDashboardTasks(userId);

  assert.deepEqual(
    firstLoad.map((task) => task.id),
    ["task-1", "task-2", "task-3", "task-4", "task-5", "task-6"],
  );

  const updated = await service.updateTaskStatus(userId, "task-1", "done");
  const secondLoad = await service.listDashboardTasks(userId);

  assert.equal(updated, true);
  assert.deepEqual(
    secondLoad.map((task) => task.id),
    ["task-1", "task-2", "task-3", "task-4", "task-5", "task-6"],
  );
  assert.equal(secondLoad[0].status, "done");
  assert.equal(secondLoad.some((task) => task.id === "task-7"), false);
});

test("dashboard task selections refill after a selected task is deleted", async () => {
  const repository = new InMemoryProjectRepository({
    projects: [
      project({
        id: "project-1",
        title: "Test project",
        tasks: Array.from({ length: 7 }, (_, index) =>
          task({
            id: `task-${index + 1}`,
            title: `Task ${index + 1}`,
            deadlineDate: "2026-07-14",
            sortOrder: index,
          }),
        ),
      }),
    ],
  });
  const service = createProjectService({
    projects: repository,
    now: () => now,
  });

  const firstLoad = await service.listDashboardTasks(userId);
  const deleted = await service.archiveTask(userId, "task-1");
  const secondLoad = await service.listDashboardTasks(userId);

  assert.equal(deleted, true);
  assert.deepEqual(
    firstLoad.map((task) => task.id),
    ["task-1", "task-2", "task-3", "task-4", "task-5", "task-6"],
  );
  assert.deepEqual(
    secondLoad.map((task) => task.id),
    ["task-2", "task-3", "task-4", "task-5", "task-6", "task-7"],
  );
});

test("dashboard task selection uses the due window only before scheduling", async () => {
  const repository = new InMemoryProjectRepository({
    projects: [
      project({
        id: "project-1",
        title: "Test project",
        tasks: [
          task({
            id: "due-soon",
            title: "Due soon",
            deadlineDate: "2026-07-19",
          }),
          task({
            id: "due-later",
            title: "Due later",
            deadlineDate: "2026-07-20",
            sortOrder: 1,
          }),
          task({
            id: "no-deadline",
            title: "No deadline",
            deadlineDate: null,
            sortOrder: 2,
          }),
          task({
            id: "future-start",
            title: "Future start",
            startDate: "2026-07-15",
            deadlineDate: "2026-07-15",
            sortOrder: 3,
          }),
        ],
      }),
    ],
  });
  const service = createProjectService({
    projects: repository,
    now: () => now,
  });

  const firstLoad = await service.listDashboardTasks(userId);

  assert.deepEqual(firstLoad.map((task) => task.id), ["due-soon"]);

  const edited = await service.saveTask(userId, {
    taskId: "due-soon",
    projectId: "project-1",
    milestoneId: null,
    title: "Due soon",
    description: "",
    startDate: "2026-07-14",
    deadlineDate: "2026-12-31",
  });
  const secondLoad = await service.listDashboardTasks(userId);

  assert.equal(edited, true);
  assert.deepEqual(secondLoad.map((task) => task.id), ["due-soon"]);
});

test("dashboard task selection uses the user local day", async () => {
  const repository = new InMemoryProjectRepository({
    projects: [
      project({
        id: "project-1",
        title: "Test project",
        tasks: [
          task({
            id: "local-today",
            title: "Local today",
            startDate: "2026-07-22",
            deadlineDate: "2026-07-22",
          }),
        ],
      }),
    ],
  });
  const service = createProjectService({
    projects: repository,
    now: () => new Date("2026-07-21T23:30:00.000Z"),
  });

  const utcTasks = await service.listDashboardTasks(userId, "UTC");
  const sydneyTasks = await service.listDashboardTasks(
    userId,
    "Australia/Sydney",
  );

  assert.deepEqual(utcTasks.map((task) => task.id), []);
  assert.deepEqual(sydneyTasks.map((task) => task.id), ["local-today"]);
});
