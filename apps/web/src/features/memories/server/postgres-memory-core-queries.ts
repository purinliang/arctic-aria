import type { NeonQueryFunction } from "@neondatabase/serverless";
import {
  mapCategory,
  mapMemory,
  memorySelect,
  type MemoryCategoryRow,
  type MemoryRow,
} from "./postgres-memory-mappers.ts";
import {
  getDefaultMemoryCategories,
  type CreateMemoryCategoryInput,
  type CreateMemoryInput,
  type DeleteMemoryCategoryInput,
  type DeleteMemoryInput,
  type UpdateMemoryCategoryInput,
  type UpdateMemoryInput,
} from "./memory-repository.ts";

type Sql = NeonQueryFunction<false, false>;

export async function ensureDefaultCategories(sql: Sql, userId: string) {
  for (const category of getDefaultMemoryCategories()) {
    await sql.query(
      `WITH updated_by_key AS (
         UPDATE memory_categories
         SET name = $2,
           description = $3,
           built_in_key = $4,
           icon_name = $5,
           shown_on_dashboard = $6
         WHERE user_id = $1
           AND built_in_key = $4
         RETURNING id
       ),
       inserted AS (
         INSERT INTO memory_categories (
           user_id, name, description, built_in_key, icon_name,
           shown_on_dashboard
         )
         SELECT $1, $2, $3, $4, $5, $6
         WHERE NOT EXISTS (SELECT 1 FROM updated_by_key)
         ON CONFLICT (user_id, name) DO UPDATE
         SET built_in_key = EXCLUDED.built_in_key,
           description = EXCLUDED.description,
           icon_name = EXCLUDED.icon_name,
           shown_on_dashboard = EXCLUDED.shown_on_dashboard
         RETURNING id
       )
       SELECT id FROM updated_by_key
       UNION ALL
       SELECT id FROM inserted`,
      [
        userId,
        category.name,
        category.description,
        category.builtInKey,
        category.iconName,
        category.shownOnDashboard,
      ],
    );
  }

  const rows = (await sql`
    SELECT id, user_id, name, description, built_in_key, icon_name,
      shown_on_dashboard, created_at, updated_at
    FROM memory_categories
    WHERE user_id = ${userId}
    ORDER BY name
  `) as MemoryCategoryRow[];

  return rows.map(mapCategory);
}

export async function listCategories(sql: Sql, userId: string) {
  await ensureDefaultCategories(sql, userId);

  const rows = (await sql`
    SELECT id, user_id, name, description, built_in_key, icon_name,
      shown_on_dashboard, created_at, updated_at
    FROM memory_categories
    WHERE user_id = ${userId}
    ORDER BY name
  `) as MemoryCategoryRow[];

  return rows.map(mapCategory);
}

export async function createCategory(sql: Sql, input: CreateMemoryCategoryInput) {
  const rows = (await sql`
    INSERT INTO memory_categories (
      user_id, name, description, created_at, updated_at
    )
    VALUES (
      ${input.userId}, ${input.name}, ${input.description},
      ${input.occurredAt}, ${input.occurredAt}
    )
    RETURNING id, user_id, name, description, built_in_key, icon_name,
      shown_on_dashboard, created_at, updated_at
  `) as MemoryCategoryRow[];

  return mapCategory(rows[0]);
}

export async function updateCategory(sql: Sql, input: UpdateMemoryCategoryInput) {
  const rows = (await sql`
    UPDATE memory_categories
    SET name = ${input.name},
      description = ${input.description},
      updated_at = ${input.occurredAt}
    WHERE id = ${input.categoryId}
      AND user_id = ${input.userId}
      AND built_in_key IS NULL
    RETURNING id, user_id, name, description, built_in_key, icon_name,
      shown_on_dashboard, created_at, updated_at
  `) as MemoryCategoryRow[];

  return rows[0] ? mapCategory(rows[0]) : null;
}

export async function deleteCategory(sql: Sql, input: DeleteMemoryCategoryInput) {
  const rows = (await sql`
    DELETE FROM memory_categories
    WHERE id = ${input.categoryId}
      AND user_id = ${input.userId}
      AND built_in_key IS NULL
    RETURNING id
  `) as Array<{ id: string }>;

  return rows.length > 0;
}

export async function listMemories(sql: Sql, userId: string) {
  const rows = (await sql.query(
    `${memorySelect}
     WHERE memories.user_id = $1
     ORDER BY memory_categories.name, memories.created_at DESC`,
    [userId],
  )) as MemoryRow[];

  return rows.map(mapMemory);
}

export async function createMemory(sql: Sql, input: CreateMemoryInput) {
  const rows = (await sql.query(
    `WITH inserted AS (
       INSERT INTO memories (user_id, category_id, title, description, created_at, updated_at)
       SELECT $1, memory_categories.id, $3, $4, $5, $5
       FROM memory_categories
       WHERE memory_categories.id = $2
         AND memory_categories.user_id = $1
       RETURNING id, user_id, category_id, title, description, last_done_at,
         done_count, last_pinned_at, last_ignored_at, created_at, updated_at
     )
     SELECT inserted.id, inserted.user_id, inserted.category_id,
       memory_categories.name AS category_name, inserted.title,
       memory_categories.built_in_key AS category_built_in_key,
       memory_categories.shown_on_dashboard AS category_shown_on_dashboard,
       inserted.description, inserted.last_done_at, inserted.done_count,
       inserted.last_pinned_at, inserted.last_ignored_at, inserted.created_at,
       inserted.updated_at
     FROM inserted
     INNER JOIN memory_categories ON memory_categories.id = inserted.category_id`,
    [
      input.userId,
      input.categoryId,
      input.title,
      input.description,
      input.occurredAt,
    ],
  )) as MemoryRow[];

  return rows[0] ? mapMemory(rows[0]) : null;
}

export async function updateMemory(sql: Sql, input: UpdateMemoryInput) {
  const rows = (await sql.query(
    `WITH target_category AS (
       SELECT id FROM memory_categories WHERE id = $3 AND user_id = $1
     ),
     updated AS (
       UPDATE memories
       SET category_id = target_category.id, title = $4, description = $5,
         updated_at = $6
       FROM target_category
       WHERE memories.id = $2 AND memories.user_id = $1
       RETURNING memories.id, memories.user_id, memories.category_id,
         memories.title, memories.description, memories.last_done_at,
         memories.done_count, memories.last_pinned_at, memories.last_ignored_at,
         memories.created_at, memories.updated_at
     )
     SELECT updated.id, updated.user_id, updated.category_id,
       memory_categories.name AS category_name, updated.title,
       memory_categories.built_in_key AS category_built_in_key,
       memory_categories.shown_on_dashboard AS category_shown_on_dashboard,
       updated.description, updated.last_done_at, updated.done_count,
       updated.last_pinned_at, updated.last_ignored_at, updated.created_at,
       updated.updated_at
     FROM updated
     INNER JOIN memory_categories ON memory_categories.id = updated.category_id`,
    [
      input.userId,
      input.memoryId,
      input.categoryId,
      input.title,
      input.description,
      input.occurredAt,
    ],
  )) as MemoryRow[];

  return rows[0] ? mapMemory(rows[0]) : null;
}

export async function deleteMemory(sql: Sql, input: DeleteMemoryInput) {
  const rows = (await sql`
    DELETE FROM memories
    WHERE id = ${input.memoryId}
      AND user_id = ${input.userId}
    RETURNING id
  `) as Array<{ id: string }>;

  return rows.length > 0;
}
