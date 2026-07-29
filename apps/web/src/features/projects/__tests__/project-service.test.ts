import assert from "node:assert/strict";
import test from "node:test";
import { InMemoryProjectRepository } from "../server/project-repository.ts";
import { createProjectService } from "../server/project-service.ts";
import type { ProjectRecord } from "../server/project-repository.ts";

const userId = "user-1";
const now = new Date("2026-07-14T10:00:00.000Z");

function project(input: Partial<ProjectRecord> & Pick<ProjectRecord, "id" | "title">) {
  const milestones = input.milestones ?? [];

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
    tasks: input.tasks ?? milestones.flatMap((milestone) => milestone.tasks),
    milestones,
  } satisfies ProjectRecord;
}

test("saving a project does not create a default milestone", async () => {
  const repository = new InMemoryProjectRepository();
  const service = createProjectService({
    projects: repository,
    now: () => now,
  });

  const projectId = await service.saveProject(userId, {
    title: "Apply for a degree",
    objective: "Submit a strong master application.",
    startDate: "2026-07-14",
    deadlineDate: "2026-09-01",
    expectedDurationDays: null,
  });
  const projects = await service.listProjects(userId);

  assert.ok(projectId);
  assert.equal(projects.length, 1);
  assert.equal(projects[0].tasks.length, 0);
  assert.equal(projects[0].milestones.length, 0);
});

test("importing a project tree creates milestones and linked tasks", async () => {
  const repository = new InMemoryProjectRepository();
  const service = createProjectService({
    projects: repository,
    now: () => now,
  });

  const projectId = await service.importProjectTree(userId, {
    project: {
      title: "Find a job",
      objective: "Land a backend engineering role.",
      startDate: "2026-07-22",
      deadlineDate: null,
      expectedDurationDays: 180,
    },
    milestones: [
      {
        title: "Applications",
        objective: "Submit strong applications.",
        startDate: "2026-07-22",
        deadlineDate: null,
        expectedDurationDays: 90,
        tasks: [
          {
            title: "Prepare resume",
            description: "Rewrite backend experience bullets.",
            startDate: "2026-07-22",
            deadlineDate: "2026-07-30",
            estimatedDurationMinutes: null,
          },
        ],
      },
    ],
  });
  const projects = await service.listProjects(userId);

  assert.ok(projectId);
  assert.equal(projects.length, 1);
  assert.equal(projects[0].milestones.length, 1);
  assert.equal(projects[0].tasks.length, 1);
  assert.equal(projects[0].milestones[0].tasks.length, 1);
  assert.equal(projects[0].tasks[0].milestoneId, projects[0].milestones[0].id);
});

test("saving a task can omit a milestone", async () => {
  const repository = new InMemoryProjectRepository();
  const service = createProjectService({
    projects: repository,
    now: () => now,
  });
  const projectId = await service.saveProject(userId, {
    title: "Find a job",
    objective: "Land a backend engineering role.",
    startDate: "2026-07-14",
    deadlineDate: null,
    expectedDurationDays: 90,
  });

  const saved = await service.saveTask(userId, {
    projectId: projectId ?? "",
    milestoneId: null,
    title: "Prepare resume",
    description: "Rewrite backend experience bullets.",
    startDate: "2026-07-14",
    deadlineDate: "2026-07-16",
    estimatedDurationMinutes: null,
  });
  const projects = await service.listProjects(userId);

  assert.equal(saved, true);
  assert.equal(projects[0].tasks.length, 1);
  assert.equal(projects[0].tasks[0].milestoneId, null);
  assert.equal(projects[0].tasks[0].milestoneTitle, "");
});

test("saving a task can place it under an explicit milestone", async () => {
  const repository = new InMemoryProjectRepository();
  const service = createProjectService({
    projects: repository,
    now: () => now,
  });
  const projectId = await service.saveProject(userId, {
    title: "Find a job",
    objective: "Land a backend engineering role.",
    startDate: "2026-07-14",
    deadlineDate: null,
    expectedDurationDays: 90,
  });
  const milestoneId = await service.saveMilestone(userId, {
    projectId: projectId ?? "",
    title: "Applications",
    objective: "",
    startDate: "2026-07-14",
    deadlineDate: null,
    expectedDurationDays: null,
  });

  const saved = await service.saveTask(userId, {
    projectId: projectId ?? "",
    milestoneId,
    title: "Prepare resume",
    description: "Rewrite backend experience bullets.",
    startDate: "2026-07-14",
    deadlineDate: "2026-07-16",
    estimatedDurationMinutes: null,
  });
  const projects = await service.listProjects(userId);

  assert.equal(saved, true);
  assert.equal(projects[0].tasks.length, 1);
  assert.equal(projects[0].milestones[0].tasks.length, 1);
  assert.equal(projects[0].milestones[0].tasks[0].title, "Prepare resume");
});

test("archiving a milestone keeps its tasks without a milestone", async () => {
  const repository = new InMemoryProjectRepository();
  const service = createProjectService({
    projects: repository,
    now: () => now,
  });
  const projectId = await service.saveProject(userId, {
    title: "Find a job",
    objective: "Land a backend engineering role.",
    startDate: "2026-07-14",
    deadlineDate: null,
    expectedDurationDays: 90,
  });
  const milestoneId = await service.saveMilestone(userId, {
    projectId: projectId ?? "",
    title: "Applications",
    objective: "",
    startDate: "2026-07-14",
    deadlineDate: null,
    expectedDurationDays: null,
  });
  await service.saveTask(userId, {
    projectId: projectId ?? "",
    milestoneId,
    title: "Prepare resume",
    description: "Rewrite backend experience bullets.",
    startDate: "2026-07-14",
    deadlineDate: "2026-07-16",
    estimatedDurationMinutes: null,
  });

  const archived = await service.archiveMilestone(userId, milestoneId ?? "");
  const projects = await service.listProjects(userId);

  assert.equal(archived, true);
  assert.equal(projects[0].milestones.length, 0);
  assert.equal(projects[0].tasks.length, 1);
  assert.equal(projects[0].tasks[0].milestoneId, null);
  assert.equal(projects[0].tasks[0].milestoneTitle, "");
});

test("archiving a task removes it from normal project views", async () => {
  const repository = new InMemoryProjectRepository();
  const service = createProjectService({
    projects: repository,
    now: () => now,
  });
  const projectId = await service.saveProject(userId, {
    title: "Find a job",
    objective: "Land a backend engineering role.",
    startDate: "2026-07-14",
    deadlineDate: null,
    expectedDurationDays: 90,
  });
  await service.saveTask(userId, {
    projectId: projectId ?? "",
    milestoneId: null,
    title: "Prepare resume",
    description: "Rewrite backend experience bullets.",
    startDate: "2026-07-14",
    deadlineDate: "2026-07-16",
    estimatedDurationMinutes: null,
  });
  const taskId = (await service.listProjects(userId))[0].tasks[0].id;

  const archived = await service.archiveTask(userId, taskId);
  const projects = await service.listProjects(userId);

  assert.equal(archived, true);
  assert.equal(projects[0].tasks.length, 0);
});

test("dashboard tasks sort by deadline then start date", async () => {
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
            sortOrder: 0,
            startDate: "2026-07-14",
            deadlineDate: null,
            expectedDurationDays: null,
            createdAt: now,
            updatedAt: now,
            completedAt: null,
            deletedAt: null,
            tasks: [
              {
                id: "later-deadline",
                userId,
                projectId: "project-1",
                projectTitle: "Find a job",
                milestoneId: "milestone-1",
                milestoneTitle: "Applications",
                title: "Later deadline task",
                description: "",
                status: "todo",
                startDate: "2026-07-14",
                deadlineDate: "2026-07-19",
                sortOrder: 0,
                createdAt: now,
                updatedAt: now,
                completedAt: null,
                deletedAt: null,
              },
              {
                id: "older-start",
                userId,
                projectId: "project-1",
                projectTitle: "Find a job",
                milestoneId: "milestone-1",
                milestoneTitle: "Applications",
                title: "Older start task",
                description: "",
                status: "todo",
                startDate: "2026-07-10",
                deadlineDate: "2026-07-18",
                sortOrder: 1,
                createdAt: now,
                updatedAt: now,
                completedAt: null,
                deletedAt: null,
              },
              {
                id: "near-deadline",
                userId,
                projectId: "project-1",
                projectTitle: "Find a job",
                milestoneId: "milestone-1",
                milestoneTitle: "Applications",
                title: "Near deadline task",
                description: "",
                status: "todo",
                startDate: "2026-07-14",
                deadlineDate: "2026-07-18",
                sortOrder: 2,
                createdAt: now,
                updatedAt: now,
                completedAt: null,
                deletedAt: null,
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

  assert.equal(tasks[0].id, "older-start");
  assert.equal(tasks[1].id, "near-deadline");
  assert.equal(tasks[2].id, "later-deadline");
  assert.equal(tasks[0].projectTitle, "Find a job");
  assert.equal(tasks[0].milestoneTitle, "Applications");
});
