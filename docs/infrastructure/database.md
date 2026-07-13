# Database

This document describes the first database direction for Arctic Aria. The
database belongs to the Infrastructure layer. Core entities and rules are
defined in [core-model.md](../core-model.md); the database stores them durably.

Do not commit database files, local dumps, or secrets. Database schema files are
safe to commit.

## First Choice

Use PostgreSQL as the main database.

Reasons:

- It can store relational Core data cleanly.
- It supports `jsonb` for flexible plugin metadata and agent outputs.
- It can later support vector search through an extension if retrieval becomes
  important.
- It avoids moving from a temporary database to a production database too early
  in the project.

SQLite can still be useful for throwaway local experiments, but it should not be
the main design target. If a local SQLite file is created during experiments, it
must be gitignored.

## Current Prototype Provider

The current web auth prototype uses Neon PostgreSQL.

Local connection strings belong in untracked files such as
`apps/web/.env.local` or `apps/web/.env.development.local`. Do not commit Neon
URLs, passwords, dumps, or generated local database files.

Schema migration files are safe to commit. The current migration entry point is
`apps/web/scripts/migrate.mjs`, exposed as `pnpm db:migrate` from `apps/web`.

## User Model

The first version should support username and password registration and login.

Keep a user table because many records need a stable owner:

- projects
- milestones
- tasks
- routines
- ideas
- memories and pinned memories
- reminders
- daily reviews
- internal plugin context and plugin run records

Recommended first tables:

- `users`: Arctic Aria users.
- `user_settings`: personal configuration such as timezone and day boundary.
- `discord_accounts`: optional Discord binding records.

An Arctic Aria user can be bound to at most one Discord user. A Discord user
should also be bound to at most one Arctic Aria user. Enforce this with unique
constraints on both `user_id` and `discord_user_id`.

Do not add OAuth until the username and password flow is stable.

## Core Tables

The first Core schema should support the Phase 1 and Phase 2 scope:

- `projects`
- `project_milestones`
- `project_tasks`
- `project_subtasks`
- `project_task_dependencies` if dependencies are needed later
- `routines`
- `routine_rules`
- `routine_instances`
- `ideas`
- `memory_categories`
- `memories`
- `memory_events`
- `pinned_memories`
- `daily_plans`
- `daily_plan_items`
- `daily_reviews`
- `completion_events`
- `reminder_jobs`

Projects should own milestones. Milestones should own tasks. Tasks may own
subtasks, but subtasks are checklist records and are not independently
scheduled.

Task progress should be status-derived in the next project refactor:

- `status`: `todo`, `doing`, `blocked`, `skipped`, or `done`.
- subtask completion can summarize local task progress.
- task completion determines milestone and project progress.

Do not expose editable numeric progress fields in the task UI. If old prototype
columns exist from an earlier migration, treat them as temporary implementation
details until a cleanup migration removes or ignores them safely.

Task completion changes should also create immutable `completion_events` so
daily review can reason about what happened.

Detailed project and task rules are documented in
[projects/overview.md](../core-layer/projects/overview.md) and
[projects/data-model.md](../core-layer/projects/data-model.md).

## Memory Tables

Memories are Core data. They represent user-visible repeatable experiences that
can be suggested, pinned, ignored, completed, and deleted.

Recommended first tables:

- `memory_categories`: user-owned categories and suggestion base weight.
- `memories`: canonical memory records, category, title, description, summary
  timestamps, and done count.
- `memory_events`: immutable history for `pinned`, `unpinned`, `ignored`,
  `completed`, `completed_canceled`, `replaced`, and `deleted` events.
- `pinned_memories`: current dashboard shortlist with category, position,
  pin time, visible-until time, completion time, and completed cleanup time.

Keep event history separate from current state. Do not store pin, ignore, or
done timestamp arrays on `memories`; use `memory_events` for history and
denormalized summary fields on `memories` for common queries.

Detailed memory rules are documented in
[memories.md](../core-layer/memories.md).

## Routine Tables

Routines are Core data. A routine is the repeatable definition, and a routine
instance is the concrete occurrence for a specific day or time window.

Detailed routine rules are documented in
[routines.md](../core-layer/routines.md).

`routines` should store:

- user id
- title
- description
- status: active or deleted
- first start date
- optional end date, inclusive
- created and updated timestamps

`routine_rules` should store recurrence settings:

- repeat type, such as daily, weekly, bi-weekly, monthly by day of month, or
- exact day interval
- repeat interval value, such as 3 months, 6 months, 12 months, or 30 days
- day-of-month value when the rule means "each month on day X"
- reminder time or preferred check time when needed
- timezone

The end date should be optional. If it is blank, the routine continues until the
user deletes it.

`routine_instances` should store generated occurrences:

- routine id
- user id
- scheduled date or scheduled time
- status: `pending`, `completed`, or `skipped`
- completed date and time, when completed
- skipped date and time, when skipped

The Core layer should create routine instances from routine rules. This can
happen ahead of time for the next few days or lazily when the scheduler prepares
the daily plan.

## Reminder Jobs

A reminder is a delivery process, not the source routine data. The durable
record can be called a `reminder_job`.

The first database design does not need a separate `reminder_rules` table.
Routine recurrence belongs in `routines` and `routine_rules`. Reminder delivery
state belongs in `reminder_jobs`.

`reminder_jobs` should store one scheduled delivery attempt or delivery chain
for a routine instance or task:

- target type, such as routine instance or task
- target id
- scheduled time
- status, such as pending, sent, answered, snoozed, failed, or expired
- retry count
- snooze-until time
- delivery channel, such as Discord
- related message id when Discord sends or updates a message

Discord reminder messages should show three actions:

- `Done`
- `Busy`
- `Skip`

When the user clicks an action, the Discord bot should call a Core command. The
Core command updates task or routine state, records a completion or skip event,
and updates review data or future dataflow hooks.

`Busy` should not be stored as a routine status. It should update the reminder
job by snoozing or rescheduling the reminder.

## Event Storage

Intentionally left blank for now.
