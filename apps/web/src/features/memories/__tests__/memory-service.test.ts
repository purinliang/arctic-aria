import assert from "node:assert/strict";
import test from "node:test";
import {
  createMemoryService,
  memoryTiming,
} from "../server/memory-service.ts";
import {
  InMemoryMemoryRepository,
  type MemoryCategoryRecord,
  type MemoryRecord,
  type PinnedMemoryRecord,
} from "../server/memory-repository.ts";

const userId = "user-1";
const now = new Date("2026-06-30T10:00:00.000Z");

const categories: MemoryCategoryRecord[] = [
  {
    id: "category-cuisine",
    userId,
    name: "Cuisine",
    baseWeight: 1.2,
    createdAt: new Date("2026-06-01T00:00:00.000Z"),
    updatedAt: new Date("2026-06-01T00:00:00.000Z"),
  },
  {
    id: "category-sightseeing",
    userId,
    name: "Sightseeing",
    baseWeight: 0.8,
    createdAt: new Date("2026-06-01T00:00:00.000Z"),
    updatedAt: new Date("2026-06-01T00:00:00.000Z"),
  },
];

function memory(
  input: Partial<MemoryRecord> & Pick<MemoryRecord, "id" | "categoryId" | "title">,
): MemoryRecord {
  return {
    id: input.id,
    userId,
    categoryId: input.categoryId,
    categoryName: input.categoryId === "category-cuisine" ? "Cuisine" : "Sightseeing",
    title: input.title,
    description: input.description ?? `${input.title} description`,
    lastDoneAt: input.lastDoneAt ?? null,
    doneCount: input.doneCount ?? 0,
    lastPinnedAt: input.lastPinnedAt ?? null,
    lastIgnoredAt: input.lastIgnoredAt ?? null,
    createdAt: input.createdAt ?? new Date("2026-06-01T00:00:00.000Z"),
    updatedAt: input.updatedAt ?? new Date("2026-06-01T00:00:00.000Z"),
  };
}

function pinnedMemory(
  input: Partial<PinnedMemoryRecord> &
    Pick<PinnedMemoryRecord, "id" | "memoryId" | "categoryId" | "title">,
): PinnedMemoryRecord {
  return {
    id: input.id,
    userId,
    memoryId: input.memoryId,
    categoryId: input.categoryId,
    categoryName: input.categoryId === "category-cuisine" ? "Cuisine" : "Sightseeing",
    title: input.title,
    description: input.description ?? `${input.title} description`,
    position: input.position ?? 1,
    pinnedAt: input.pinnedAt ?? new Date("2026-06-20T00:00:00.000Z"),
    lastShownAt: input.lastShownAt ?? new Date("2026-06-20T00:00:00.000Z"),
    visibleUntil: input.visibleUntil ?? new Date("2026-07-01T00:00:00.000Z"),
    completedAt: input.completedAt ?? null,
    completedCleanupAt: input.completedCleanupAt ?? null,
    lastDoneAt: input.lastDoneAt ?? null,
    doneCount: input.doneCount ?? 0,
    createdAt: input.createdAt ?? new Date("2026-06-20T00:00:00.000Z"),
    updatedAt: input.updatedAt ?? new Date("2026-06-20T00:00:00.000Z"),
  };
}

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
    categories,
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
    categories,
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
    categories,
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
