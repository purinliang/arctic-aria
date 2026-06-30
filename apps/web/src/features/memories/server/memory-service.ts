import { PostgresMemoryRepository } from "./postgres-memory-repository.ts";
import type {
  MemoryRecord,
  MemoryRepository,
  PinnedMemoryRecord,
} from "./memory-repository.ts";

export type MemoryServiceOptions = {
  memories?: MemoryRepository;
  now?: () => Date;
};

export type DashboardPinnedMemory = PinnedMemoryRecord & {
  status: "active" | "completed";
};

export type MemorySuggestionRecord = MemoryRecord & {
  score: number;
};

const completedCleanupDelayMs = 2 * 60 * 60 * 1000;
const visibleDurationsHours = [24, 30, 36, 42, 48] as const;
const maxPinnedPerCategory = 3;

function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function randomVisibleUntil(now: Date) {
  const index = Math.floor(Math.random() * visibleDurationsHours.length);

  return addHours(now, visibleDurationsHours[index]);
}

function daysBetween(left: Date, right: Date) {
  const diff = Math.max(0, left.getTime() - right.getTime());

  return Math.max(1, Math.floor(diff / (24 * 60 * 60 * 1000)));
}

function suggestionScore(memory: MemoryRecord, baseWeight: number, now: Date) {
  const daysSource = memory.lastDoneAt ?? memory.createdAt;
  const daysScore = Math.log(1 + daysBetween(now, daysSource));
  const countScore = memory.lastDoneAt ? 1 + Math.log(1 + memory.doneCount) : 3;
  const ignoredRecently =
    memory.lastIgnoredAt &&
    daysBetween(now, memory.lastIgnoredAt) <= 7;
  const ignoredFactor = ignoredRecently ? 0.25 : 1;

  return Math.max(0.01, baseWeight * daysScore * countScore * ignoredFactor);
}

function weightedPick(
  candidates: MemorySuggestionRecord[],
  count: number,
  random: () => number,
) {
  const pool = [...candidates];
  const selected: MemorySuggestionRecord[] = [];

  while (pool.length > 0 && selected.length < count) {
    const total = pool.reduce((sum, memory) => sum + memory.score, 0);
    let cursor = random() * total;
    const index = pool.findIndex((memory) => {
      cursor -= memory.score;

      return cursor <= 0;
    });
    const [memory] = pool.splice(index >= 0 ? index : pool.length - 1, 1);

    selected.push(memory);
  }

  return selected;
}

function toDashboardPinnedMemory(
  memory: PinnedMemoryRecord,
): DashboardPinnedMemory {
  return {
    ...memory,
    status: memory.completedAt ? "completed" : "active",
  };
}

export function createMemoryService(options: MemoryServiceOptions = {}) {
  const memories = options.memories ?? new PostgresMemoryRepository();
  const now = options.now ?? (() => new Date());
  const random = Math.random;

  return {
    async initializeUserMemoryDefaults(userId: string) {
      return memories.ensureDefaultCategories(userId);
    },

    async listMemoryLibrary(userId: string) {
      await memories.ensureDefaultCategories(userId);

      return memories.listMemories(userId);
    },

    async listMemoryCategories(userId: string) {
      return memories.listCategories(userId);
    },

    async createCategory(userId: string, name: string, baseWeight: number) {
      return memories.createCategory({
        userId,
        name,
        baseWeight,
        occurredAt: now(),
      });
    },

    async updateCategory(
      userId: string,
      categoryId: string,
      name: string,
      baseWeight: number,
    ) {
      return memories.updateCategory({
        userId,
        categoryId,
        name,
        baseWeight,
        occurredAt: now(),
      });
    },

    async deleteCategory(userId: string, categoryId: string) {
      return memories.deleteCategory({ userId, categoryId });
    },

    async createMemory(
      userId: string,
      categoryId: string,
      title: string,
      description: string,
    ) {
      return memories.createMemory({
        userId,
        categoryId,
        title,
        description,
        occurredAt: now(),
      });
    },

    async updateMemory(
      userId: string,
      memoryId: string,
      categoryId: string,
      title: string,
      description: string,
    ) {
      return memories.updateMemory({
        userId,
        memoryId,
        categoryId,
        title,
        description,
        occurredAt: now(),
      });
    },

    async deleteMemory(userId: string, memoryId: string) {
      return memories.deleteMemory({
        userId,
        memoryId,
        occurredAt: now(),
      });
    },

    async suggestMemories(userId: string, count = 4) {
      const occurredAt = now();
      const [categories, memoryRecords, pinnedMemories] = await Promise.all([
        memories.listCategories(userId),
        memories.listMemories(userId),
        memories.listPinnedMemories(userId),
      ]);
      const pinnedMemoryIds = new Set(
        pinnedMemories.map((memory) => memory.memoryId),
      );
      const pinnedCountByCategory = new Map<string, number>();

      for (const pinnedMemory of pinnedMemories) {
        pinnedCountByCategory.set(
          pinnedMemory.categoryId,
          (pinnedCountByCategory.get(pinnedMemory.categoryId) ?? 0) + 1,
        );
      }

      const baseWeightByCategory = new Map(
        categories.map((category) => [category.id, category.baseWeight]),
      );
      const candidates = memoryRecords
        .filter(
          (memory) =>
            !pinnedMemoryIds.has(memory.id) &&
            (pinnedCountByCategory.get(memory.categoryId) ?? 0) <
              maxPinnedPerCategory,
        )
        .map((memory) => ({
          ...memory,
          score: suggestionScore(
            memory,
            baseWeightByCategory.get(memory.categoryId) ?? 1,
            occurredAt,
          ),
        }));

      return weightedPick(candidates, count, random);
    },

    async pinSuggestedMemory(userId: string, memoryId: string) {
      const occurredAt = now();
      const memoryRecords = await memories.listMemories(userId);
      const memory = memoryRecords.find((candidate) => candidate.id === memoryId);

      if (!memory) {
        return null;
      }

      const pinnedMemories = await memories.listPinnedMemories(userId);
      const sameCategoryPins = pinnedMemories.filter(
        (pinnedMemory) => pinnedMemory.categoryId === memory.categoryId,
      );

      if (sameCategoryPins.length >= maxPinnedPerCategory) {
        return null;
      }

      const position =
        sameCategoryPins.reduce(
          (max, pinnedMemory) => Math.max(max, pinnedMemory.position),
          0,
        ) + 1;
      const pinnedMemory = await memories.pinMemory({
        userId,
        memoryId,
        position,
        occurredAt,
        visibleUntil: randomVisibleUntil(occurredAt),
      });

      return pinnedMemory ? toDashboardPinnedMemory(pinnedMemory) : null;
    },

    async ignoreSuggestedMemory(userId: string, memoryId: string) {
      return memories.ignoreMemory({
        userId,
        memoryId,
        occurredAt: now(),
      });
    },

    async listDashboardPinnedMemories(userId: string) {
      await memories.ensureDefaultCategories(userId);
      const pinnedMemories = await memories.listPinnedMemories(userId);

      return pinnedMemories.map(toDashboardPinnedMemory);
    },

    async completePinnedMemory(userId: string, pinnedMemoryId: string) {
      const occurredAt = now();
      const memory = await memories.completePinnedMemory({
        userId,
        pinnedMemoryId,
        occurredAt,
        cleanupAt: addHours(occurredAt, 2),
      });

      return memory ? toDashboardPinnedMemory(memory) : null;
    },

    async cancelPinnedMemoryDone(userId: string, pinnedMemoryId: string) {
      const memory = await memories.cancelPinnedMemoryDone({
        userId,
        pinnedMemoryId,
        occurredAt: now(),
      });

      return memory ? toDashboardPinnedMemory(memory) : null;
    },

    async replacePinnedMemory(userId: string, pinnedMemoryId: string) {
      const occurredAt = now();
      const memory = await memories.replacePinnedMemory({
        userId,
        pinnedMemoryId,
        occurredAt,
        visibleUntil: randomVisibleUntil(occurredAt),
      });

      return memory ? toDashboardPinnedMemory(memory) : null;
    },
  };
}

export const memoryService = createMemoryService();

export const memoryTiming = {
  completedCleanupDelayMs,
  visibleDurationsHours,
};
