import type {
  MemoryCategoryRecord,
  MemoryRecord,
  PinnedMemoryRecord,
} from "../server/memory-repository.ts";

export const userId = "user-1";
export const now = new Date("2026-06-30T10:00:00.000Z");

export const memoryCategories: MemoryCategoryRecord[] = [
  {
    id: "category-cuisine",
    userId,
    name: "Cuisine",
    description: "",
    baseWeight: 1.2,
    createdAt: new Date("2026-06-01T00:00:00.000Z"),
    updatedAt: new Date("2026-06-01T00:00:00.000Z"),
  },
  {
    id: "category-sightseeing",
    userId,
    name: "Sightseeing",
    description: "",
    baseWeight: 0.8,
    createdAt: new Date("2026-06-01T00:00:00.000Z"),
    updatedAt: new Date("2026-06-01T00:00:00.000Z"),
  },
];

export function memory(
  input: Partial<MemoryRecord> & Pick<MemoryRecord, "id" | "categoryId" | "title">,
): MemoryRecord {
  return {
    id: input.id,
    userId,
    categoryId: input.categoryId,
    categoryName:
      input.categoryName ??
      (input.categoryId === "category-cuisine" ? "Cuisine" : "Sightseeing"),
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

export function pinnedMemory(
  input: Partial<PinnedMemoryRecord> &
    Pick<PinnedMemoryRecord, "id" | "memoryId" | "categoryId" | "title">,
): PinnedMemoryRecord {
  return {
    id: input.id,
    userId,
    memoryId: input.memoryId,
    categoryId: input.categoryId,
    categoryName:
      input.categoryName ??
      (input.categoryId === "category-cuisine" ? "Cuisine" : "Sightseeing"),
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
