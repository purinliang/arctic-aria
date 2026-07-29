# Implementation

This document is the implementation overview for Arctic Aria. It records where
the code lives and which docs own the detailed rules.

Product responsibilities are documented in [architecture.md](architecture.md).
Feature behavior is documented under [features/](features/). Persistence,
credential, and data-protection policy are documented in
[infrastructure/database.md](infrastructure/database.md).

## Current Scope

The implemented runtime apps are the Next.js web app in `apps/web` and the
Cloudflare cron scheduler in `apps/cron`. Discord is implemented as HTTP routes
inside the web app, not as a separate process. Database migrations live under
`apps/database` and are run by the web app migration script. `apps/cli` exists
as a reserved developer surface for future local workflows; it has no active
runtime commands yet.

Use this file as a code map. Current product status and future requirements
belong in [README.md](../README.md), [roadmap.md](roadmap.md), and feature
overview docs.

## Technology Snapshot

Web app:

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- `lucide-react` for icons

Cron scheduler:

- Cloudflare Workers Cron Triggers
- small Worker app that invokes protected web cron routes
- no direct database or Discord credentials

Backend inside the web app:

- Next.js server actions
- feature-local services and repositories
- direct SQL repository adapters
- shared database connection helper

Verification:

- Node's built-in test runner through `pnpm test`
- ESLint through `pnpm lint`
- Next.js production build through `pnpm build`
- migration runner through `pnpm database:migrate`

## Repository Shape

The repository is intentionally smaller than the future target. There is no
root `package.json`, no root `pnpm-workspace.yaml`, and no shared package
workspace yet.

```text
arctic-aria/
|-- apps/
|   |-- cli/
|   |   `-- package.json
|   |
|   |-- cron/
|   |   |-- src/
|   |   |   `-- index.js
|   |   |-- package.json
|   |   `-- wrangler.jsonc
|   |
|   |-- database/
|   |   |-- migrations/
|   |   `-- scripts/
|   `-- web/
|       |-- AGENTS.md
|       |-- scripts/
|       |   |-- measure-routes.mjs
|       |   |-- measure-switches.mjs
|       |   |-- read-app-metadata.mjs
|       |   |-- run-ngrok.mjs
|       |   `-- run-database-migrations.mjs
|       |-- src/
|       |   |-- app/
|       |   |-- app-shell/
|       |   |-- components/
|       |   |   `-- forms/
|       |   |-- features/
|       |   |   |-- auth/
|       |   |   |-- dashboard/
|       |   |   |-- discord/
|       |   |   |-- ideas/
|       |   |   |-- memories/
|       |   |   |-- performance/
|       |   |   |-- projects/
|       |   |   |-- routines/
|       |   |   |-- events/
|       |   |   `-- settings/
|       |   `-- server/
|       |       |-- database/
|       |       `-- discord/
|       |-- package.json
|       `-- pnpm-workspace.yaml
|
|-- docs/
|   |-- apps/
|   |   `-- cli/
|   |-- features/
|   |   `-- discord/
|   |-- infrastructure/
|   |-- releases/
|   |-- web/
|   |-- architecture.md
|   |-- implementation.md
|   |-- roadmap.md
|   `-- user-story.md
|
|-- README.md
`-- AGENTS.md
```

## Web Code Organization

`apps/web/src/app` owns Next.js route entry points, global CSS, layout, and the
404 page. The authenticated workspace uses route-backed pages so browser
refresh and direct entry keep the selected surface instead of always returning
to Today:

- `/` and `/today` show Today
- `/projects` shows the Projects list
- `/projects/<project-id>` shows one Project detail page
- `/routines` shows Routines
- `/events` shows Events
- `/memories` shows Memories
- `/ideas` shows Ideas
- `/settings` shows Settings

Do not add `/project?id=<id>` routing. Project detail routing should use the
path segment form above.

Workspace path refresh support is implemented with rewrites in
`apps/web/next.config.ts`. `/today`, `/projects`, `/projects/<project-id>`,
`/routines`, `/events`, `/memories`, `/ideas`, and `/settings` rewrite to the static `/`
app page. This avoids separate route files and avoids making the workspace a
dynamic catch-all route.

Inside the authenticated workspace, navigation uses the browser History API
instead of `next/navigation` router pushes. This preserves refresh-safe paths
without fetching a new Next route payload for normal sidebar/page clicks.
Browser back and forward should update the app shell from `popstate`.

`apps/web/src/app-shell` owns the authenticated web shell:

- sidebar navigation
- route-synced active page switching
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
business rules for projects, routines, events, or memories.

`apps/web/src/server/database` owns shared database connection helpers. Feature
repositories should import the database client; UI components should not.

`apps/cli` currently owns only package metadata and ignored local data
placeholders. There are no active CLI import commands, parsers, or web import
endpoints.

## Implementation References

Current feature implementation docs:

- [features/auth/web-implementation.md](features/auth/web-implementation.md)
- [features/dashboard/web-implementation.md](features/dashboard/web-implementation.md)
- [features/performance/overview.md](features/performance/overview.md)
- [features/performance/latency-benchmark.md](features/performance/latency-benchmark.md)
- [features/performance/tab-switch-loading-benchmark.md](features/performance/tab-switch-loading-benchmark.md)
- [features/memories/web-implementation.md](features/memories/web-implementation.md)
- [features/projects/web-implementation.md](features/projects/web-implementation.md)
- [features/routines/web-implementation.md](features/routines/web-implementation.md)
- [features/events/web-implementation.md](features/events/web-implementation.md)
- [features/ideas/web-implementation.md](features/ideas/web-implementation.md)

Current feature data-model docs:

- [features/auth/data-model.md](features/auth/data-model.md)
- [features/settings/data-model.md](features/settings/data-model.md)
- [features/memories/data-model.md](features/memories/data-model.md)
- [features/projects/data-model.md](features/projects/data-model.md)
- [features/routines/data-model.md](features/routines/data-model.md)
- [features/events/data-model.md](features/events/data-model.md)
- [features/ideas/data-model.md](features/ideas/data-model.md)

Integration docs:

- [features/discord/overview.md](features/discord/overview.md)

App-surface docs:

- [apps/cli/overview.md](apps/cli/overview.md)

Shared web docs:

- [web/ui.md](web/ui.md)
- [web/ui-components.md](web/ui-components.md)
- [web/sidebar.md](web/sidebar.md)
- [web/sidebar-ui.md](web/sidebar-ui.md)
- [web/theme.md](web/theme.md)
- [web/color.md](web/color.md)
- [web/localization.md](web/localization.md)

Infrastructure docs:

- [infrastructure/cron.md](infrastructure/cron.md)
- [infrastructure/database.md](infrastructure/database.md)
- [infrastructure/environment.md](infrastructure/environment.md)
- [infrastructure/redis.md](infrastructure/redis.md)

Documentation-only diagnostics:

- [implementation-audit.md](implementation-audit.md)

## Current Entry Points

Auth entry points:

- `apps/web/src/features/auth/components/AuthGate.tsx`
- `apps/web/src/features/auth/actions.ts`
- `apps/web/src/features/auth/server`

App shell entry points:

- `apps/web/src/app-shell/AppShell.tsx`
- `apps/web/src/app-shell/Sidebar.tsx`
- `apps/web/src/app-shell/app-routes.ts`

Feature page and panel entry points:

- `apps/web/src/features/dashboard/components/Dashboard.tsx`
- `apps/web/src/features/projects/components/ProjectsPage.tsx`
- `apps/web/src/features/projects/components/ProjectDetailPage.tsx`
- `apps/web/src/features/routines/components/RoutinesPage.tsx`
- `apps/web/src/features/routines/components/RoutinesPanel.tsx`
- `apps/web/src/features/events/components/EventsPage.tsx`
- `apps/web/src/features/events/components/EventsPanel.tsx`
- `apps/web/src/features/memories/components/MemoriesPage.tsx`
- `apps/web/src/features/memories/components/PinnedMemoriesPanel.tsx`
- `apps/web/src/features/ideas/components/IdeasPage.tsx`

Persistence entry points:

- `apps/web/src/server/database/neon.ts`
- `apps/database/migrations`
- `apps/database/scripts`
- `apps/web/scripts/run-database-migrations.mjs`
- `apps/web/src/features/<feature>/server`

Cron entry points:

- `apps/cron/src/index.js`
- `apps/cron/wrangler.jsonc`
- `apps/web/src/app/api/cron/discord-notifications/route.ts`
- `apps/web/src/app/api/cron/routine-reminders/route.ts`

## Future Extraction Direction

Keep the current single web app structure until another implemented surface
needs shared code.

Add shared packages only when they remove real duplication:

- `packages/contracts` when the Discord integration needs shared
  command and payload types
- `packages/core` when product services must be shared outside Next.js server
  actions
- `packages/database` only if database access becomes shared by multiple apps or
  workers
- `packages/ui` only if another web surface needs the same component library

Detailed future product and infrastructure direction belongs in
[roadmap.md](roadmap.md), [architecture.md](architecture.md), and the relevant
feature or infrastructure docs.

## Verification Commands

Run from `apps/web`:

```bash
pnpm test
pnpm lint
pnpm build
pnpm database:migrate
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
- When to extract shared packages for the Discord integration or background
  workers.
