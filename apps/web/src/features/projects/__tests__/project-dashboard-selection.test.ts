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
    estimatedDurationMinutes: input.estimatedDurationMinutes ?? null,
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

test("moving a selected task to tomorrow does not reselect it today", async () => {
  const repository = new InMemoryProjectRepository({
    projects: [
      project({
        id: "project-1",
        title: "Test project",
        tasks: [
          task({ id: "task-1", title: "First", deadlineDate: "2026-07-14" }),
          task({ id: "task-2", title: "Second", deadlineDate: "2026-07-15" }),
        ],
      }),
    ],
  });
  const service = createProjectService({ projects: repository, now: () => now });

  assert.deepEqual(
    (await service.listDashboardTasks(userId)).map((item) => item.id),
    ["task-1", "task-2"],
  );
  assert.equal(await service.moveDashboardTaskToTomorrow(userId, "task-1"), true);
  assert.deepEqual(
    (await service.listDashboardTasks(userId)).map((item) => item.id),
    ["task-2"],
  );
  const nextDay = createProjectService({
    projects: repository,
    now: () => new Date("2026-07-15T10:00:00.000Z"),
  });
  assert.deepEqual(
    (await nextDay.listDashboardTasks(userId)).map((item) => item.id),
    ["task-1", "task-2"],
  );
});

test("moving a task replaces only an untouched scheduler selection tomorrow", async () => {
  const projects = [
    project({
      id: "project-1",
      title: "Test project",
      tasks: [task({ id: "task-1", title: "First", deadlineDate: "2026-07-14" })],
    }),
  ];
  const selections = [
    {
      id: "today",
      userId,
      taskId: "task-1",
      scheduledDate: "2026-07-14",
      createdAt: now,
      movedAt: null,
      movedFromDate: null,
      source: "scheduler" as const,
    },
    {
      id: "tomorrow",
      userId,
      taskId: "task-1",
      scheduledDate: "2026-07-15",
      createdAt: now,
      movedAt: null,
      movedFromDate: null,
      source: "scheduler" as const,
    },
  ];
  const repository = new InMemoryProjectRepository({
    projects,
    dailySelections: selections,
  });
  const service = createProjectService({ projects: repository, now: () => now });

  assert.equal(await service.moveDashboardTaskToTomorrow(userId, "task-1"), true);
  assert.deepEqual(selections.map((selection) => selection.id), ["today"]);
  assert.equal(selections[0].scheduledDate, "2026-07-15");
  assert.equal(selections[0].movedFromDate, "2026-07-14");

  const protectedSelections = selections.map((selection) => ({ ...selection }));
  protectedSelections[0].scheduledDate = "2026-07-14";
  protectedSelections[0].movedAt = null;
  protectedSelections[0].movedFromDate = null;
  protectedSelections.push({
    ...selections[0],
    id: "manual-tomorrow",
    scheduledDate: "2026-07-15",
    source: "manual",
  });
  const protectedRepository = new InMemoryProjectRepository({
    projects,
    dailySelections: protectedSelections,
  });
  const protectedService = createProjectService({
    projects: protectedRepository,
    now: () => now,
  });
  assert.equal(
    await protectedService.moveDashboardTaskToTomorrow(userId, "task-1"),
    false,
  );
  assert.equal(protectedSelections[0].scheduledDate, "2026-07-14");
});

test("only a current-day unfinished selection can move", async () => {
  const repository = new InMemoryProjectRepository({
    projects: [
      project({
        id: "project-1",
        title: "Test project",
        tasks: [task({ id: "task-1", title: "First", deadlineDate: "2026-07-14" })],
      }),
    ],
  });
  const service = createProjectService({ projects: repository, now: () => now });

  assert.equal(await service.moveDashboardTaskToTomorrow(userId, "task-1"), false);
  await service.listDashboardTasks(userId);
  await service.updateTaskStatus(userId, "task-1", "done");
  assert.equal(await service.moveDashboardTaskToTomorrow(userId, "task-1"), false);
  await service.updateTaskStatus(userId, "task-1", "todo");
  assert.equal(await service.moveDashboardTaskToTomorrow(userId, "task-1"), true);
  assert.equal(await service.moveDashboardTaskToTomorrow(userId, "task-1"), false);
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
    estimatedDurationMinutes: null,
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

test("dashboard task selection keeps the previous local day before 04:00", async () => {
  const repository = new InMemoryProjectRepository({
    projects: [
      project({
        id: "project-1",
        title: "Test project",
        tasks: [
          task({
            id: "previous-scheduled-day",
            title: "Previous scheduled day",
            startDate: "2026-07-21",
            deadlineDate: "2026-07-21",
          }),
          task({
            id: "new-calendar-day",
            title: "New calendar day",
            startDate: "2026-07-22",
            deadlineDate: "2026-07-22",
            sortOrder: 1,
          }),
        ],
      }),
    ],
  });
  const service = createProjectService({
    projects: repository,
    now: () => new Date("2026-07-21T17:30:00.000Z"),
  });

  const tasks = await service.listDashboardTasks(userId, "Australia/Sydney");

  assert.deepEqual(tasks.map((task) => task.id), ["previous-scheduled-day"]);
});
