import type { NeonQueryFunction } from "@neondatabase/serverless";
import { getSql } from "../../../server/database/neon.ts";
import {
  getDefaultMemoryCategories,
  type CancelPinnedMemoryInput,
  type CompletePinnedMemoryInput,
  type MemoryCategoryName,
  type MemoryCategoryRecord,
  type MemoryRecord,
  type MemoryRepository,
  type PinnedMemoryRecord,
  type ReplacePinnedMemoryInput,
} from "./memory-repository.ts";

type MemoryCategoryRow = {
  id: string;
  user_id: string;
  name: MemoryCategoryName;
  base_weight: string | number;
  created_at: Date | string;
  updated_at: Date | string;
};

type MemoryRow = {
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

type PinnedMemoryRow = {
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

function mapCategory(row: MemoryCategoryRow): MemoryCategoryRecord {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    baseWeight: Number(row.base_weight),
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at),
  };
}

function mapMemory(row: MemoryRow): MemoryRecord {
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

function mapPinnedMemory(row: PinnedMemoryRow): PinnedMemoryRecord {
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

const memorySelect = `
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

const pinnedMemorySelect = `
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

export class PostgresMemoryRepository implements MemoryRepository {
  private readonly sql?: NeonQueryFunction<false, false>;

  constructor(sql?: NeonQueryFunction<false, false>) {
    this.sql = sql;
  }

  private getSql() {
    return this.sql ?? getSql();
  }

  async ensureDefaultCategories(userId: string) {
    for (const category of getDefaultMemoryCategories()) {
      await this.getSql()`
        INSERT INTO memory_categories (user_id, name, base_weight)
        VALUES (${userId}, ${category.name}, ${category.baseWeight})
        ON CONFLICT (user_id, name) DO NOTHING
      `;
    }

    const rows = (await this.getSql()`
      SELECT id, user_id, name, base_weight, created_at, updated_at
      FROM memory_categories
      WHERE user_id = ${userId}
      ORDER BY name
    `) as MemoryCategoryRow[];

    return rows.map(mapCategory);
  }

  async listMemories(userId: string) {
    const rows = (await this.getSql().query(
      `${memorySelect}
       WHERE memories.user_id = $1
       ORDER BY memory_categories.name, memories.created_at DESC`,
      [userId],
    )) as MemoryRow[];

    return rows.map(mapMemory);
  }

  async listPinnedMemories(userId: string) {
    const rows = (await this.getSql().query(
      `${pinnedMemorySelect}
       WHERE pinned_memories.user_id = $1
       ORDER BY memory_categories.name, pinned_memories.position`,
      [userId],
    )) as PinnedMemoryRow[];

    return rows.map(mapPinnedMemory);
  }

  async completePinnedMemory(input: CompletePinnedMemoryInput) {
    const rows = (await this.getSql().query(
      `
      WITH updated_pin AS (
        UPDATE pinned_memories
        SET
          completed_at = $3,
          completed_cleanup_at = $4,
          updated_at = $3
        WHERE id = $2
          AND user_id = $1
        RETURNING *
      ),
      updated_memory AS (
        UPDATE memories
        SET
          done_count = done_count + 1,
          last_done_at = $3,
          updated_at = $3
        FROM updated_pin
        WHERE memories.id = updated_pin.memory_id
        RETURNING memories.id
      ),
      event AS (
        INSERT INTO memory_events (user_id, memory_id, event_type, occurred_at)
        SELECT user_id, memory_id, 'completed', $3
        FROM updated_pin
        RETURNING id
      )
      ${pinnedSelectFromUpdatedPin}
      `,
      [input.userId, input.pinnedMemoryId, input.occurredAt, input.cleanupAt],
    )) as PinnedMemoryRow[];

    return rows[0] ? mapPinnedMemory(rows[0]) : null;
  }

  async cancelPinnedMemoryDone(input: CancelPinnedMemoryInput) {
    const rows = (await this.getSql().query(
      `
      WITH target AS (
        SELECT *
        FROM pinned_memories
        WHERE id = $2
          AND user_id = $1
        LIMIT 1
      ),
      updated_pin AS (
        UPDATE pinned_memories
        SET
          completed_at = NULL,
          completed_cleanup_at = NULL,
          updated_at = $3
        FROM target
        WHERE pinned_memories.id = target.id
        RETURNING pinned_memories.*
      ),
      updated_memory AS (
        UPDATE memories
        SET
          done_count = greatest(done_count - 1, 0),
          last_done_at = NULL,
          updated_at = $3
        FROM target
        WHERE memories.id = target.memory_id
          AND target.completed_at IS NOT NULL
        RETURNING memories.id
      ),
      event AS (
        INSERT INTO memory_events (user_id, memory_id, event_type, occurred_at)
        SELECT user_id, memory_id, 'completed_canceled', $3
        FROM target
        WHERE target.completed_at IS NOT NULL
        RETURNING id
      )
      ${pinnedSelectFromUpdatedPin}
      `,
      [input.userId, input.pinnedMemoryId, input.occurredAt],
    )) as PinnedMemoryRow[];

    return rows[0] ? mapPinnedMemory(rows[0]) : null;
  }

  async replacePinnedMemory(input: ReplacePinnedMemoryInput) {
    const rows = (await this.getSql().query(
      `
      WITH target AS (
        SELECT
          pinned_memories.id,
          pinned_memories.user_id,
          pinned_memories.memory_id AS old_memory_id,
          pinned_memories.position,
          memories.category_id
        FROM pinned_memories
        INNER JOIN memories ON memories.id = pinned_memories.memory_id
        WHERE pinned_memories.id = $2
          AND pinned_memories.user_id = $1
        LIMIT 1
      ),
      candidate AS (
        SELECT memories.id AS memory_id
        FROM memories
        INNER JOIN target ON target.category_id = memories.category_id
        WHERE memories.user_id = $1
          AND NOT EXISTS (
            SELECT 1
            FROM pinned_memories
            WHERE pinned_memories.user_id = $1
              AND pinned_memories.memory_id = memories.id
          )
        ORDER BY COALESCE(memories.last_done_at, memories.created_at), memories.created_at
        LIMIT 1
      ),
      updated_pin AS (
        UPDATE pinned_memories
        SET
          memory_id = candidate.memory_id,
          pinned_at = $3,
          last_shown_at = $3,
          visible_until = $4,
          completed_at = NULL,
          completed_cleanup_at = NULL,
          updated_at = $3
        FROM target, candidate
        WHERE pinned_memories.id = target.id
        RETURNING pinned_memories.*
      ),
      updated_memory AS (
        UPDATE memories
        SET
          last_pinned_at = $3,
          updated_at = $3
        FROM updated_pin
        WHERE memories.id = updated_pin.memory_id
        RETURNING memories.id
      ),
      replaced_event AS (
        INSERT INTO memory_events (user_id, memory_id, event_type, occurred_at)
        SELECT user_id, old_memory_id, 'replaced', $3
        FROM target
        WHERE EXISTS (SELECT 1 FROM updated_pin)
        RETURNING id
      ),
      pinned_event AS (
        INSERT INTO memory_events (user_id, memory_id, event_type, occurred_at)
        SELECT user_id, memory_id, 'pinned', $3
        FROM updated_pin
        RETURNING id
      )
      ${pinnedSelectFromUpdatedPin}
      `,
      [input.userId, input.pinnedMemoryId, input.occurredAt, input.visibleUntil],
    )) as PinnedMemoryRow[];

    return rows[0] ? mapPinnedMemory(rows[0]) : null;
  }

}

const pinnedSelectFromUpdatedPin = `
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
