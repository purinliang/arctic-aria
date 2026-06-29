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

- plans
- tasks
- routines
- ideas
- reminders
- daily reviews
- plugin memory and plugin run records

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

- `plans`
- `tasks`
- `task_dependencies` if dependencies are needed later
- `routines`
- `routine_rules`
- `routine_instances`
- `ideas`
- `daily_plans`
- `daily_plan_items`
- `daily_reviews`
- `completion_events`
- `reminder_jobs`

Tasks should support parent-child relationships through `parent_task_id`.
Subtasks are tasks with a parent task.

Task progress should be based on weight:

- `weight`: total task weight, default `1`.
- `completed_weight`: completed amount, default `0`.
- `status`: `todo`, `doing`, `blocked`, `skipped`, or `done`.

Completion changes should also create immutable `completion_events` so daily
review and reward plugins can reason about what happened.

## Routine Tables

Routines are Core data. A routine is the repeatable definition, and a routine
instance is the concrete occurrence for a specific day or time window.

`routines` should store:

- user id
- title
- description
- status: active, paused, or archived
- first start date
- optional end date, inclusive
- created and updated timestamps

`routine_rules` should store recurrence settings:

- repeat type, such as daily, weekly, bi-weekly, monthly by day of month, or
  every N days
- repeat interval, such as `7` days, `14` days, or `30` days when the rule uses
  a day interval
- day-of-month value when the rule means "each month on day X"
- reminder time or preferred check time when needed
- timezone

The end date should be optional. If it is blank, the routine continues until the
user pauses or archives it.

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
