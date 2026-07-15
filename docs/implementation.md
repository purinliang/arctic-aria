# Implementation

This document is the implementation overview for Arctic Aria. It records what is
implemented, where the code lives, which docs own the detailed rules, and which
technical directions are still planned.

Product responsibilities are documented in [architecture.md](architecture.md).
Feature behavior is documented under [features/](features/). Persistence,
credential, and data-protection policy are documented in
[infrastructure/database.md](infrastructure/database.md).

## Current Status

The only implemented app is the Next.js web app in `apps/web`.

Implemented:

- username/password auth with signed 30-day session cookies
- authenticated app shell with sidebar, theme, page title bar, and shared
  notification stack
- Dashboard panels for project tasks, routines, and pinned memories
- Projects, Milestones, and Tasks
- Routines and routine instances
- Memories, categories, suggestions, and pinned memories
- shared web UI primitives and form controls
- SQL migrations and direct SQL repositories
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

## Technology Snapshot

Web app:

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- `lucide-react` for icons

Backend inside the web app:

- Next.js server actions
- feature-local services and repositories
- direct SQL repository adapters
- shared database connection helper

Verification:

- Node's built-in test runner through `pnpm test`
- ESLint through `pnpm lint`
- Next.js production build through `pnpm build`
- migration runner through `pnpm db:migrate`

## Repository Shape

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

## Web Code Organization

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

## Implementation References

Current feature implementation docs:

- [features/auth/web-implementation.md](features/auth/web-implementation.md)
- [features/dashboard/web-implementation.md](features/dashboard/web-implementation.md)
- [features/memories/web-implementation.md](features/memories/web-implementation.md)
- [features/projects/web-implementation.md](features/projects/web-implementation.md)
- [features/routines/web-implementation.md](features/routines/web-implementation.md)

Current feature data-model docs:

- [features/auth/data-model.md](features/auth/data-model.md)
- [features/memories/data-model.md](features/memories/data-model.md)
- [features/projects/data-model.md](features/projects/data-model.md)
- [features/routines/data-model.md](features/routines/data-model.md)

Shared web docs:

- [ui.md](ui.md)
- [web/ui-components.md](web/ui-components.md)
- [web/sidebar.md](web/sidebar.md)
- [web/sidebar-ui.md](web/sidebar-ui.md)
- [web/theme.md](web/theme.md)

Infrastructure docs:

- [infrastructure/database.md](infrastructure/database.md)
- [infrastructure/redis.md](infrastructure/redis.md)

## Current Entry Points

Auth entry points:

- `apps/web/src/features/auth/components/AuthGate.tsx`
- `apps/web/src/features/auth/actions.ts`
- `apps/web/src/features/auth/server`

App shell entry points:

- `apps/web/src/app-shell/AppShell.tsx`
- `apps/web/src/app-shell/Sidebar.tsx`

Feature page and panel entry points:

- `apps/web/src/features/dashboard/components/Dashboard.tsx`
- `apps/web/src/features/projects/components/ProjectsPage.tsx`
- `apps/web/src/features/projects/components/ProjectDetailPage.tsx`
- `apps/web/src/features/routines/components/RoutinesPage.tsx`
- `apps/web/src/features/routines/components/RoutinesPanel.tsx`
- `apps/web/src/features/memories/components/MemoriesPage.tsx`
- `apps/web/src/features/memories/components/PinnedMemoriesPanel.tsx`

Persistence entry points:

- `apps/web/src/server/database/neon.ts`
- `apps/web/database/migrations`
- `apps/web/scripts/migrate.mjs`
- `apps/web/src/features/<feature>/server`

## Future Direction

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

Planned infrastructure:

- Redis for cache, rate limiting, idempotency keys, or short-lived coordination
  after a measured need appears
- background jobs for reminders, plugin work, and notification delivery
- event/dataflow support after reminder, review, and plugin flows become clear
- deployment environment management

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
