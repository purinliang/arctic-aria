import type { NeonQueryFunction } from "@neondatabase/serverless";
import {
  mapPinnedMemory,
  pinnedMemorySelect,
  pinnedSelectFromUpdatedPin,
  type PinnedMemoryRow,
} from "./postgres-memory-mappers.ts";
import type {
  CancelPinnedMemoryInput,
  CompletePinnedMemoryInput,
  IgnoreMemoryInput,
  PinMemoryInput,
  ReplacePinnedMemoryInput,
  UnpinMemoryInput,
} from "./memory-repository.ts";

type Sql = NeonQueryFunction<false, false>;

export async function pinMemory(sql: Sql, input: PinMemoryInput) {
  const rows = (await sql.query(
    `WITH target AS (
       SELECT id, user_id FROM memories WHERE id = $2 AND user_id = $1 LIMIT 1
     ),
     inserted_pin AS (
       INSERT INTO pinned_memories (
         user_id, memory_id, position, pinned_at, last_shown_at,
         visible_until, created_at, updated_at
       )
       SELECT user_id, id, $3, $4, $4, $5, $4, $4
       FROM target
       ON CONFLICT (user_id, memory_id) DO NOTHING
       RETURNING *
     ),
     updated_memory AS (
       UPDATE memories
       SET last_pinned_at = $4, updated_at = $4
       FROM inserted_pin
       WHERE memories.id = inserted_pin.memory_id
       RETURNING memories.id
     ),
     event AS (
       INSERT INTO memory_events (user_id, memory_id, event_type, occurred_at)
       SELECT user_id, memory_id, 'pinned', $4 FROM inserted_pin RETURNING id
     )
     SELECT inserted_pin.id, inserted_pin.user_id, inserted_pin.memory_id,
       memories.category_id, memory_categories.name AS category_name,
       memory_categories.built_in_key AS category_built_in_key,
       memory_categories.shown_on_dashboard AS category_shown_on_dashboard,
       memories.title, memories.description, inserted_pin.position,
       inserted_pin.pinned_at, inserted_pin.last_shown_at,
       inserted_pin.visible_until, inserted_pin.completed_at,
       inserted_pin.completed_cleanup_at, memories.last_done_at,
       memories.done_count, inserted_pin.created_at, inserted_pin.updated_at
     FROM inserted_pin
     INNER JOIN memories ON memories.id = inserted_pin.memory_id
     INNER JOIN memory_categories ON memory_categories.id = memories.category_id`,
    [
      input.userId,
      input.memoryId,
      input.position,
      input.occurredAt,
      input.visibleUntil,
    ],
  )) as PinnedMemoryRow[];

  return rows[0] ? mapPinnedMemory(rows[0]) : null;
}

export async function ignoreMemory(sql: Sql, input: IgnoreMemoryInput) {
  const rows = (await sql`
    WITH updated_memory AS (
      UPDATE memories
      SET last_ignored_at = ${input.occurredAt}, updated_at = ${input.occurredAt}
      WHERE id = ${input.memoryId}
        AND user_id = ${input.userId}
      RETURNING id, user_id
    ),
    event AS (
      INSERT INTO memory_events (user_id, memory_id, event_type, occurred_at)
      SELECT user_id, id, 'ignored', ${input.occurredAt}
      FROM updated_memory
      RETURNING id
    )
    SELECT id FROM updated_memory
  `) as Array<{ id: string }>;

  return rows.length > 0;
}

export async function unpinMemory(sql: Sql, input: UnpinMemoryInput) {
  const rows = (await sql`
    WITH deleted_pin AS (
      DELETE FROM pinned_memories
      WHERE user_id = ${input.userId}
        AND memory_id = ${input.memoryId}
      RETURNING user_id, memory_id
    ),
    event AS (
      INSERT INTO memory_events (user_id, memory_id, event_type, occurred_at)
      SELECT user_id, memory_id, 'unpinned', ${input.occurredAt}
      FROM deleted_pin
      RETURNING id
    )
    SELECT memory_id FROM deleted_pin
  `) as Array<{ memory_id: string }>;

  return rows.length > 0;
}

export async function listPinnedMemories(sql: Sql, userId: string) {
  const rows = (await sql.query(
    `${pinnedMemorySelect}
     WHERE pinned_memories.user_id = $1
     ORDER BY memory_categories.name, pinned_memories.position`,
    [userId],
  )) as PinnedMemoryRow[];

  return rows.map(mapPinnedMemory);
}

export async function completePinnedMemory(
  sql: Sql,
  input: CompletePinnedMemoryInput,
) {
  const rows = (await sql.query(
    `WITH updated_pin AS (
       UPDATE pinned_memories
       SET completed_at = $3, completed_cleanup_at = $4, updated_at = $3
       WHERE id = $2 AND user_id = $1
       RETURNING *
     ),
     updated_memory AS (
       UPDATE memories
       SET done_count = done_count + 1, last_done_at = $3, updated_at = $3
       FROM updated_pin
       WHERE memories.id = updated_pin.memory_id
       RETURNING memories.id
     ),
     event AS (
       INSERT INTO memory_events (user_id, memory_id, event_type, occurred_at)
       SELECT user_id, memory_id, 'completed', $3 FROM updated_pin RETURNING id
     )
     ${pinnedSelectFromUpdatedPin}`,
    [input.userId, input.pinnedMemoryId, input.occurredAt, input.cleanupAt],
  )) as PinnedMemoryRow[];

  return rows[0] ? mapPinnedMemory(rows[0]) : null;
}

export async function cancelPinnedMemoryDone(
  sql: Sql,
  input: CancelPinnedMemoryInput,
) {
  const rows = (await sql.query(
    `WITH target AS (
       SELECT * FROM pinned_memories WHERE id = $2 AND user_id = $1 LIMIT 1
     ),
     updated_pin AS (
       UPDATE pinned_memories
       SET completed_at = NULL, completed_cleanup_at = NULL, updated_at = $3
       FROM target
       WHERE pinned_memories.id = target.id
       RETURNING pinned_memories.*
     ),
     updated_memory AS (
       UPDATE memories
       SET done_count = greatest(done_count - 1, 0),
         last_done_at = NULL, updated_at = $3
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
     ${pinnedSelectFromUpdatedPin}`,
    [input.userId, input.pinnedMemoryId, input.occurredAt],
  )) as PinnedMemoryRow[];

  return rows[0] ? mapPinnedMemory(rows[0]) : null;
}

export async function replacePinnedMemory(
  sql: Sql,
  input: ReplacePinnedMemoryInput,
) {
  const rows = (await sql.query(
    `WITH target AS (
       SELECT pinned_memories.id, pinned_memories.user_id,
         pinned_memories.memory_id AS old_memory_id, pinned_memories.position,
         memories.category_id
       FROM pinned_memories
       INNER JOIN memories ON memories.id = pinned_memories.memory_id
       WHERE pinned_memories.id = $2 AND pinned_memories.user_id = $1
       LIMIT 1
     ),
     candidate AS (
       SELECT memories.id AS memory_id
       FROM memories
       INNER JOIN target ON target.category_id = memories.category_id
       WHERE memories.user_id = $1
         AND NOT EXISTS (
           SELECT 1 FROM pinned_memories
           WHERE pinned_memories.user_id = $1
             AND pinned_memories.memory_id = memories.id
         )
       ORDER BY COALESCE(memories.last_done_at, memories.created_at), memories.created_at
       LIMIT 1
     ),
     updated_pin AS (
       UPDATE pinned_memories
       SET memory_id = candidate.memory_id, pinned_at = $3,
         last_shown_at = $3, visible_until = $4, completed_at = NULL,
         completed_cleanup_at = NULL, updated_at = $3
       FROM target, candidate
       WHERE pinned_memories.id = target.id
       RETURNING pinned_memories.*
     ),
     updated_memory AS (
       UPDATE memories
       SET last_pinned_at = $3, updated_at = $3
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
       SELECT user_id, memory_id, 'pinned', $3 FROM updated_pin RETURNING id
     )
     ${pinnedSelectFromUpdatedPin}`,
    [input.userId, input.pinnedMemoryId, input.occurredAt, input.visibleUntil],
  )) as PinnedMemoryRow[];

  return rows[0] ? mapPinnedMemory(rows[0]) : null;
}
