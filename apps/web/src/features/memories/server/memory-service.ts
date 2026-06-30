import { PostgresMemoryRepository } from "./postgres-memory-repository.ts";
import type {
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

const completedCleanupDelayMs = 2 * 60 * 60 * 1000;
const visibleDurationsHours = [24, 30, 36, 42, 48] as const;

function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function randomVisibleUntil(now: Date) {
  const index = Math.floor(Math.random() * visibleDurationsHours.length);

  return addHours(now, visibleDurationsHours[index]);
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
