# Architecture

This document describes the high-level module architecture for Arctic Aria.
Technology choices and repository layout are documented in
[implementation.md](implementation.md).

## Module Overview

```text
Arctic Aria
|-- Product features
|   |-- Auth
|   |-- Settings
|   |-- Projects
|   |-- Routines
|   |-- Memories
|   |-- Dashboard
|   |-- Ideas
|   |-- Scheduler
|   `-- Reviews
|
|-- App surfaces
|   |-- Web app
|   |-- Discord integration hosted by the web app
|   `-- CLI tooling
|
`-- Infrastructure services
    |-- Database
    |-- Cron scheduler
    |-- Future cache
    |-- Future dataflow
    `-- Future background jobs
```

Product features own user-visible rules and state transitions. App surfaces let
the user operate the same system through web or Discord. Infrastructure
services provide storage now and can later provide cache, dataflow, scheduling,
and external adapters.

Currently implemented product features are Auth, Settings, Projects, Routines,
Memories, Dashboard, Ideas, administrator Performance diagnostics, and the
feature-level scheduling needed for Today and Discord notifications. The
Discord integration is hosted by the Next.js web app and supports account
binding, `/idea` capture, outbound test messages, routine reminders, and Daily
Review delivery. Cloudflare provides the current cron trigger. Product-level
Scheduler and Reviews are still not separate first-class modules; Redis/cache,
dataflow, and broader background jobs remain planned directions.

Documentation follows the same shape:

- `docs/features/<feature>/`: feature overview, data model, UI behavior, and
  implementation notes.
- `docs/apps/`: app-surface notes such as CLI tooling.
- `docs/web/`: shared web UI component rules.
- `docs/web/ui.md`: shared UI terminology and UI documentation index.
- `docs/infrastructure/`: cron scheduling, database, migrations, Redis
  planning, and technical service direction. Current infrastructure is Neon
  PostgreSQL plus a Cloudflare cron worker; Redis/cache and event dataflow are
  future directions.
- `docs/features/discord/`: Discord integration behavior implemented by the
  web app.

## Product Features

Product features are the source of truth for user-visible entities, commands,
validation, and status changes. They should be deterministic, testable, and
usable from more than one app surface.

### Auth

Auth owns registration, login, session persistence, logout, credential
security, and future OAuth. The current MVP uses username and password auth.

Detailed docs:

- [features/auth/overview.md](features/auth/overview.md)
- [features/auth/data-model.md](features/auth/data-model.md)
- [features/auth/ui.md](features/auth/ui.md)
- [features/auth/web-implementation.md](features/auth/web-implementation.md)

### Settings

Settings owns user-facing preferences and profile configuration such as
timezone, day boundary, display name editing, and future settings-page
behavior. Auth still owns credential update commands, such as changing a
password, because those commands must enforce auth security rules.

Detailed docs:

- [features/settings/overview.md](features/settings/overview.md)

### Performance

Performance owns administrator-only diagnostics that measure the live app
without exposing secrets or writing benchmark data into product tables. It is a
developer support feature, not a normal user workflow.

Detailed docs:

- [features/performance/overview.md](features/performance/overview.md)
- [features/performance/latency-benchmark.md](features/performance/latency-benchmark.md)
- [features/performance/tab-switch-loading-benchmark.md](features/performance/tab-switch-loading-benchmark.md)

### Projects

Projects are long-running personal initiatives. A project may contain
milestones and milestone tasks.

The first model uses three conceptual levels:

- Project: long-running objective, description, start date, optional deadline
  or expected duration, and grouped milestones.
- Milestone: phase boundary inside a project.
- Task: executable schedulable work item.

Future assisted project breakdown belongs to the Projects feature or Scheduler.
It is not infrastructure by itself. Infrastructure may later run the background
job that performs the analysis, but Projects owns the resulting project,
milestone, and task rules.

Detailed docs:

- [features/projects/overview.md](features/projects/overview.md)
- [features/projects/data-model.md](features/projects/data-model.md)
- [features/projects/ui.md](features/projects/ui.md)
- [features/projects/web-implementation.md](features/projects/web-implementation.md)

### Routines

Routines represent repeated daily-life work such as exercise, sleep
preparation, review, or recurring chores. A routine is not a project and does
not use the project hierarchy.

Detailed docs:

- [features/routines/overview.md](features/routines/overview.md)
- [features/routines/data-model.md](features/routines/data-model.md)
- [features/routines/ui.md](features/routines/ui.md)
- [features/routines/web-implementation.md](features/routines/web-implementation.md)

### Memories

Memories store repeatable personal experiences that the user may want to
revisit, such as cuisine, sightseeing, anime, games, books, or shops. Memories
are suggestions and personal records, not commitments, so they should not become
overdue like tasks or routines.

Detailed docs:

- [features/memories/overview.md](features/memories/overview.md)
- [features/memories/data-model.md](features/memories/data-model.md)
- [features/memories/ui.md](features/memories/ui.md)
- [features/memories/web-implementation.md](features/memories/web-implementation.md)

### Dashboard

The dashboard is the daily operating surface. It combines selected data from
Projects, Routines, Memories, and future Reviews, but it should not redefine
those feature rules.

Detailed docs:

- [features/dashboard/ui.md](features/dashboard/ui.md)
- [features/dashboard/web-implementation.md](features/dashboard/web-implementation.md)

### Ideas

Ideas store quick thoughts before they become projects, tasks, routines,
memories, or review notes.

The Ideas feature owns:

- quick capture records
- source information, such as web, Discord, or mobile
- triage state
- conversion into a project, task, routine, memory, or review note

Ideas persistence, web add/edit/delete management, and Discord `/idea` capture
are implemented. User-facing triage and conversion controls are planned but not
implemented yet.

Detailed docs:

- [features/ideas/overview.md](features/ideas/overview.md)
- [features/ideas/data-model.md](features/ideas/data-model.md)
- [features/ideas/ui.md](features/ideas/ui.md)
- [features/ideas/web-implementation.md](features/ideas/web-implementation.md)

### Scheduler

The scheduler selects tasks and routines for upcoming time windows and returns
data for daily planning and reminders. It should produce commands or jobs for
app surfaces instead of owning the app UI itself.

The scheduler owns:

- selecting candidate tasks and routines
- checking deadlines and remaining work
- producing timetable data for coming days
- creating reminder jobs
- handling retry and quiet-period rules

Feature-level scheduling exists today for Today project-task selections,
routine instances, routine reminders, and Daily Review delivery. A unified
product-level Scheduler module is planned but not implemented yet.

### Reviews

Reviews manage feedback and reflection.

The Reviews feature owns:

- daily reviews
- weekly and monthly review summaries
- completion history
- progress summaries
- adjustment suggestions

Daily Review summary generation and Discord delivery are implemented as part of
the Dashboard and Discord notification flow. A broader first-class Reviews
feature with persisted review workflows is planned but not implemented yet.

## App Surfaces

App surfaces are responsible for user interaction, not product rule ownership.

### Web App

The web app is the primary surface. It should focus on desktop first while
remaining usable on iPhone Chrome.

It owns:

- authenticated app shell layout
- sidebar navigation
- theme mode and root page background
- dashboard layout
- project and task management UI
- routine management UI
- memory management UI
- review UI

Detailed docs:

- [web/theme.md](web/theme.md)
- [web/sidebar.md](web/sidebar.md)
- [web/sidebar-ui.md](web/sidebar-ui.md)

### Discord Integration

The Discord integration is for notification and quick interaction. It is
important because the user may forget to open the web app.

Implemented Discord workflows are account binding with `/bind`, quick idea
capture with `/idea`, and outbound direct-message delivery through an internal
server-side service. The Discord integration should call product commands
instead of owning product rules directly.

It may eventually own:

- pushed reminders
- daily scheduler messages
- reminder buttons
- review prompts
- concise status updates

The Discord integration should call product commands. It should not implement
its own planning or routine rules.

Detailed docs:

- [features/discord/overview.md](features/discord/overview.md)

### CLI Tooling

CLI tooling is reserved for local developer workflows and future remote import
commands. It should not own product rules; it should call feature parsers or
protected APIs.

Detailed docs:

- [apps/cli/overview.md](apps/cli/overview.md)

## Infrastructure Services

Infrastructure services support product features and app surfaces. They own
technical mechanisms, not product decisions.

Infrastructure owns:

- database persistence, migrations, indexes, and transaction support
- cron trigger configuration and protected scheduled-route invocation
- future cache support, likely Redis, when repeated read paths or ephemeral
  coordination need it
- future event publishing, subscribing, retries, and delivery tracking
- future richer background execution for reminders, scheduled review work, and
  notification delivery when simple cron invocation is not enough
- external service adapters

Product features define entities, commands, validations, and domain events.
Infrastructure stores those entities now. Future infrastructure may move events
between modules when reminder, review, or cache flows need it.

For the current version, Neon PostgreSQL and a Cloudflare cron worker are
implemented. Redis/cache, event/dataflow, queues, and richer background workers
are future infrastructure directions. They still belong in infrastructure
because product features should not depend directly on a specific storage
engine, queue, scheduler, or notification transport.

Detailed docs:

- [infrastructure/cron.md](infrastructure/cron.md)
- [infrastructure/database.md](infrastructure/database.md)
- [infrastructure/redis.md](infrastructure/redis.md)
