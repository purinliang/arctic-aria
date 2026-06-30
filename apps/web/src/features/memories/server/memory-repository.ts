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

export type CreateMemoryCategoryInput = {
  userId: string;
  name: string;
  baseWeight: number;
  occurredAt: Date;
};

export type UpdateMemoryCategoryInput = CreateMemoryCategoryInput & {
  categoryId: string;
};

export type DeleteMemoryCategoryInput = {
  userId: string;
  categoryId: string;
};

export type CreateMemoryInput = {
  userId: string;
  categoryId: string;
  title: string;
  description: string;
  occurredAt: Date;
};

export type UpdateMemoryInput = CreateMemoryInput & {
  memoryId: string;
};

export type DeleteMemoryInput = {
  userId: string;
  memoryId: string;
  occurredAt: Date;
};

export type PinMemoryInput = {
  userId: string;
  memoryId: string;
  position: number;
  occurredAt: Date;
  visibleUntil: Date;
};

export type UnpinMemoryInput = {
  userId: string;
  memoryId: string;
  occurredAt: Date;
};

export type IgnoreMemoryInput = {
  userId: string;
  memoryId: string;
  occurredAt: Date;
};

export type MemoryRepository = {
  ensureDefaultCategories(userId: string): Promise<MemoryCategoryRecord[]>;
  listCategories(userId: string): Promise<MemoryCategoryRecord[]>;
  createCategory(input: CreateMemoryCategoryInput): Promise<MemoryCategoryRecord>;
  updateCategory(
    input: UpdateMemoryCategoryInput,
  ): Promise<MemoryCategoryRecord | null>;
  deleteCategory(input: DeleteMemoryCategoryInput): Promise<boolean>;
  listMemories(userId: string): Promise<MemoryRecord[]>;
  createMemory(input: CreateMemoryInput): Promise<MemoryRecord | null>;
  updateMemory(input: UpdateMemoryInput): Promise<MemoryRecord | null>;
  deleteMemory(input: DeleteMemoryInput): Promise<boolean>;
  pinMemory(input: PinMemoryInput): Promise<PinnedMemoryRecord | null>;
  unpinMemory(input: UnpinMemoryInput): Promise<boolean>;
  ignoreMemory(input: IgnoreMemoryInput): Promise<boolean>;
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

  async listCategories(userId: string) {
    await this.ensureDefaultCategories(userId);

    return this.categories.filter((category) => category.userId === userId);
  }

  async createCategory(input: CreateMemoryCategoryInput) {
    const category: MemoryCategoryRecord = {
      id: crypto.randomUUID(),
      userId: input.userId,
      name: input.name,
      baseWeight: input.baseWeight,
      createdAt: input.occurredAt,
      updatedAt: input.occurredAt,
    };

    this.categories.push(category);

    return category;
  }

  async updateCategory(input: UpdateMemoryCategoryInput) {
    const category = this.categories.find(
      (current) =>
        current.userId === input.userId && current.id === input.categoryId,
    );

    if (!category) {
      return null;
    }

    category.name = input.name;
    category.baseWeight = input.baseWeight;
    category.updatedAt = input.occurredAt;

    return category;
  }

  async deleteCategory(input: DeleteMemoryCategoryInput) {
    if (
      this.memories.some(
        (memory) =>
          memory.userId === input.userId && memory.categoryId === input.categoryId,
      )
    ) {
      return false;
    }

    const before = this.categories.length;
    this.categories = this.categories.filter(
      (category) =>
        category.userId !== input.userId || category.id !== input.categoryId,
    );

    return this.categories.length !== before;
  }

  async createMemory(input: CreateMemoryInput) {
    const category = this.categories.find(
      (current) =>
        current.userId === input.userId && current.id === input.categoryId,
    );

    if (!category) {
      return null;
    }

    const memory: MemoryRecord = {
      id: crypto.randomUUID(),
      userId: input.userId,
      categoryId: input.categoryId,
      categoryName: category.name,
      title: input.title,
      description: input.description,
      lastDoneAt: null,
      doneCount: 0,
      lastPinnedAt: null,
      lastIgnoredAt: null,
      createdAt: input.occurredAt,
      updatedAt: input.occurredAt,
    };

    this.memories.push(memory);

    return memory;
  }

  async updateMemory(input: UpdateMemoryInput) {
    const memory = this.memories.find(
      (current) => current.userId === input.userId && current.id === input.memoryId,
    );
    const category = this.categories.find(
      (current) =>
        current.userId === input.userId && current.id === input.categoryId,
    );

    if (!memory || !category) {
      return null;
    }

    memory.categoryId = input.categoryId;
    memory.categoryName = category.name;
    memory.title = input.title;
    memory.description = input.description;
    memory.updatedAt = input.occurredAt;

    return memory;
  }

  async deleteMemory(input: DeleteMemoryInput) {
    const before = this.memories.length;
    this.memories = this.memories.filter(
      (memory) => memory.userId !== input.userId || memory.id !== input.memoryId,
    );
    this.pinnedMemories = this.pinnedMemories.filter(
      (memory) =>
        memory.userId !== input.userId || memory.memoryId !== input.memoryId,
    );
    this.recordEvent(input.userId, input.memoryId, "deleted", input.occurredAt);

    return this.memories.length !== before;
  }

  async pinMemory(input: PinMemoryInput) {
    const memory = this.memories.find(
      (current) => current.userId === input.userId && current.id === input.memoryId,
    );

    if (!memory) {
      return null;
    }

    const pinnedMemory: PinnedMemoryRecord = {
      id: crypto.randomUUID(),
      userId: input.userId,
      memoryId: memory.id,
      categoryId: memory.categoryId,
      categoryName: memory.categoryName,
      title: memory.title,
      description: memory.description,
      position: input.position,
      pinnedAt: input.occurredAt,
      lastShownAt: input.occurredAt,
      visibleUntil: input.visibleUntil,
      completedAt: null,
      completedCleanupAt: null,
      lastDoneAt: memory.lastDoneAt,
      doneCount: memory.doneCount,
      createdAt: input.occurredAt,
      updatedAt: input.occurredAt,
    };

    this.pinnedMemories.push(pinnedMemory);
    memory.lastPinnedAt = input.occurredAt;
    memory.updatedAt = input.occurredAt;
    this.recordEvent(input.userId, input.memoryId, "pinned", input.occurredAt);

    return pinnedMemory;
  }

  async ignoreMemory(input: IgnoreMemoryInput) {
    const memory = this.memories.find(
      (current) => current.userId === input.userId && current.id === input.memoryId,
    );

    if (!memory) {
      return false;
    }

    memory.lastIgnoredAt = input.occurredAt;
    memory.updatedAt = input.occurredAt;
    this.recordEvent(input.userId, input.memoryId, "ignored", input.occurredAt);

    return true;
  }

  async unpinMemory(input: UnpinMemoryInput) {
    const before = this.pinnedMemories.length;
    this.pinnedMemories = this.pinnedMemories.filter(
      (memory) =>
        memory.userId !== input.userId || memory.memoryId !== input.memoryId,
    );

    if (this.pinnedMemories.length === before) {
      return false;
    }

    this.recordEvent(input.userId, input.memoryId, "unpinned", input.occurredAt);

    return true;
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
