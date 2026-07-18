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
- It supports `jsonb` for flexible metadata when a feature genuinely needs it.
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

Environment variable ownership and Vercel Neon variable mapping are documented
in [environment.md](environment.md).

Schema migration files are safe to commit. The current migration entry point is
`apps/web/scripts/migrate.mjs`, exposed as `pnpm db:migrate` from `apps/web`.
From the repository root, run the same migration entry point with
`pnpm --dir apps/web db:migrate`.

Migration files live in `apps/infrastructure/database/migrations` because the
database schema is shared infrastructure, not part of the web UI surface.

`schema_migrations` records each newly applied migration, a SHA-256 checksum of
that migration file, and the app metadata that was active when it ran: app
version, commit hash, and source state.
`schema_migration_runs` records migration-run checks, including successful
runs, failed runs, and runs where all migrations were already applied. A run is
inserted with `status = 'running'` after the metadata tables are ready, then
updated to `success` or `failed`. Successful and failed rows record the expected
migration count, latest migration id, expected schema hash, actual migration
count, actual latest migration id, actual schema hash, applied count, and
skipped count. Failed rows also record a safe failure stage, a shortened failure
message, and the migration file name when a specific migration was active.

If the database URL is missing, the database connection fails, or the metadata
tables cannot be created, the runner may be unable to write a failed run row
because there is no reliable table to write to yet. These failures still return
a non-zero process exit code.

Use these audit rows before production releases so the deployed
frontend/backend version can be compared with the database migration state. The
migration runner reads `APP_VERSION`, `APP_COMMIT`, and `APP_SOURCE_STATE` when
present, falls back to Vercel commit metadata when available, and finally falls
back to local Git metadata during development.

The user-facing app version is controlled automatically:

- release builds should use Git release tags, such as `v0.5.0`
- `develop` builds derive labels such as `v0.5.0-dev`
- feature and fix branches derive labels such as
  `v0.5.0-fix-app-metadata-display`
- non-release branch builds append the commit hash in the UI; exact release
  tags do not

If production cannot access Git tags, set `APP_VERSION` during the deployment
build. Do not manually set the generated `NEXT_PUBLIC_*` metadata variables
unless debugging the build system; `next.config.ts` generates them from Git,
Vercel metadata, and the local migration files at build time.

The expected database version is derived automatically from committed migration
files. Each migration file has its own checksum. The displayed database version
is a compact schema-history hash derived from the ordered sequence of
`filename + file checksum` values. That whole-history hash changes when a
migration is added, removed, reordered, or edited.

Before applying missing migrations or recording a successful final status, the
migration runner reads `schema_migrations` and verifies that the database
history is a valid prefix of the current source tree:

- If the database contains an applied migration that this source tree does not
  know about, the runner refuses to continue because the database is ahead.
- If an applied migration name appears in a different order, the runner refuses
  to continue because the histories differ.
- If an applied migration checksum differs from the local file checksum, the
  runner refuses to continue because migration drift was detected.
- Legacy rows that predate checksum tracking can be backfilled only when their
  names match the current migration history prefix.

The actual database version shown in the app comes from the applied migration
table, not from the commit that last ran `pnpm db:migrate`. App commit metadata
is audit context only. User-facing UI shows the app version and the compact
database schema-history hash, with a short red message when the database schema
is behind, ahead, different, missing checksums, or unavailable.

The Projects feature requires `0005_create_projects.sql` and the cleanup
`0006_drop_project_subtasks.sql`. If project server actions report missing
`projects`, `project_milestones`, or `project_tasks` tables, treat the database
as not migrated and run the web database migration before manual testing.

## Vercel CD And Migration Flow

Do not treat frontend/backend deployment and database migration as the same
operation. Code can deploy automatically, but database changes should be tested
against a non-production branch before production.

Current deployment setup:

- Hosting and CD provider: Vercel.
- Database provider: Neon PostgreSQL.
- Vercel project root: `apps/web`.
- Current Vercel build command:

  ```bash
  pnpm db:migrate && pnpm build
  ```

- Production branch: `main`.
- Production deploys from `main` use the Vercel Production
  `NEON_POSTGRES_URL`, which points at the Neon `main` database branch.
- Preview deploys from other Git branches, including `develop`, use the Vercel
  Preview `NEON_POSTGRES_URL`, which points at the Neon `preview/develop`
  database branch unless a branch-specific preview database is configured.
- Local development uses `apps/web/.env.local` and should point at
  `preview/develop` or another non-production Neon branch.

This is currently Vercel-managed CD. It is not a separate GitHub Actions
pipeline. If the Vercel build command runs tests and lint before migration, it
also provides a basic deployment validation gate.

Recommended Vercel build command:

```bash
pnpm test && pnpm lint && pnpm build && pnpm db:migrate
```

This order keeps the production database unchanged when tests, lint, or the
Next.js build fail. It is safer than migrating first and then discovering that
the app cannot build. The remaining risk is that a migration can succeed and a
later Vercel deployment step can still fail before the deployment is promoted.
Because of that, production migrations must remain backward-compatible.

The current command `pnpm db:migrate && pnpm build` still exits non-zero when
migration fails, so Vercel will stop the deployment on migration errors. When
the metadata tables are available, the failed run is recorded with
`status = 'failed'`. However, this command can migrate the database before a
build failure is discovered.

If accidental production migration is a concern, do not use an unguarded
production build command that starts with `pnpm db:migrate`. Use one of these
safer modes:

- Preferred Vercel-only mode: run `pnpm test`, `pnpm lint`, and `pnpm build`
  before `pnpm db:migrate`. This prevents app validation failures from touching
  the production database.
- Stricter production mode: keep Preview migrations automatic, but run
  Production migrations manually from the exact release commit before or during
  the release checklist.
- Future protected mode: move Production migration into a protected GitHub
  Actions environment or a dedicated deployment step with manual approval.

The project should not add fake no-op schema migrations just to test the Vercel
pipeline. Use `schema_migration_runs` to confirm whether Vercel ran the
migration command.

Current branch split:

- Local development: `apps/web/.env.local` should point to the Neon
  `preview/develop` branch or another non-production branch.
- Vercel Preview for `develop`: use the Neon `preview/develop` branch through
  Preview-scoped `NEON_POSTGRES_URL`.
- Vercel Production: use the Neon `main` branch through Production-scoped
  `NEON_POSTGRES_URL`.

Expected local/preview test flow:

1. Point `NEON_POSTGRES_URL` at the preview database branch.
2. Start the app or run a small database-backed action. If the branch has not
   been migrated, missing-table or database-version errors are expected.
3. Run `pnpm --dir apps/web db:migrate` against the preview branch.
4. Run `pnpm --dir apps/web test`, `pnpm --dir apps/web lint`, and
   `pnpm --dir apps/web build` when validating a release candidate.
5. Manually test the web app against the preview branch.

Production migration is now part of the Vercel deploy command for `main`.
Before relying on that path, confirm the Vercel Production environment contains
the production `NEON_POSTGRES_URL` and that Preview/Development environments do
not point at the production database.

To test the migration step without adding a fake schema change, inspect
`schema_migration_runs` after a Vercel deployment. The migration runner records
a run row even when all migrations were already applied and `applied_count` is
zero. Failed runs should appear with `status = 'failed'` unless the failure
happened before the metadata table was usable.

A future GitHub Actions workflow can replace the Vercel-only deployment path if
the project needs manual approval, richer release gates, or stricter
test-build-migrate-deploy ordering.

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
- Every environment, including local development, must set an explicit
  `AUTH_SESSION_SECRET`. The app does not use the database URL or a default
  string as a session secret fallback.

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
- Settings: [settings/data-model.md](../features/settings/data-model.md)
- Projects: [projects/data-model.md](../features/projects/data-model.md)
- Routines: [routines/data-model.md](../features/routines/data-model.md)
- Memories: [memories/data-model.md](../features/memories/data-model.md)
- Ideas: [ideas/data-model.md](../features/ideas/data-model.md)

Planned feature data-model docs should be added under their owning feature
folder before implementation starts, for example Scheduler, Reviews, and
Discord account binding.

## Future Persistence Areas

The first implemented database scope is auth, projects, routines, memories, and
dashboard-backed feature data.

Future persistence areas may include:

- user settings, such as timezone and day boundary
- Discord account bindings, documented by the Discord integration until a
  broader account-linking feature exists
- daily plans and daily reviews
- reminder jobs and delivery attempts

Each future area should get an owning feature or app data-model doc before its
tables are added.

## Future Cache And Dataflow

There is no event-bus implementation or standalone event-bus document yet.
Redis is a likely future cache or lightweight coordination direction, but it
should not be added until a concrete read-performance, session, queue, or
reminder-delivery need appears. Planned Redis rules are documented in
[redis.md](redis.md).
