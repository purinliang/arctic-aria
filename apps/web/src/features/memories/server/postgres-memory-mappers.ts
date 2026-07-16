import type {
  MemoryCategoryName,
  MemoryCategoryRecord,
  MemoryRecord,
  PinnedMemoryRecord,
} from "./memory-repository.ts";

export type MemoryCategoryRow = {
  id: string;
  user_id: string;
  name: MemoryCategoryName;
  description: string;
  created_at: Date | string;
  updated_at: Date | string;
};

export type MemoryRow = {
  id: string;
  user_id: string;
  category_id: string;
  category_name: MemoryCategoryName;
  title: string;
  description: string;
  last_done_at: Date | string | null;
  done_count: number;
  last_pinned_at: Date | string | null;
  last_ignored_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
};

export type PinnedMemoryRow = {
  id: string;
  user_id: string;
  memory_id: string;
  category_id: string;
  category_name: MemoryCategoryName;
  title: string;
  description: string;
  position: number;
  pinned_at: Date | string;
  last_shown_at: Date | string;
  visible_until: Date | string;
  completed_at: Date | string | null;
  completed_cleanup_at: Date | string | null;
  last_done_at: Date | string | null;
  done_count: number;
  created_at: Date | string;
  updated_at: Date | string;
};

function toDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}

function toNullableDate(value: Date | string | null) {
  return value ? toDate(value) : null;
}

export function mapCategory(row: MemoryCategoryRow): MemoryCategoryRecord {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description,
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at),
  };
}

export function mapMemory(row: MemoryRow): MemoryRecord {
  return {
    id: row.id,
    userId: row.user_id,
    categoryId: row.category_id,
    categoryName: row.category_name,
    title: row.title,
    description: row.description,
    lastDoneAt: toNullableDate(row.last_done_at),
    doneCount: row.done_count,
    lastPinnedAt: toNullableDate(row.last_pinned_at),
    lastIgnoredAt: toNullableDate(row.last_ignored_at),
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at),
  };
}

export function mapPinnedMemory(row: PinnedMemoryRow): PinnedMemoryRecord {
  return {
    id: row.id,
    userId: row.user_id,
    memoryId: row.memory_id,
    categoryId: row.category_id,
    categoryName: row.category_name,
    title: row.title,
    description: row.description,
    position: row.position,
    pinnedAt: toDate(row.pinned_at),
    lastShownAt: toDate(row.last_shown_at),
    visibleUntil: toDate(row.visible_until),
    completedAt: toNullableDate(row.completed_at),
    completedCleanupAt: toNullableDate(row.completed_cleanup_at),
    lastDoneAt: toNullableDate(row.last_done_at),
    doneCount: row.done_count,
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at),
  };
}

export const memorySelect = `
  SELECT
    memories.id,
    memories.user_id,
    memories.category_id,
    memory_categories.name AS category_name,
    memories.title,
    memories.description,
    memories.last_done_at,
    memories.done_count,
    memories.last_pinned_at,
    memories.last_ignored_at,
    memories.created_at,
    memories.updated_at
  FROM memories
  INNER JOIN memory_categories ON memory_categories.id = memories.category_id
`;

export const pinnedMemorySelect = `
  SELECT
    pinned_memories.id,
    pinned_memories.user_id,
    pinned_memories.memory_id,
    memories.category_id,
    memory_categories.name AS category_name,
    memories.title,
    memories.description,
    pinned_memories.position,
    pinned_memories.pinned_at,
    pinned_memories.last_shown_at,
    pinned_memories.visible_until,
    pinned_memories.completed_at,
    pinned_memories.completed_cleanup_at,
    memories.last_done_at,
    memories.done_count,
    pinned_memories.created_at,
    pinned_memories.updated_at
  FROM pinned_memories
  INNER JOIN memories ON memories.id = pinned_memories.memory_id
  INNER JOIN memory_categories ON memory_categories.id = memories.category_id
`;

export const pinnedSelectFromUpdatedPin = `
  SELECT
    updated_pin.id,
    updated_pin.user_id,
    updated_pin.memory_id,
    memories.category_id,
    memory_categories.name AS category_name,
    memories.title,
    memories.description,
    updated_pin.position,
    updated_pin.pinned_at,
    updated_pin.last_shown_at,
    updated_pin.visible_until,
    updated_pin.completed_at,
    updated_pin.completed_cleanup_at,
    memories.last_done_at,
    memories.done_count,
    updated_pin.created_at,
    updated_pin.updated_at
  FROM updated_pin
  INNER JOIN memories ON memories.id = updated_pin.memory_id
  INNER JOIN memory_categories ON memory_categories.id = memories.category_id
`;
