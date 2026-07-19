export type MemoryCategoryName = string;
export type BuiltInMemoryCategoryKey =
  | "cuisine"
  | "sightseeing"
  | "movie"
  | "anime"
  | "book"
  | "music"
  | "game"
  | "shopping";

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
  description: string | null;
  builtInKey: BuiltInMemoryCategoryKey | null;
  iconName: string;
  shownOnDashboard: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type MemoryRecord = {
  id: string;
  userId: string;
  categoryId: string;
  categoryName: MemoryCategoryName;
  categoryBuiltInKey: BuiltInMemoryCategoryKey | null;
  categoryShownOnDashboard: boolean;
  title: string;
  description: string | null;
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
  categoryBuiltInKey: BuiltInMemoryCategoryKey | null;
  categoryShownOnDashboard: boolean;
  title: string;
  description: string | null;
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
  description: string | null;
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
  description: string | null;
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
  builtInKey: BuiltInMemoryCategoryKey;
  iconName: string;
  shownOnDashboard: boolean;
}> = [
  {
    name: "Cuisine",
    description: "Restaurants, cafes, meals, and food experiences worth revisiting.",
    builtInKey: "cuisine",
    iconName: "utensils",
    shownOnDashboard: true,
  },
  {
    name: "Sightseeing",
    description: "Places, walks, views, and visits worth seeing again.",
    builtInKey: "sightseeing",
    iconName: "trees",
    shownOnDashboard: true,
  },
  {
    name: "Movie",
    description: "Films to watch, rewatch, or remember.",
    builtInKey: "movie",
    iconName: "film",
    shownOnDashboard: true,
  },
  {
    name: "Anime",
    description: "Anime series or films to continue or revisit.",
    builtInKey: "anime",
    iconName: "wand-sparkles",
    shownOnDashboard: true,
  },
  {
    name: "Book",
    description: "Books and reading experiences worth returning to.",
    builtInKey: "book",
    iconName: "book-open-text",
    shownOnDashboard: true,
  },
  {
    name: "Music",
    description: "Songs, albums, concerts, and listening moments to revisit.",
    builtInKey: "music",
    iconName: "music",
    shownOnDashboard: true,
  },
  {
    name: "Game",
    description: "Games and playful experiences worth returning to.",
    builtInKey: "game",
    iconName: "gamepad-2",
    shownOnDashboard: true,
  },
  {
    name: "Shopping",
    description: "Shops, items, and buying experiences worth remembering.",
    builtInKey: "shopping",
    iconName: "shopping-cart",
    shownOnDashboard: true,
  },
];

export function getDefaultMemoryCategories() {
  return defaultCategoryInputs;
}
