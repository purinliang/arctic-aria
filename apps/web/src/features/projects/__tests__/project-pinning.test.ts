import assert from "node:assert/strict";
import test from "node:test";
import { InMemoryProjectRepository } from "../server/project-repository.ts";
import { createProjectService } from "../server/project-service.ts";

const userId = "user-1";
const now = new Date("2026-07-14T10:00:00.000Z");

test("pins up to three active projects in sidebar slots", async () => {
  const service = createProjectService({
    projects: new InMemoryProjectRepository(),
    now: () => now,
  });
  const [firstId, secondId, thirdId, fourthId] = await Promise.all([
    createProject(service, "First project"),
    createProject(service, "Second project"),
    createProject(service, "Third project"),
    createProject(service, "Fourth project"),
  ]);

  assert.equal(await service.pinProject(userId, firstId), "pinned");
  assert.equal(await service.pinProject(userId, secondId), "pinned");
  assert.equal(await service.pinProject(userId, thirdId), "pinned");
  assert.equal(await service.pinProject(userId, fourthId), "limit_reached");

  const projects = byId(await service.listProjects(userId));
  assert.equal(projects.get(firstId)?.sidebarPinOrder, 1);
  assert.equal(projects.get(secondId)?.sidebarPinOrder, 2);
  assert.equal(projects.get(thirdId)?.sidebarPinOrder, 3);
  assert.equal(projects.get(fourthId)?.sidebarPinOrder, null);
});

test("unpinning a project frees its sidebar slot", async () => {
  const service = createProjectService({
    projects: new InMemoryProjectRepository(),
    now: () => now,
  });
  const [firstId, secondId, thirdId, fourthId] = await Promise.all([
    createProject(service, "First project"),
    createProject(service, "Second project"),
    createProject(service, "Third project"),
    createProject(service, "Fourth project"),
  ]);
  await service.pinProject(userId, firstId);
  await service.pinProject(userId, secondId);
  await service.pinProject(userId, thirdId);

  assert.equal(await service.unpinProject(userId, secondId), true);
  assert.equal(await service.pinProject(userId, fourthId), "pinned");

  const projects = byId(await service.listProjects(userId));
  assert.equal(projects.get(firstId)?.sidebarPinOrder, 1);
  assert.equal(projects.get(secondId)?.sidebarPinOrder, null);
  assert.equal(projects.get(thirdId)?.sidebarPinOrder, 3);
  assert.equal(projects.get(fourthId)?.sidebarPinOrder, 2);
});

test("archiving a project clears and frees its sidebar slot", async () => {
  const service = createProjectService({
    projects: new InMemoryProjectRepository(),
    now: () => now,
  });
  const [firstId, secondId, thirdId, fourthId] = await Promise.all([
    createProject(service, "First project"),
    createProject(service, "Second project"),
    createProject(service, "Third project"),
    createProject(service, "Fourth project"),
  ]);
  await service.pinProject(userId, firstId);
  await service.pinProject(userId, secondId);
  await service.pinProject(userId, thirdId);

  assert.equal(await service.archiveProject(userId, firstId), true);
  assert.equal(await service.pinProject(userId, fourthId), "pinned");

  const projects = byId(await service.listProjects(userId));
  assert.equal(projects.has(firstId), false);
  assert.equal(projects.get(secondId)?.sidebarPinOrder, 2);
  assert.equal(projects.get(thirdId)?.sidebarPinOrder, 3);
  assert.equal(projects.get(fourthId)?.sidebarPinOrder, 1);
});

async function createProject(
  service: ReturnType<typeof createProjectService>,
  title: string,
) {
  const projectId = await service.saveProject(userId, {
    title,
    objective: `${title} objective.`,
    priority: "medium",
    startDate: "2026-07-14",
    deadlineDate: null,
    expectedDurationDays: 90,
  });

  assert.ok(projectId);
  return projectId;
}

function byId<T extends { id: string }>(items: T[]) {
  return new Map(items.map((item) => [item.id, item]));
}
