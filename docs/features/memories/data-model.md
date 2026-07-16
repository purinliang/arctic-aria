# Memories Data Model

This document defines memory persistence, backend validation, and database
constraints. Product behavior is documented in [overview.md](overview.md), and UI
behavior is documented in [ui.md](ui.md).

## Validation And Consistency

Memories uses the shared database integrity rules from
[../../infrastructure/database.md](../../infrastructure/database.md).

Backend validation should check:

- category name is required and 1-40 characters
- category description is 500 characters or fewer
- memory title is required and 1-120 characters
- memory description is 2000 characters or fewer
- memory category belongs to the current user
- pinned memory category is supported by the dashboard when pinning into the
  dashboard shortlist
- replacement candidates are not already visible and are from the same category

Database constraints should protect:

- memory category ownership through `user_id`
- unique category name per user
- memory to category references
- category delete refusal while memories still reference it
- non-negative done count
- one pinned record per user and memory
- valid memory event types
- positive pinned-memory positions
- completed cleanup time not before completed time

Do not rely on read-before-insert checks alone for pinned memory uniqueness or
category names. Database unique constraints must protect concurrent writes, and
backend actions should translate conflicts into clean messages.

## `memory_categories`

Stores user-owned categories.

Current fields:

- `id`
- `user_id`
- `name`
- `description`
- `created_at`
- `updated_at`

Current database protection:

- `user_id` references `users.id`.
- `name` is required and 1-40 characters.
- `(user_id, name)` is unique.
- `description` is 500 characters or fewer.

Delete behavior:

- Category delete should be refused while any memory still references the
  category.
- The backend should translate that database refusal into a clear user-facing
  message.
- Empty category delete is a hard delete.

## `memories`

Stores canonical memory records.

Current fields:

- `id`
- `user_id`
- `category_id`
- `title`
- `description`
- `last_done_at`
- `done_count`
- `last_pinned_at`
- `last_ignored_at`
- `created_at`
- `updated_at`

Current database protection:

- `user_id` references `users.id`.
- `category_id` references `memory_categories.id`.
- category hard delete is restricted while memories reference it.
- `title` is required and 1-120 characters.
- `description` is 2000 characters or fewer.
- `done_count` is greater than or equal to `0`.

`done_count`, `last_done_at`, `last_pinned_at`, and `last_ignored_at` are
denormalized summary fields. The source of truth for history is
`memory_events`.

Delete behavior:

- Current memory delete is a hard delete.
- Deleting a memory removes that memory from normal views and removes related
  pinned-memory rows.
- In PostgreSQL, linked `memory_events` rows are removed by foreign-key cascade
  when their memory is hard-deleted. Therefore memory events are immutable
  history only while the memory record still exists.
- If long-term audit history for deleted memories becomes important, change
  memories to soft delete before relying on `memory_events` as permanent audit
  records.

## `memory_events`

Stores immutable history for recommendation signals and audits.

Current fields:

- `id`
- `user_id`
- `memory_id`
- `event_type`
- `occurred_at`

Current event types:

- `pinned`
- `unpinned`
- `ignored`
- `completed`
- `completed_canceled`
- `replaced`
- `deleted`

Retention behavior:

- Events are append-only during normal memory interactions.
- Events attached to a hard-deleted memory are deleted by database cascade in
  the current schema.
- The `deleted` event type is allowed by the schema, but the current PostgreSQL
  hard-delete command does not preserve a durable delete event because the
  memory row is removed.

## `pinned_memories`

Stores the current soft shortlist shown on the dashboard.

Current fields:

- `id`
- `user_id`
- `memory_id`
- `position`
- `pinned_at`
- `last_shown_at`
- `visible_until`
- `completed_at`
- `completed_cleanup_at`
- `created_at`
- `updated_at`

Current database protection:

- `user_id` references `users.id`.
- `memory_id` references `memories.id`.
- `(user_id, memory_id)` is unique.
- `position` is positive.
- `completed_cleanup_at` is null or not before `completed_at`.

The dashboard should still enforce category limits and replacement rules in the
backend service because those rules depend on current visible rows and
candidate selection.

Lifecycle behavior:

- Pinned rows are dashboard shortlist state, not the canonical memory record.
- Completing, canceling, replacing, or cleaning up pinned memories should update
  or remove pinned rows while leaving the memory record intact.
