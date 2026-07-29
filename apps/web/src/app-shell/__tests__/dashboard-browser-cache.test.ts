import assert from "node:assert/strict";
import test from "node:test";
import {
  clearDashboardBrowserCacheSection,
  dashboardBrowserCacheKey,
  readDashboardBrowserCacheSection,
  writeDashboardBrowserCacheSection,
} from "../dashboard-browser-cache.ts";
import type { EventDashboardData } from "../../features/events/actions.ts";
import type { ProjectDashboardData } from "../../features/projects/actions.ts";

class MemoryStorage {
  private readonly items = new Map<string, string>();

  getItem(key: string) {
    return this.items.get(key) ?? null;
  }

  removeItem(key: string) {
    this.items.delete(key);
  }

  setItem(key: string, value: string) {
    this.items.set(key, value);
  }
}

const projectData: ProjectDashboardData = {
  tasks: [
    {
      id: "task-one",
      projectId: "project-one",
      milestoneId: "",
      title: "Test task",
      description: "Test task description",
      projectLabel: "Test project",
      milestoneLabel: "",
      deadline: "No deadline",
      status: "todo",
      startDate: "2026-07-18",
      deadlineDate: "",
    },
  ],
  projects: [
    {
      id: "project-one",
      title: "Test project",
      description: "Test project description",
      startDate: "2026-07-18",
      deadlineDate: "",
      expectedDurationDays: "",
      durationRange: "3_6_months",
      sidebarPinOrder: 1,
      timelineText: "Open-ended",
      currentMilestone: "No milestone",
      progressText: "0 of 1 tasks done",
      tasks: [],
      milestones: [],
    },
  ],
};

const eventData: EventDashboardData = {
  events: [
    {
      id: "event-one",
      title: "Test event",
      description: "Test event description",
      eventDate: "2026-07-18",
      eventTime: "09:30",
      estimatedDurationHours: 1.5,
      location: "Office",
      createdAt: "2026-07-01T00:00:00.000Z",
      updatedAt: "2026-07-01T00:00:00.000Z",
    },
  ],
  todayEvents: [],
};

test("dashboard browser cache is keyed by user and section", () => {
  const storage = new MemoryStorage();

  writeDashboardBrowserCacheSection(
    "user-one",
    "projects",
    projectData,
    storage,
  );

  assert.deepEqual(
    readDashboardBrowserCacheSection("user-one", "projects", storage),
    projectData,
  );
  assert.equal(
    readDashboardBrowserCacheSection("user-one", "routines", storage),
    null,
  );
  assert.equal(
    readDashboardBrowserCacheSection("user-two", "projects", storage),
    null,
  );
});

test("dashboard browser cache stores events independently", () => {
  const storage = new MemoryStorage();

  writeDashboardBrowserCacheSection("user-one", "events", eventData, storage);

  assert.deepEqual(
    readDashboardBrowserCacheSection("user-one", "events", storage),
    eventData,
  );
  assert.equal(
    readDashboardBrowserCacheSection("user-one", "projects", storage),
    null,
  );
});

test("dashboard browser cache removes malformed section data", () => {
  const storage = new MemoryStorage();
  const key = dashboardBrowserCacheKey("user-one", "projects");

  storage.setItem(
    key,
    JSON.stringify({
      schemaVersion: 1,
      userId: "user-one",
      section: "projects",
      data: {
        tasks: [],
      },
    }),
  );

  assert.equal(
    readDashboardBrowserCacheSection("user-one", "projects", storage),
    null,
  );
  assert.equal(storage.getItem(key), null);
});

test("dashboard browser cache ignores blocked storage writes and clears", () => {
  const storage = {
    getItem() {
      throw new Error("blocked");
    },
    removeItem() {
      throw new Error("blocked");
    },
    setItem() {
      throw new Error("blocked");
    },
  };

  assert.equal(
    readDashboardBrowserCacheSection("user-one", "projects", storage),
    null,
  );
  assert.doesNotThrow(() =>
    writeDashboardBrowserCacheSection(
      "user-one",
      "projects",
      projectData,
      storage,
    ),
  );
  assert.doesNotThrow(() =>
    clearDashboardBrowserCacheSection("user-one", "projects", storage),
  );
});

test("dashboard browser cache returns serialized snapshots", () => {
  const storage = new MemoryStorage();

  writeDashboardBrowserCacheSection(
    "user-one",
    "projects",
    projectData,
    storage,
  );

  const snapshot = readDashboardBrowserCacheSection(
    "user-one",
    "projects",
    storage,
  );

  assert.ok(snapshot);

  snapshot.tasks[0].title = "Changed title";

  assert.equal(
    readDashboardBrowserCacheSection("user-one", "projects", storage)?.tasks[0]
      .title,
    "Test task",
  );
});

test("dashboard browser cache can clear one cached section", () => {
  const storage = new MemoryStorage();

  writeDashboardBrowserCacheSection(
    "user-one",
    "projects",
    projectData,
    storage,
  );
  clearDashboardBrowserCacheSection("user-one", "projects", storage);

  assert.equal(
    readDashboardBrowserCacheSection("user-one", "projects", storage),
    null,
  );
});
