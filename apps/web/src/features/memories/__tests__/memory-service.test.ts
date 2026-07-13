import assert from "node:assert/strict";
import test from "node:test";
import {
  createMemoryService,
  memoryTiming,
} from "../server/memory-service.ts";
import { InMemoryMemoryRepository } from "../server/memory-repository.ts";
import {
  memory,
  memoryCategories,
  now,
  pinnedMemory,
  userId,
} from "./memory-test-fixtures.ts";

test("initializes default memory categories for a user", async () => {
  const repository = new InMemoryMemoryRepository();
  const service = createMemoryService({
    memories: repository,
    now: () => now,
  });

  const categories = await service.initializeUserMemoryDefaults(userId);

  assert.deepEqual(
    categories.map((category) => [category.name, category.baseWeight]),
    [
      ["Cuisine", 1.2],
      ["Sightseeing", 0.8],
    ],
  );

  const secondCall = await service.initializeUserMemoryDefaults(userId);

  assert.equal(secondCall.length, 2);
});

test("creates memory in a newly created custom category", async () => {
  const repository = new InMemoryMemoryRepository();
  const service = createMemoryService({
    memories: repository,
    now: () => now,
  });

  const category = await service.createCategory(userId, "Custom", 1.2);
  const createdMemory = await service.createMemory(
    userId,
    category.id,
    "Custom memory",
    "Created under a custom category",
  );

  assert.ok(createdMemory);
  assert.equal(createdMemory.categoryId, category.id);
  assert.equal(createdMemory.categoryName, "Custom");
  assert.equal(createdMemory.title, "Custom memory");
});

test("complete pinned memory records completion and cleanup timing", async () => {
  const repository = new InMemoryMemoryRepository({
    memories: [
      memory({
        id: "memory-1",
        categoryId: "category-cuisine",
        title: "Ramen",
      }),
    ],
    pinnedMemories: [
      pinnedMemory({
        id: "pin-1",
        memoryId: "memory-1",
        categoryId: "category-cuisine",
        title: "Ramen",
      }),
    ],
  });
  const service = createMemoryService({
    memories: repository,
    now: () => now,
  });

  const result = await service.completePinnedMemory(userId, "pin-1");

  assert.ok(result);
  assert.equal(result.status, "completed");
  assert.deepEqual(result.completedAt, now);
  assert.equal(
    result.completedCleanupAt?.getTime(),
    now.getTime() + memoryTiming.completedCleanupDelayMs,
  );
  assert.equal(result.doneCount, 1);
  assert.equal(repository.getEvents()[0]?.eventType, "completed");
});

test("cancel pinned memory done clears completion state", async () => {
  const repository = new InMemoryMemoryRepository({
    memories: [
      memory({
        id: "memory-1",
        categoryId: "category-cuisine",
        title: "Ramen",
        lastDoneAt: now,
        doneCount: 1,
      }),
    ],
    pinnedMemories: [
      pinnedMemory({
        id: "pin-1",
        memoryId: "memory-1",
        categoryId: "category-cuisine",
        title: "Ramen",
        completedAt: now,
        completedCleanupAt: new Date(
          now.getTime() + memoryTiming.completedCleanupDelayMs,
        ),
        lastDoneAt: now,
        doneCount: 1,
      }),
    ],
  });
  const service = createMemoryService({
    memories: repository,
    now: () => new Date("2026-06-30T10:15:00.000Z"),
  });

  const result = await service.cancelPinnedMemoryDone(userId, "pin-1");

  assert.ok(result);
  assert.equal(result.status, "active");
  assert.equal(result.completedAt, null);
  assert.equal(result.completedCleanupAt, null);
  assert.equal(result.doneCount, 0);
  assert.equal(repository.getEvents()[0]?.eventType, "completed_canceled");
});

test("dashboard pinned memories only include supported default categories", async () => {
  const repository = new InMemoryMemoryRepository({
    categories: [
      ...memoryCategories,
      {
        id: "category-custom",
        userId,
        name: "Anime",
        baseWeight: 1,
        createdAt: new Date("2026-06-01T00:00:00.000Z"),
        updatedAt: new Date("2026-06-01T00:00:00.000Z"),
      },
    ],
    memories: [
      memory({
        id: "memory-1",
        categoryId: "category-cuisine",
        title: "Ramen",
      }),
      memory({
        id: "memory-2",
        categoryId: "category-sightseeing",
        title: "Harbour walk",
      }),
      memory({
        id: "memory-3",
        categoryId: "category-custom",
        categoryName: "Anime",
        title: "Anime night",
      }),
    ],
    pinnedMemories: [
      pinnedMemory({
        id: "pin-1",
        memoryId: "memory-1",
        categoryId: "category-cuisine",
        title: "Ramen",
      }),
      pinnedMemory({
        id: "pin-2",
        memoryId: "memory-2",
        categoryId: "category-sightseeing",
        title: "Harbour walk",
      }),
      pinnedMemory({
        id: "pin-3",
        memoryId: "memory-3",
        categoryId: "category-custom",
        categoryName: "Anime",
        title: "Anime night",
      }),
    ],
  });
  const service = createMemoryService({
    memories: repository,
    now: () => now,
  });

  const result = await service.listDashboardPinnedMemories(userId);

  assert.deepEqual(
    result.map((memory) => memory.categoryName),
    ["Cuisine", "Sightseeing"],
  );
});

test("dashboard pinned memories are limited to three per supported category", async () => {
  const repository = new InMemoryMemoryRepository({
    categories: memoryCategories,
    pinnedMemories: [1, 2, 3, 4].map((position) =>
      pinnedMemory({
        id: `pin-${position}`,
        memoryId: `memory-${position}`,
        categoryId: "category-cuisine",
        title: `Cuisine ${position}`,
        position,
      }),
    ),
  });
  const service = createMemoryService({
    memories: repository,
    now: () => now,
  });

  const result = await service.listDashboardPinnedMemories(userId);

  assert.deepEqual(
    result.map((memory) => memory.id),
    ["pin-1", "pin-2", "pin-3"],
  );
});

test("replace pinned memory uses another memory from the same category", async () => {
  const repository = new InMemoryMemoryRepository({
    memories: [
      memory({
        id: "memory-1",
        categoryId: "category-cuisine",
        title: "Ramen",
      }),
      memory({
        id: "memory-2",
        categoryId: "category-cuisine",
        title: "Dumplings",
      }),
      memory({
        id: "memory-3",
        categoryId: "category-sightseeing",
        title: "Harbour walk",
      }),
    ],
    pinnedMemories: [
      pinnedMemory({
        id: "pin-1",
        memoryId: "memory-1",
        categoryId: "category-cuisine",
        title: "Ramen",
      }),
    ],
  });
  const service = createMemoryService({
    memories: repository,
    now: () => now,
  });

  const result = await service.replacePinnedMemory(userId, "pin-1");

  assert.ok(result);
  assert.equal(result.status, "active");
  assert.equal(result.memoryId, "memory-2");
  assert.equal(result.categoryName, "Cuisine");
  assert.notEqual(result.memoryId, "memory-3");
  assert.equal(repository.getEvents()[0]?.eventType, "replaced");
  assert.equal(repository.getEvents()[1]?.eventType, "pinned");
});

test("suggest memories excludes already pinned memories", async () => {
  const repository = new InMemoryMemoryRepository({
    categories: memoryCategories,
    memories: [
      memory({
        id: "memory-1",
        categoryId: "category-cuisine",
        title: "Ramen",
      }),
      memory({
        id: "memory-2",
        categoryId: "category-cuisine",
        title: "Dumplings",
      }),
    ],
    pinnedMemories: [
      pinnedMemory({
        id: "pin-1",
        memoryId: "memory-1",
        categoryId: "category-cuisine",
        title: "Ramen",
      }),
    ],
  });
  const service = createMemoryService({
    memories: repository,
    now: () => now,
  });

  const suggestions = await service.suggestMemories(userId, 4);

  assert.deepEqual(
    suggestions.map((suggestion) => suggestion.id),
    ["memory-2"],
  );
});

test("pin suggested memory appends a same-category dashboard pin", async () => {
  const repository = new InMemoryMemoryRepository({
    categories: memoryCategories,
    memories: [
      memory({
        id: "memory-1",
        categoryId: "category-cuisine",
        title: "Ramen",
      }),
      memory({
        id: "memory-2",
        categoryId: "category-cuisine",
        title: "Dumplings",
      }),
    ],
    pinnedMemories: [
      pinnedMemory({
        id: "pin-1",
        memoryId: "memory-1",
        categoryId: "category-cuisine",
        title: "Ramen",
        position: 1,
      }),
    ],
  });
  const service = createMemoryService({
    memories: repository,
    now: () => now,
  });

  const result = await service.pinSuggestedMemory(userId, "memory-2");

  assert.ok(result);
  assert.equal(result.memoryId, "memory-2");
  assert.equal(result.position, 2);
  assert.equal(result.status, "active");
  assert.equal(repository.getEvents()[0]?.eventType, "pinned");
});

test("cancel suggested pin removes the dashboard pin", async () => {
  const repository = new InMemoryMemoryRepository({
    categories: memoryCategories,
    memories: [
      memory({
        id: "memory-1",
        categoryId: "category-cuisine",
        title: "Ramen",
      }),
    ],
    pinnedMemories: [
      pinnedMemory({
        id: "pin-1",
        memoryId: "memory-1",
        categoryId: "category-cuisine",
        title: "Ramen",
      }),
    ],
  });
  const service = createMemoryService({
    memories: repository,
    now: () => now,
  });

  const result = await service.cancelSuggestedPin(userId, "memory-1");

  assert.equal(result, true);
  assert.equal((await repository.listPinnedMemories(userId)).length, 0);
  assert.equal(repository.getEvents()[0]?.eventType, "unpinned");
});
