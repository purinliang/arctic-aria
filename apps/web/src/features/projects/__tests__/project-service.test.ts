import assert from "node:assert/strict";
import test from "node:test";
import { InMemoryProjectRepository } from "../server/project-repository.ts";
import { createProjectService } from "../server/project-service.ts";
import type { ProjectRecord } from "../server/project-repository.ts";

const userId = "user-1";
const now = new Date("2026-07-14T10:00:00.000Z");

function project(input: Partial<ProjectRecord> & Pick<ProjectRecord, "id" | "title">) {
  return {
    id: input.id,
    userId,
    title: input.title,
    objective: input.objective ?? "Finish the target outcome.",
    importanceReason: input.importanceReason ?? "It matters.",
    status: input.status ?? "active",
    priority: input.priority ?? "medium",
    startDate: input.startDate ?? "2026-07-01",
    deadlineDate: input.deadlineDate ?? null,
    expectedDurationDays: input.expectedDurationDays ?? null,
    createdAt: input.createdAt ?? now,
    updatedAt: input.updatedAt ?? now,
    completedAt: input.completedAt ?? null,
    archivedAt: input.archivedAt ?? null,
    milestones: input.milestones ?? [],
  } satisfies ProjectRecord;
}

test("saving a project creates the default milestone", async () => {
  const repository = new InMemoryProjectRepository();
  const service = createProjectService({
    projects: repository,
    now: () => now,
  });

  const projectId = await service.saveProject(userId, {
    title: "Apply for a degree",
    objective: "Submit a strong master application.",
    importanceReason: "It opens better research options.",
    priority: "high",
    startDate: "2026-07-14",
    deadlineDate: "2026-09-01",
    expectedDurationDays: null,
  });
  const projects = await service.listProjects(userId);

  assert.ok(projectId);
  assert.equal(projects.length, 1);
  assert.equal(projects[0].milestones.length, 1);
  assert.equal(projects[0].milestones[0].title, "Project completion");
});

test("saving a task places it under a project milestone", async () => {
  const repository = new InMemoryProjectRepository();
  const service = createProjectService({
    projects: repository,
    now: () => now,
  });
  const projectId = await service.saveProject(userId, {
    title: "Find a job",
    objective: "Land a backend engineering role.",
    importanceReason: "It supports the next life stage.",
    priority: "high",
    startDate: "2026-07-14",
    deadlineDate: null,
    expectedDurationDays: 90,
  });
  const milestoneId = (await service.listProjects(userId))[0].milestones[0].id;

  const saved = await service.saveTask(userId, {
    projectId: projectId ?? "",
    milestoneId,
    title: "Prepare resume",
    description: "Rewrite backend experience bullets.",
    priority: "high",
    status: "todo",
    scheduledDate: "2026-07-14",
    startDate: "2026-07-14",
    deadlineDate: "2026-07-16",
    subtasks: [
      {
        title: "Collect projects",
        description: "",
        isDone: false,
      },
    ],
  });
  const projects = await service.listProjects(userId);

  assert.equal(saved, true);
  assert.equal(projects[0].milestones[0].tasks.length, 1);
  assert.equal(projects[0].milestones[0].tasks[0].subtasks.length, 1);
});

test("dashboard tasks prefer tasks scheduled for today", async () => {
  const repository = new InMemoryProjectRepository({
    projects: [
      project({
        id: "project-1",
        title: "Find a job",
        milestones: [
          {
            id: "milestone-1",
            userId,
            projectId: "project-1",
            title: "Applications",
            objective: "",
            status: "active",
            sortOrder: 0,
            startDate: null,
            deadlineDate: null,
            expectedDurationDays: null,
            createdAt: now,
            updatedAt: now,
            completedAt: null,
            archivedAt: null,
            tasks: [
              {
                id: "later",
                userId,
                projectId: "project-1",
                projectTitle: "Find a job",
                milestoneId: "milestone-1",
                milestoneTitle: "Applications",
                title: "Later task",
                description: "",
                status: "todo",
                priority: "high",
                scheduledDate: "2026-07-16",
                startDate: null,
                deadlineDate: null,
                sortOrder: 0,
                createdAt: now,
                updatedAt: now,
                completedAt: null,
                skippedAt: null,
                blockedAt: null,
                archivedAt: null,
                subtasks: [],
              },
              {
                id: "today",
                userId,
                projectId: "project-1",
                projectTitle: "Find a job",
                milestoneId: "milestone-1",
                milestoneTitle: "Applications",
                title: "Today task",
                description: "",
                status: "todo",
                priority: "low",
                scheduledDate: "2026-07-14",
                startDate: null,
                deadlineDate: null,
                sortOrder: 1,
                createdAt: now,
                updatedAt: now,
                completedAt: null,
                skippedAt: null,
                blockedAt: null,
                archivedAt: null,
                subtasks: [],
              },
            ],
          },
        ],
      }),
    ],
  });
  const service = createProjectService({
    projects: repository,
    now: () => now,
  });

  const tasks = await service.listDashboardTasks(userId);

  assert.equal(tasks[0].id, "today");
  assert.equal(tasks[0].projectTitle, "Find a job");
  assert.equal(tasks[0].milestoneTitle, "Applications");
});

test("subtask check updates checklist state without scheduling the subtask", async () => {
  const repository = new InMemoryProjectRepository();
  const service = createProjectService({
    projects: repository,
    now: () => now,
  });
  const projectId = await service.saveProject(userId, {
    title: "Apply for visa",
    objective: "Submit all documents.",
    importanceReason: "",
    priority: "medium",
    startDate: "2026-07-14",
    deadlineDate: null,
    expectedDurationDays: 30,
  });
  const milestoneId = (await service.listProjects(userId))[0].milestones[0].id;

  await service.saveTask(userId, {
    projectId: projectId ?? "",
    milestoneId,
    title: "Prepare documents",
    description: "",
    priority: "medium",
    status: "todo",
    scheduledDate: "2026-07-14",
    startDate: null,
    deadlineDate: null,
    subtasks: [{ title: "Scan passport", description: "", isDone: false }],
  });

  const subtaskId =
    (await service.listProjects(userId))[0].milestones[0].tasks[0].subtasks[0].id;
  const updated = await service.updateSubtaskDone(userId, subtaskId, true);
  const projects = await service.listProjects(userId);

  assert.equal(updated, true);
  assert.equal(projects[0].milestones[0].tasks[0].subtasks[0].isDone, true);
  assert.equal((await service.listDashboardTasks(userId)).length, 1);
});
