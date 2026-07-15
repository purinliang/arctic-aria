# Implementation

This document records the current Arctic Aria implementation and the intended
technical direction. Product ownership is documented in
[architecture.md](architecture.md). Feature behavior is documented under
[features/](features/).

## Current Status

The only implemented app is the Next.js web app in `apps/web`.

Implemented:

- username/password auth
- signed 30-day auth session cookie
- authenticated app shell with sidebar, theme, page title bar, and shared
  notification stack
- database-backed dashboard panels
- database-backed Projects, Milestones, and Tasks
- database-backed Routines and routine instances
- database-backed Memories, categories, suggestions, and pinned memories
- shared web UI primitives and form controls
- Neon PostgreSQL migrations and direct SQL repositories
- focused Node test coverage for validation, services, repositories, database
  helpers, and selected action helpers

Not implemented yet:

- Discord bot
- Redis/cache
- event bus or dataflow service
- background worker service
- user settings page
- ideas feature
- reviews feature
- reward plugin
- English coach or other plugin workers
- OAuth, password reset, account deletion, or server-side session revocation

Planned-but-not-implemented requirements should stay in their owning docs, such
as [user-story.md](user-story.md), [roadmap.md](roadmap.md), and feature
overview files. Do not delete future requirements only because the current web
slice has not implemented them yet.

## Current Technology

Web app:

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- `lucide-react` for icons

Backend inside the web app:

- Next.js server actions
- direct SQL through `@neondatabase/serverless`
- repository/service modules under each feature
- shared Neon database client in `apps/web/src/server/database`

Auth and security:

- `bcryptjs` for password hashing
- signed HTTP-only session cookie
- `AUTH_SESSION_SECRET` for production session signing
- `NEON_POSTGRES_URL` as the single web database URL variable

Verification:

- Node's built-in test runner through `pnpm test`
- ESLint through `pnpm lint`
- Next.js production build through `pnpm build`
- migration runner through `pnpm db:migrate`

## Current Repository Structure

The repository is intentionally smaller than the future target. There is no
root `package.json`, no root `pnpm-workspace.yaml`, and no shared package
workspace yet.

```text
arctic-aria/
|-- apps/
|   `-- web/
|       |-- AGENTS.md
|       |-- database/
|       |   `-- migrations/
|       |-- scripts/
|       |   `-- migrate.mjs
|       |-- src/
|       |   |-- app/
|       |   |-- app-shell/
|       |   |-- components/
|       |   |   `-- forms/
|       |   |-- features/
|       |   |   |-- auth/
|       |   |   |-- dashboard/
|       |   |   |-- memories/
|       |   |   |-- projects/
|       |   |   `-- routines/
|       |   `-- server/
|       |       `-- database/
|       |-- package.json
|       `-- pnpm-workspace.yaml
|
|-- docs/
|   |-- apps/
|   |-- features/
|   |-- infrastructure/
|   |-- web/
|   |-- architecture.md
|   |-- implementation.md
|   |-- roadmap.md
|   |-- ui.md
|   `-- user-story.md
|
|-- README.md
`-- AGENTS.md
```

## Current Web Code Organization

`apps/web/src/app` owns Next.js route entry points, global CSS, layout, and the
404 page.

`apps/web/src/app-shell` owns the authenticated web shell:

- sidebar navigation
- active page switching
- page title bar
- theme mode and document background syncing
- app-level notification stack
- high-level data wiring for authenticated feature panels

The app shell is not a generic domain-state module. Put state there only when it
belongs to the whole authenticated web surface.

`apps/web/src/components` owns shared UI primitives:

- button
- card
- panel
- dialog
- list
- notification
- text styles
- colors and theme helpers

`apps/web/src/components/forms` owns shared form controls:

- single-line text and password fields
- multiline text area
- date picker
- time picker
- number field
- selection controls
- checkbox and choice-group style helpers

Feature code lives under `apps/web/src/features/<feature>`.

Feature folders own:

- feature pages
- feature panels used by the dashboard
- feature rows and dialogs
- server actions
- validation helpers
- services
- repository interfaces and adapters
- focused tests

Dashboard composition can import feature-owned panels, but it should not own the
business rules for projects, routines, or memories.

`apps/web/src/server/database` owns shared database connection helpers. Feature
repositories should import the database client; UI components should not.

## Data And Persistence

Persistence policy lives in [infrastructure/database.md](infrastructure/database.md).
Feature schemas and constraints live in each feature `data-model.md`. This file
only records the implementation entry points.

Current database entry points:

- shared Neon client: `apps/web/src/server/database/neon.ts`
- migration directory: `apps/web/database/migrations`
- migration runner: `apps/web/scripts/migrate.mjs`
- feature repositories: `apps/web/src/features/<feature>/server`

Run migrations from `apps/web`:

```bash
pnpm db:migrate
```

From the repository root:

```bash
pnpm --dir apps/web db:migrate
```

The migration runner and web app read `NEON_POSTGRES_URL`. Local `.env*` files
must stay untracked.

## Delete And Archive Strategy

Delete and archive rules are documented in
[infrastructure/database.md](infrastructure/database.md) and the owning feature
`data-model.md`. Do not add a new delete command without updating those docs.

## Credential And Data Protection

Credential and product-data protection rules are documented in
[infrastructure/database.md](infrastructure/database.md) and
[features/auth/data-model.md](features/auth/data-model.md). Implementation
entry points are `apps/web/src/features/auth/server/password.ts` and
`apps/web/src/features/auth/server/session.ts`.

## Infrastructure Direction

Implemented infrastructure:

- Neon PostgreSQL
- SQL migration runner

Planned infrastructure:

- Redis for cache, rate limiting, idempotency keys, or short-lived coordination
  after a measured need appears
- background jobs for reminders, plugin work, and notification delivery
- event/dataflow support after reminder, review, and plugin flows become clear
- deployment environment management

Redis planning is documented in [infrastructure/redis.md](infrastructure/redis.md).
Redis must not become the source of truth for product data. The backend should
remain stateless across requests; Redis may hold rebuildable ephemeral state.

## Future Repository Direction

Keep the current single web app structure until another implemented surface
needs shared code.

Add shared packages only when they remove real duplication:

- `packages/contracts` when the Discord bot or plugins need shared command and
  payload types
- `packages/core` when product services must be shared outside Next.js server
  actions
- `packages/database` only if database access becomes shared by multiple apps or
  workers
- `packages/ui` only if another web surface needs the same component library

The Discord bot should likely use TypeScript and `discord.js` because it will
share command contracts with the web app. Python remains a good fit for future
plugin workers that need agent workflows, retrieval, document processing,
speech practice, or ML/data tooling.

## Verification Commands

Run from `apps/web`:

```bash
pnpm test
pnpm lint
pnpm build
pnpm db:migrate
pnpm dev
```

For documentation-only changes, run at least:

```bash
git diff --check
```

## Open Decisions

- Whether to keep direct SQL long term or move some persistence to Prisma or
  Drizzle.
- Whether auth sessions should remain signed cookies or move to a server-side
  sessions table.
- Which deployment target should own the web backend, environment variables,
  and future background jobs.
- Which Redis provider to use if measured latency, rate limiting, or reminder
  coordination requires Redis.
- Whether future sensitive user content needs application-level field
  encryption.
- When to extract shared packages for the Discord bot, plugins, or background
  workers.
