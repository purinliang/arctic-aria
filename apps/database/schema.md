# Current Database Schema

This is a human-readable schema snapshot after
`0026_create_routine_groups.sql`.

Source of truth:

- Migration files in `apps/database/migrations/` are authoritative.
- Applied database state is tracked by `schema_migrations` and
  `schema_migration_runs`.
- If this document conflicts with migration history or the live database, trust
  the migrations and fix this document.

Purpose:

- Make the current schema easier to review than reading every historical
  migration.
- Summarize current tables, lifecycle behavior, ownership, important
  constraints, and indexes.
- Avoid replacing feature `data-model.md` docs, which still own product rules
  and validation details.

## Auth And Settings

### `users`

Arctic Aria account table.

Columns:

- `id uuid PRIMARY KEY`
- `username text NOT NULL UNIQUE`
- `password_hash text NOT NULL`
- `display_name text NOT NULL`
- `is_admin boolean NOT NULL DEFAULT false`
- `created_at timestamptz NOT NULL`
- `updated_at timestamptz NOT NULL`

Important constraints:

- username length: 4-16 characters
- username allowed characters: visible ASCII
- display name length: 1-24 characters
- normal accounts are not administrators by default

### `user_settings`

One settings row per user.

Columns:

- `user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE`
- `theme_preference text NOT NULL DEFAULT 'system'`
- `language_preference text NOT NULL DEFAULT 'en'`
- `time_format_preference text NOT NULL DEFAULT '12h'`
- `timezone_preference text NOT NULL DEFAULT 'system'`
- `resolved_timezone text`
- `multiple_timezones_enabled boolean NOT NULL DEFAULT false`
- `created_at timestamptz NOT NULL`
- `updated_at timestamptz NOT NULL`

Important constraints:

- theme preference: `system`, `light`, `dark`
- language preference: `system`, `en`, `zh-CN`
- time format preference: `12h`, `24h`
- timezone preference: `system` or a trimmed non-empty value up to 64
  characters
- resolved timezone: null or a trimmed concrete IANA timezone value up to 64
  characters; never `system`

## Memories

### `memory_categories`

Per-user categories for memories. Built-in categories are stored as normal rows
with stable built-in metadata.

Columns:

- `id uuid PRIMARY KEY`
- `user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE`
- `name text NOT NULL`
- `description text`
- `built_in_key text`
- `icon_name text NOT NULL DEFAULT 'bookmark'`
- `shown_on_dashboard boolean NOT NULL DEFAULT false`
- `created_at timestamptz NOT NULL`
- `updated_at timestamptz NOT NULL`

Important constraints:

- name length: 1-40 characters
- description length: at most 500 characters
- unique category name per user
- built-in key is null or one of `cuisine`, `sightseeing`, `movie`, `anime`,
  `book`, `music`, `game`, `shopping`
- unique built-in key per user when present

### `memories`

Canonical memory records. Memory delete is currently a hard delete.

Columns:

- `id uuid PRIMARY KEY`
- `user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE`
- `category_id uuid NOT NULL REFERENCES memory_categories(id) ON DELETE RESTRICT`
- `title text NOT NULL`
- `description text`
- `last_done_at timestamptz`
- `done_count integer NOT NULL DEFAULT 0`
- `last_pinned_at timestamptz`
- `last_ignored_at timestamptz`
- `created_at timestamptz NOT NULL`
- `updated_at timestamptz NOT NULL`

Important constraints:

- title length: 1-120 characters
- description length: at most 2000 characters
- done count is non-negative

Indexes:

- `(user_id, category_id, created_at DESC)`

### `memory_events`

Append-style event history for memory actions.

Columns:

- `id uuid PRIMARY KEY`
- `user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE`
- `memory_id uuid NOT NULL REFERENCES memories(id) ON DELETE CASCADE`
- `event_type text NOT NULL`
- `occurred_at timestamptz NOT NULL`

Important constraints:

- event type: `pinned`, `unpinned`, `ignored`, `completed`,
  `completed_canceled`, `replaced`, `deleted`

Indexes:

- `(user_id, memory_id, occurred_at DESC)`

### `pinned_memories`

Today shortlist rows for memories. The canonical memory row remains separate.

Columns:

- `id uuid PRIMARY KEY`
- `user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE`
- `memory_id uuid NOT NULL REFERENCES memories(id) ON DELETE CASCADE`
- `position integer NOT NULL`
- `pinned_at timestamptz NOT NULL`
- `last_shown_at timestamptz NOT NULL`
- `visible_until timestamptz NOT NULL`
- `completed_at timestamptz`
- `completed_cleanup_at timestamptz`
- `created_at timestamptz NOT NULL`
- `updated_at timestamptz NOT NULL`

Important constraints:

- position is positive
- cleanup time is null or after completion time
- one pinned row per user and memory

Indexes:

- `(user_id, position)`

## Routines

### `routines`

Routine definitions. Routine delete is a soft delete through `deleted_at`.

Columns:

- `id uuid PRIMARY KEY`
- `user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE`
- `group_id uuid REFERENCES routine_groups(id) ON DELETE SET NULL`
- `title text NOT NULL`
- `description text`
- `start_date date NOT NULL`
- `end_date date`
- `estimated_duration_minutes integer`
- `created_at timestamptz NOT NULL`
- `updated_at timestamptz NOT NULL`
- `deleted_at timestamptz`

Important constraints:

- title length: 1-120 characters
- description length: at most 2000 characters
- end date is null or not before start date
- estimated duration is null or 1-1440 minutes

Indexes:

- `(user_id, start_date)` where `deleted_at IS NULL`
- `(user_id, group_id, start_date)` where `deleted_at IS NULL`

### `routine_groups`

Optional user-owned groups for organizing routines. Routine groups are soft
deleted through `deleted_at`.

Columns:

- `id uuid PRIMARY KEY`
- `user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE`
- `name text NOT NULL`
- `description text`
- `created_at timestamptz NOT NULL`
- `updated_at timestamptz NOT NULL`
- `deleted_at timestamptz`

Important constraints:

- name length: 1-80 characters
- description length: at most 500 characters
- active group names are unique per user case-insensitively

Indexes:

- unique `(user_id, lower(name))` where `deleted_at IS NULL`
- `(user_id, name)` where `deleted_at IS NULL`

### `routine_rules`

One recurrence rule per routine.

Columns:

- `id uuid PRIMARY KEY`
- `routine_id uuid NOT NULL REFERENCES routines(id) ON DELETE CASCADE`
- `rule_type text NOT NULL`
- `interval_value integer`
- `weekdays jsonb`
- `day_of_month integer`
- `preferred_time time`
- `timezone text NOT NULL DEFAULT 'UTC'`
- `created_at timestamptz NOT NULL`
- `updated_at timestamptz NOT NULL`

Important constraints:

- rule type: `once`, `daily`, `weekly`, `bi_weekly`, `monthly_by_date`,
  `day_interval`
- interval value is null or positive
- day of month is null or 1-31
- one rule per routine

### `routine_instances`

Concrete generated routine occurrences. Completed instances remain visible on
Today for the current scheduled date.

Columns:

- `id uuid PRIMARY KEY`
- `user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE`
- `routine_id uuid NOT NULL REFERENCES routines(id) ON DELETE CASCADE`
- `scheduled_date date NOT NULL`
- `scheduled_time time`
- `remind_at timestamptz`
- `reminded_at timestamptz`
- `moved_at timestamptz`
- `moved_from_date date`
- `status text NOT NULL DEFAULT 'pending'`
- `completed_at timestamptz`
- `skipped_at timestamptz`
- `created_at timestamptz NOT NULL`
- `updated_at timestamptz NOT NULL`

Important constraints:

- status: `pending`, `completed`, `skipped`
- one instance per routine/date/time combination
- `moved_from_date` requires `moved_at`

Indexes:

- unique `(routine_id, scheduled_date, COALESCE(scheduled_time, time '00:00'))`
- `(user_id, scheduled_date, scheduled_time)`
- `(remind_at)` where status is `pending`, `remind_at` is set, and
  `reminded_at` is null

### `completion_events`

Append-style event history for completed or reopened work.

Columns:

- `id uuid PRIMARY KEY`
- `user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE`
- `target_type text NOT NULL`
- `target_id uuid NOT NULL`
- `event_type text NOT NULL`
- `previous_completed_weight numeric(8, 3)`
- `new_completed_weight numeric(8, 3)`
- `occurred_at timestamptz NOT NULL`
- `source text NOT NULL DEFAULT 'web'`

Important constraints:

- target type: `task`, `routine_instance`
- event type: `completed`, `partially_completed`, `skipped`, `reopened`,
  `blocked`, `unblocked`

Indexes:

- `(user_id, target_type, target_id, occurred_at DESC)`

## Projects

### `projects`

Top-level project records. Project delete is a soft delete through
`deleted_at`.

Columns:

- `id uuid PRIMARY KEY`
- `user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE`
- `title text NOT NULL`
- `objective text`
- `start_date date NOT NULL`
- `deadline_date date`
- `expected_duration_days integer`
- `sidebar_pin_order integer`
- `created_at timestamptz NOT NULL`
- `updated_at timestamptz NOT NULL`
- `completed_at timestamptz`
- `deleted_at timestamptz`

Important constraints:

- title length: 1-120 characters
- objective length: at most 500 characters
- expected duration is null or positive
- deadline date is null or not before start date
- sidebar pin order is null or 1-3
- deleted projects cannot remain sidebar-pinned
- unique sidebar pin order per user when present

Indexes:

- `(user_id, start_date DESC, created_at DESC)` where `deleted_at IS NULL`
- unique `(user_id, sidebar_pin_order)` where sidebar pin order is not null

### `project_milestones`

Optional lightweight phase boundaries under projects. Milestone delete is a
soft delete through `deleted_at`.

Columns:

- `id uuid PRIMARY KEY`
- `user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE`
- `project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE`
- `title text NOT NULL`
- `objective text`
- `sort_order integer NOT NULL DEFAULT 0`
- `start_date date`
- `deadline_date date`
- `expected_duration_days integer`
- `created_at timestamptz NOT NULL`
- `updated_at timestamptz NOT NULL`
- `completed_at timestamptz`
- `deleted_at timestamptz`

Important constraints:

- title length: 1-120 characters
- objective length: at most 500 characters
- expected duration is null or positive
- deadline date is null or not before start date

Indexes:

- `(project_id, sort_order, created_at)` where `deleted_at IS NULL`

### `project_tasks`

Project task records. Task delete is a soft delete through `deleted_at`.

Columns:

- `id uuid PRIMARY KEY`
- `user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE`
- `project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE`
- `milestone_id uuid REFERENCES project_milestones(id) ON DELETE SET NULL`
- `title text NOT NULL`
- `description text`
- `start_date date`
- `deadline_date date`
- `estimated_duration_minutes integer`
- `sort_order integer NOT NULL DEFAULT 0`
- `created_at timestamptz NOT NULL`
- `updated_at timestamptz NOT NULL`
- `completed_at timestamptz`
- `deleted_at timestamptz`

Important constraints:

- title length: 1-120 characters
- description length: at most 2000 characters
- deadline date is null or not before start date
- estimated duration is null or 1-1440 minutes

Indexes:

- `(user_id, deadline_date, start_date, updated_at DESC)` where
  `deleted_at IS NULL AND completed_at IS NULL`
- `(milestone_id, sort_order, created_at)` where `deleted_at IS NULL`

### `project_task_daily_selections`

Stable Today board selections for project tasks. Task completion remains on
`project_tasks.completed_at`; Today visibility remains on this table.

Columns:

- `id uuid PRIMARY KEY`
- `user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE`
- `task_id uuid NOT NULL REFERENCES project_tasks(id) ON DELETE CASCADE`
- `scheduled_date date NOT NULL`
- `source text NOT NULL DEFAULT 'scheduler'`
- `created_at timestamptz NOT NULL`
- `moved_at timestamptz`
- `moved_from_date date`

Important constraints:

- source: `manual`, `scheduler`
- `moved_from_date` requires `moved_at`
- one selection per user, task, and scheduled date

Indexes:

- unique `(user_id, task_id, scheduled_date)`
- `(user_id, scheduled_date, created_at)`

## Ideas

### `ideas`

Captured idea inbox. Idea archive is represented by `triage_status` plus
`archived_at`.

Columns:

- `id uuid PRIMARY KEY`
- `user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE`
- `raw_text text NOT NULL`
- `source text NOT NULL`
- `triage_status text NOT NULL DEFAULT 'untriaged'`
- `source_metadata jsonb NOT NULL DEFAULT '{}'::jsonb`
- `converted_target_type text`
- `converted_target_id uuid`
- `created_at timestamptz NOT NULL`
- `updated_at timestamptz NOT NULL`
- `archived_at timestamptz`

Important constraints:

- trimmed raw text length: 1-2000 characters
- source: `web`, `discord`, `mobile`, `agent`
- triage status: `untriaged`, `kept`, `converted`, `archived`
- converted target type is null or one of `project`, `task`, `routine`,
  `memory`, `plugin_request`
- converted target type and id must both be null or both be present
- archived status and `archived_at` must agree

Indexes:

- `(user_id, created_at DESC)` where `archived_at IS NULL`

## Discord

### `discord_accounts`

Arctic Aria user to Discord account binding.

Columns:

- `id uuid PRIMARY KEY`
- `user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE`
- `discord_user_id text NOT NULL`
- `discord_username text`
- `dm_channel_id text`
- `binding_status text NOT NULL DEFAULT 'active'`
- `last_interaction_at timestamptz`
- `created_at timestamptz NOT NULL`
- `updated_at timestamptz NOT NULL`
- `revoked_at timestamptz`

Important constraints:

- one Discord account row per Arctic Aria user
- active Discord user ids are unique
- Discord ids are numeric strings, 5-32 characters
- binding status: `active`, `revoked`
- revoked status and `revoked_at` must agree

Indexes:

- unique `(discord_user_id)` where `binding_status = 'active'`

### `discord_binding_codes`

Temporary code records used to bind Discord to an Arctic Aria account.

Columns:

- `id uuid PRIMARY KEY`
- `user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE`
- `code_hash text NOT NULL UNIQUE`
- `expires_at timestamptz NOT NULL`
- `consumed_at timestamptz`
- `created_at timestamptz NOT NULL`

Important constraints:

- code hash is a 64-character lowercase hex SHA-256 value
- expiry is after creation

Indexes:

- `(code_hash)` where `consumed_at IS NULL`
- `(user_id, created_at DESC)` where `consumed_at IS NULL`

### `discord_message_deliveries`

Outbound Discord delivery audit and idempotency table. Raw message content is
not stored; only a content hash is stored.

Columns:

- `id uuid PRIMARY KEY`
- `user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE`
- `discord_account_id uuid REFERENCES discord_accounts(id)`
- `idempotency_key text NOT NULL`
- `content_hash text NOT NULL`
- `source text NOT NULL`
- `metadata jsonb NOT NULL DEFAULT '{}'::jsonb`
- `delivery_status text NOT NULL DEFAULT 'pending'`
- `discord_message_id text`
- `error_code text`
- `created_at timestamptz NOT NULL`
- `sent_at timestamptz`
- `failed_at timestamptz`

Important constraints:

- idempotency key length: 1-160 characters after trim
- content hash is a 64-character lowercase hex SHA-256 value
- source: `web`, `scheduler`, `manual`, `agent`
- delivery status: `pending`, `sent`, `failed`, `skipped`
- terminal status must match `sent_at` or `failed_at`
- Discord message id is null or a numeric string, 5-32 characters
- error code length: at most 80 characters
- unique `(user_id, idempotency_key)`

Indexes:

- `(user_id, created_at DESC)`
- `(delivery_status, created_at)`

## Migration Metadata

### `schema_migrations`

Applied migration history and per-file checksum table.

Columns:

- `name text PRIMARY KEY`
- `checksum text`
- `app_version text`
- `app_commit text`
- `app_source_state text`
- `applied_at timestamptz NOT NULL`

### `schema_migration_runs`

Audit rows for every migration runner attempt after metadata tables are
available.

Columns:

- `id bigserial PRIMARY KEY`
- `checked_at timestamptz NOT NULL`
- `finished_at timestamptz`
- `status text NOT NULL DEFAULT 'success'`
- `app_version text NOT NULL`
- `app_commit text NOT NULL`
- `app_source_state text NOT NULL`
- `expected_migration_count integer`
- `expected_latest_migration text`
- `expected_schema_hash text`
- `actual_migration_count integer`
- `actual_latest_migration text`
- `actual_schema_hash text`
- `applied_count integer NOT NULL DEFAULT 0`
- `skipped_count integer NOT NULL DEFAULT 0`
- `failure_stage text`
- `failure_message text`
- `failed_migration_name text`

Important constraints:

- status: `running`, `success`, `failed`
