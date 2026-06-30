export type MemoryCategoryName = string;

export type MemoryEventType =
  | "pinned"
  | "unpinned"
  | "ignored"
  | "completed"
  | "completed_canceled"
  | "replaced"
  | "deleted";

export type MemoryCategoryRecord = {
  id: string;
  userId: string;
  name: MemoryCategoryName;
  baseWeight: number;
  createdAt: Date;
  updatedAt: Date;
};

export type MemoryRecord = {
  id: string;
  userId: string;
  categoryId: string;
  categoryName: MemoryCategoryName;
  title: string;
  description: string;
  lastDoneAt: Date | null;
  doneCount: number;
  lastPinnedAt: Date | null;
  lastIgnoredAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type PinnedMemoryRecord = {
  id: string;
  userId: string;
  memoryId: string;
  categoryId: string;
  categoryName: MemoryCategoryName;
  title: string;
  description: string;
  position: number;
  pinnedAt: Date;
  lastShownAt: Date;
  visibleUntil: Date;
  completedAt: Date | null;
  completedCleanupAt: Date | null;
  lastDoneAt: Date | null;
  doneCount: number;
  createdAt: Date;
  updatedAt: Date;
};

export type CompletePinnedMemoryInput = {
  userId: string;
  pinnedMemoryId: string;
  occurredAt: Date;
  cleanupAt: Date;
};

export type CancelPinnedMemoryInput = {
  userId: string;
  pinnedMemoryId: string;
  occurredAt: Date;
};

export type ReplacePinnedMemoryInput = {
  userId: string;
  pinnedMemoryId: string;
  occurredAt: Date;
  visibleUntil: Date;
};

export type MemoryRepository = {
  ensureDefaultCategories(userId: string): Promise<MemoryCategoryRecord[]>;
  listMemories(userId: string): Promise<MemoryRecord[]>;
  listPinnedMemories(userId: string): Promise<PinnedMemoryRecord[]>;
  completePinnedMemory(
    input: CompletePinnedMemoryInput,
  ): Promise<PinnedMemoryRecord | null>;
  cancelPinnedMemoryDone(
    input: CancelPinnedMemoryInput,
  ): Promise<PinnedMemoryRecord | null>;
  replacePinnedMemory(
    input: ReplacePinnedMemoryInput,
  ): Promise<PinnedMemoryRecord | null>;
};

const defaultCategoryInputs: Array<{
  name: MemoryCategoryName;
  baseWeight: number;
}> = [
  { name: "Cuisine", baseWeight: 1.2 },
  { name: "Sightseeing", baseWeight: 0.8 },
];

export function getDefaultMemoryCategories() {
  return defaultCategoryInputs;
}

export class InMemoryMemoryRepository implements MemoryRepository {
  private categories: MemoryCategoryRecord[] = [];
  private memories: MemoryRecord[] = [];
  private pinnedMemories: PinnedMemoryRecord[] = [];
  private events: Array<{
    id: string;
    userId: string;
    memoryId: string;
    eventType: MemoryEventType;
    occurredAt: Date;
  }> = [];

  constructor(seed?: {
    categories?: MemoryCategoryRecord[];
    memories?: MemoryRecord[];
    pinnedMemories?: PinnedMemoryRecord[];
  }) {
    this.categories = seed?.categories ?? [];
    this.memories = seed?.memories ?? [];
    this.pinnedMemories = seed?.pinnedMemories ?? [];
  }

  async ensureDefaultCategories(userId: string) {
    const now = new Date();

    for (const category of defaultCategoryInputs) {
      const exists = this.categories.some(
        (existing) =>
          existing.userId === userId && existing.name === category.name,
      );

      if (!exists) {
        this.categories.push({
          id: crypto.randomUUID(),
          userId,
          name: category.name,
          baseWeight: category.baseWeight,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    return this.categories.filter((category) => category.userId === userId);
  }

  async listMemories(userId: string) {
    return this.memories.filter((memory) => memory.userId === userId);
  }

  async listPinnedMemories(userId: string) {
    return this.pinnedMemories
      .filter((memory) => memory.userId === userId)
      .sort((left, right) => left.position - right.position);
  }

  async completePinnedMemory(input: CompletePinnedMemoryInput) {
    const pinnedMemory = this.findPinned(input.userId, input.pinnedMemoryId);

    if (!pinnedMemory) {
      return null;
    }

    pinnedMemory.completedAt = input.occurredAt;
    pinnedMemory.completedCleanupAt = input.cleanupAt;
    pinnedMemory.updatedAt = input.occurredAt;

    const memory = this.memories.find(
      (candidate) => candidate.id === pinnedMemory.memoryId,
    );

    if (memory) {
      memory.doneCount += 1;
      memory.lastDoneAt = input.occurredAt;
      memory.updatedAt = input.occurredAt;
      pinnedMemory.doneCount = memory.doneCount;
      pinnedMemory.lastDoneAt = memory.lastDoneAt;
    }

    this.recordEvent(
      input.userId,
      pinnedMemory.memoryId,
      "completed",
      input.occurredAt,
    );

    return pinnedMemory;
  }

  async cancelPinnedMemoryDone(input: CancelPinnedMemoryInput) {
    const pinnedMemory = this.findPinned(input.userId, input.pinnedMemoryId);

    if (!pinnedMemory || !pinnedMemory.completedAt) {
      return pinnedMemory ?? null;
    }

    pinnedMemory.completedAt = null;
    pinnedMemory.completedCleanupAt = null;
    pinnedMemory.updatedAt = input.occurredAt;

    const memory = this.memories.find(
      (candidate) => candidate.id === pinnedMemory.memoryId,
    );

    if (memory) {
      memory.doneCount = Math.max(0, memory.doneCount - 1);
      memory.lastDoneAt = null;
      memory.updatedAt = input.occurredAt;
      pinnedMemory.doneCount = memory.doneCount;
      pinnedMemory.lastDoneAt = memory.lastDoneAt;
    }

    this.recordEvent(
      input.userId,
      pinnedMemory.memoryId,
      "completed_canceled",
      input.occurredAt,
    );

    return pinnedMemory;
  }

  async replacePinnedMemory(input: ReplacePinnedMemoryInput) {
    const pinnedMemory = this.findPinned(input.userId, input.pinnedMemoryId);

    if (!pinnedMemory) {
      return null;
    }

    const replacement = this.memories.find(
      (memory) =>
        memory.userId === input.userId &&
        memory.categoryId === pinnedMemory.categoryId &&
        !this.pinnedMemories.some(
          (current) =>
            current.userId === input.userId && current.memoryId === memory.id,
        ),
    );

    if (!replacement) {
      return null;
    }

    const oldMemoryId = pinnedMemory.memoryId;

    pinnedMemory.memoryId = replacement.id;
    pinnedMemory.title = replacement.title;
    pinnedMemory.description = replacement.description;
    pinnedMemory.pinnedAt = input.occurredAt;
    pinnedMemory.lastShownAt = input.occurredAt;
    pinnedMemory.visibleUntil = input.visibleUntil;
    pinnedMemory.completedAt = null;
    pinnedMemory.completedCleanupAt = null;
    pinnedMemory.lastDoneAt = replacement.lastDoneAt;
    pinnedMemory.doneCount = replacement.doneCount;
    pinnedMemory.updatedAt = input.occurredAt;
    replacement.lastPinnedAt = input.occurredAt;
    replacement.updatedAt = input.occurredAt;

    this.recordEvent(input.userId, oldMemoryId, "replaced", input.occurredAt);
    this.recordEvent(input.userId, replacement.id, "pinned", input.occurredAt);

    return pinnedMemory;
  }

  getEvents() {
    return this.events;
  }

  private findPinned(userId: string, pinnedMemoryId: string) {
    return this.pinnedMemories.find(
      (memory) => memory.userId === userId && memory.id === pinnedMemoryId,
    );
  }

  private recordEvent(
    userId: string,
    memoryId: string,
    eventType: MemoryEventType,
    occurredAt: Date,
  ) {
    this.events.push({
      id: crypto.randomUUID(),
      userId,
      memoryId,
      eventType,
      occurredAt,
    });
  }
}
