# Database

This document describes the first database direction for Arctic Aria. The
database belongs to infrastructure. Product entities and rules are defined in
[features/overview.md](../features/overview.md); the database stores them
durably.

Do not commit database files, local dumps, or secrets. Database schema files are
safe to commit.

## First Choice

Use PostgreSQL as the main database.

Reasons:

- It can store relational product data cleanly.
- It supports `jsonb` for flexible plugin metadata and agent outputs.
- It can later support vector search through an extension if retrieval becomes
  important.
- It avoids moving from a temporary database to a production database too early
  in the project.

SQLite can still be useful for throwaway local experiments, but it should not be
the main design target. If a local SQLite file is created during experiments, it
must be gitignored.

## Current Provider

The current web app uses Neon PostgreSQL for auth, projects, routines,
memories, and dashboard-backed feature data.

Local connection strings belong in untracked files such as
`apps/web/.env.local` or `apps/web/.env.development.local`. Do not commit Neon
URLs, passwords, dumps, or generated local database files.

Use `NEON_POSTGRES_URL` as the single database URL environment variable for the
web app and migration runner.

Schema migration files are safe to commit. The current migration entry point is
`apps/web/scripts/migrate.mjs`, exposed as `pnpm db:migrate` from `apps/web`.
From the repository root, run the same migration entry point with
`pnpm --dir apps/web db:migrate`.

The Projects feature requires `0005_create_projects.sql` and the cleanup
`0006_drop_project_subtasks.sql`. If project server actions report missing
`projects`, `project_milestones`, or `project_tasks` tables, treat the database
as not migrated and run the web database migration before manual testing.

## Operational Notes

Record database operation details here when they are known. Do not commit
connection strings, passwords, Neon project ids, Vercel project ids, or other
secret or account-identifying values.

Provider facts to record:

- database provider: Neon
- database engine: PostgreSQL
- database region, when confirmed
- backend hosting provider and backend region, when confirmed
- whether the app uses Neon pooled or direct connections
- migration command used for the active environment

Latency facts to record:

- backend-to-database latency, because every server action depends on this path
- frontend-to-backend latency, because the user experiences this before any
  database work can start
- full user action latency for important flows, such as login, adding a project,
  checking a dashboard task, or refreshing memory suggestions

Use concrete measurements instead of guesses. Prefer dated measurements with a
small table:

```text
Date | Environment | Region path | Operation | p50 | p95 | Notes
```

Example operation labels:

- `backend -> database: SELECT 1`
- `backend -> database: login lookup`
- `frontend -> backend: login action`
- `frontend -> backend -> database: add project`

Database size facts to record:

- current Neon storage used
- plan storage limit, only after checking the active Neon plan
- largest tables by size
- approximate row counts for important tables
- date when the numbers were measured

Do not hard-code Neon pricing, storage quotas, or performance claims unless
they were checked for the active plan and include a date. If those values are
important for release planning, record them as measured operational notes, not
as product rules.

## Integrity And Validation

The database is the final consistency boundary for product data.

Use the layers this way:

- Frontend validation helps the user correct input early.
- Backend validation owns trusted field-level checks and user-facing messages.
- Database constraints protect consistency when requests race, clients bypass
  the UI, or backend code has a bug.

Database schema should enforce cross-row and cross-command safety where
practical:

- Use foreign keys for ownership and references.
- Use unique constraints for values that must be unique, such as username or a
  future per-user unique key.
- Use check constraints for simple allowed values, status sets, positive
  numbers, and date ordering.
- Use transactions when one command must update several related rows together.

Do not rely on a `SELECT` before `INSERT` as the only protection for uniqueness
or references. The backend may pre-check to produce a nicer message, but a
database constraint must still protect concurrent inserts or updates when the
data rule requires uniqueness.

For user-visible parent-child data, prefer archive or soft-delete commands.
When a feature supports hard delete, the default behavior should refuse deleting
a non-empty parent. Use cascade delete only when the feature explicitly
documents that cleanup behavior, such as account-level removal of all owned
data.

Backend actions should catch known constraint failures and translate them into
clear messages. Examples:

- duplicate unique value
- referenced parent not found
- deleting a parent that still has children
- invalid status or date range rejected by a check constraint

## Feature Data Models

Feature data-model docs are the source of truth for product tables, fields,
constraints, backend validation, delete behavior, and concurrency rules.
Do not duplicate feature schemas in this infrastructure document.

Current feature data-model docs:

- Auth: [auth/data-model.md](../features/auth/data-model.md)
- Projects: [projects/data-model.md](../features/projects/data-model.md)
- Routines: [routines/data-model.md](../features/routines/data-model.md)
- Memories: [memories/data-model.md](../features/memories/data-model.md)

Planned feature data-model docs should be added under their owning feature
folder before implementation starts, for example Settings, Ideas, Scheduler,
Reviews, Discord account binding, and future plugins.

## Future Persistence Areas

The first implemented database scope is auth, projects, routines, memories, and
dashboard-backed feature data.

Future persistence areas may include:

- user settings, such as timezone and day boundary
- Discord account bindings
- daily plans and daily reviews
- reminder jobs and delivery attempts
- plugin registrations and plugin run records
- internal plugin context and retrieval data

Each future area should get an owning feature or app data-model doc before its
tables are added.

## Future Cache And Dataflow

There is no event-bus implementation or standalone event-bus document yet.
Redis is a likely future cache or lightweight coordination direction, but it
should not be added until a concrete read-performance, session, queue, or
reminder-delivery need appears.
