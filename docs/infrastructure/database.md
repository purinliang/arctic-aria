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

`schema_migrations` records each applied migration and the app metadata that was
active when it ran: app version, commit hash, and source state. Use this as an
audit trail before production releases so the deployed frontend/backend can be
checked against the database migration version. The migration runner reads
`APP_VERSION`, `APP_COMMIT`, and `APP_SOURCE_STATE` when present, falls back to
Vercel commit metadata when available, and finally falls back to local Git
metadata during development.

The Projects feature requires `0005_create_projects.sql` and the cleanup
`0006_drop_project_subtasks.sql`. If project server actions report missing
`projects`, `project_milestones`, or `project_tasks` tables, treat the database
as not migrated and run the web database migration before manual testing.

## Data Lifecycle

Every feature data-model doc must state what a user-visible delete action means.
Do not assume that the word `Delete` always means a hard database delete.

Current lifecycle policy:

- Projects: deleting a project, milestone, or task archives it with
  `status = 'archived'` and `archived_at`. Archived rows stay in the database
  but are hidden from normal project, dashboard, and planning views.
- Routines: deleting a routine marks it with `status = 'deleted'`. Deleted
  routines are hidden from normal routine and dashboard views and excluded from
  future instance generation.
- Memories: deleting a memory hard-deletes the memory row. Linked pinned rows
  and event rows are removed by foreign-key cleanup.
- Memory categories: deleting a category hard-deletes it only when no memory
  references it. The database should refuse non-empty category deletion.
- Pinned memories: completing, canceling, replacing, or cleaning up a pinned
  memory updates or removes only the dashboard shortlist row. The canonical
  memory remains unless the memory itself is deleted.
- Users/accounts: user-facing account deletion is not implemented yet. Future
  account deletion needs a dedicated policy before implementation.

Default rules:

- Prefer archive or soft delete for parent-child product data that represents
  user work.
- Refuse hard deletion of a non-empty parent unless the feature explicitly
  documents cascade cleanup.
- Use hard delete for lightweight shortlist rows, empty categories, or explicit
  cleanup records when the feature doc says no long-term history is needed.
- Translate database deletion failures into clear user-facing messages, such as
  explaining that a category still contains memories.

## Credential And Data Protection

Credential data and product data have different protection rules.

Credential rules:

- Never commit database URLs, passwords, auth secrets, OAuth secrets, provider
  tokens, local dumps, or deployment credentials.
- Passwords are stored as bcrypt hashes. They are not encrypted passwords and
  cannot be decrypted back to the original password.
- Raw passwords should exist only long enough to validate and hash them during
  auth commands.
- Session cookies are signed and HTTP-only. The current session token is not
  encrypted, so its payload must remain non-sensitive.
- Production should set an explicit `AUTH_SESSION_SECRET`. The development
  fallback is only for local work.

Product data rules:

- Normal product records are stored as PostgreSQL rows that the backend can read
  as plaintext.
- Do not claim field-level encryption unless the app implements it for a
  specific field.
- If a future feature stores highly sensitive private notes, tokens, or external
  credentials, design field-level encryption or a secret manager before adding
  the table.

Provider protection:

- Neon states that its platform enforces TLS 1.2+ for data in transit, encrypts
  stored data with AES-256, and uses cloud key-management systems for encryption
  keys. Source checked: <https://neon.com/security> on 2026-07-16.
- Provider encryption protects storage media and transport paths. It does not
  replace application-level rules for secrets, password hashing, authorization,
  least privilege, or future field-level encryption.

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
reminder-delivery need appears. Planned Redis rules are documented in
[redis.md](redis.md).
