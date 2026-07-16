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
  description: string;
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
  description: string;
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
  description: string;
}> = [
  { name: "Cuisine", description: "" },
  { name: "Sightseeing", description: "" },
];

export function getDefaultMemoryCategories() {
  return defaultCategoryInputs;
}
