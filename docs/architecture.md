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
|-- Plugin workers
|   |-- Reward system
|   |-- English coach
|   |-- Future research coach
|   `-- Future life planners
|
|-- App surfaces
|   |-- Web app
|   `-- Discord bot
|
`-- Infrastructure services
    |-- Database
    |-- Future cache
    |-- Future dataflow
    `-- Future background jobs
```

Product features own user-visible rules and state transitions. Plugin workers
add optional specialized workflows. App surfaces let the user operate the same
system through web or Discord. Infrastructure services provide storage now and
can later provide cache, dataflow, scheduling, and external adapters.

Currently implemented product features are Auth, Settings, Projects, Routines,
Memories, and Dashboard. Ideas, Scheduler, Reviews, Discord bot, plugin
workers, Redis/cache, dataflow, and background jobs are planned directions.

Documentation follows the same shape:

- `docs/features/<feature>/`: feature overview, data model, UI behavior, and
  implementation notes.
- `docs/web/`: shared web UI component rules.
- `docs/ui.md`: shared UI terminology and UI documentation index.
- `docs/infrastructure/`: database, migrations, Redis planning, and technical
  service direction. Current infrastructure is Neon PostgreSQL; Redis/cache and
  event dataflow are future directions.
- `docs/apps/`: app-specific notes such as Discord bot behavior.

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

### Projects

Projects are long-running personal initiatives. A project may contain
milestones and milestone tasks.

The first model uses three conceptual levels:

- Project: long-running objective, description, start date, optional deadline
  or expected duration, and grouped milestones.
- Milestone: phase boundary inside a project.
- Task: executable schedulable work item.

Future AI-assisted project breakdown belongs to the Projects feature, Scheduler,
or a future planner assistant. It is not infrastructure by itself. Infrastructure
may later run the background job that performs the analysis, but Projects owns
the resulting project, milestone, and task rules.

Detailed docs:

- [features/projects/overview.md](features/projects/overview.md)
- [features/projects/data-model.md](features/projects/data-model.md)
- [features/projects/ui.md](features/projects/ui.md)
- [features/projects/web-implementation.md](features/projects/web-implementation.md)

### Routines

Routines represent repeated daily-life work such as exercise, sleep
preparation, English practice, review, or recurring chores. A routine is not a
project and does not use the project hierarchy.

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
Projects, Routines, Memories, Reviews, and future reward features, but it should
not redefine those feature rules.

Detailed docs:

- [features/dashboard/ui.md](features/dashboard/ui.md)
- [features/dashboard/web-implementation.md](features/dashboard/web-implementation.md)

### Ideas

Ideas store quick thoughts before they become projects, tasks, routines, or
plugin inputs.

The Ideas feature owns:

- quick capture records
- source information, such as web, Discord, or mobile
- triage state
- conversion into a project, task, routine, idea record, or plugin request

Ideas is planned but not implemented yet.

Detailed docs:

- [features/ideas/overview.md](features/ideas/overview.md)
- [features/ideas/data-model.md](features/ideas/data-model.md)
- [features/ideas/ui.md](features/ideas/ui.md)

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

Scheduler is planned but not implemented yet.

### Reviews

Reviews manage feedback and reflection.

The Reviews feature owns:

- daily reviews
- weekly and monthly review summaries
- completion history
- progress summaries
- adjustment suggestions
- hooks that allow the reward plugin to grant rewards

Reviews is planned but not implemented yet.

## Plugin Workers

Plugin workers add specialized behavior without owning normal product state
directly. They should read product context through approved APIs and submit
proposed actions back through validated commands.

Plugin workers are a long-term direction. They are not expected during the
current refactor, schema, documentation, and bug-fix phase.

### Reward System

The reward system is a plugin because it is optional positive feedback, not
required for the planner model.

It owns:

- money, boxes, gems, flowers, and inventory items
- reward rules based on completion and review results
- box opening logic
- optional game-like progress

The reward plugin should listen to review or completion events rather than
being embedded in project or routine logic.

### English Coach

The English coach is a plugin because it has specialized agent behavior,
conversation, correction, speaking practice, and learning memory.

It owns:

- daily topic suggestions
- chat-style practice
- mistake correction
- daily learning review
- learning memory and retrieval context

It may create tasks or routines, but those actions must go through product
commands.

### Future Planners

Future planners can include cooking, shopping, sightseeing, anime
recommendation, research support, or other specialized workflows. Saved personal
experiences belong to Memories; new external recommendations belong in plugins
until the feature shape is proven.

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
- reward and plugin screens

Detailed docs:

- [web/theme.md](web/theme.md)
- [web/sidebar.md](web/sidebar.md)
- [web/sidebar-ui.md](web/sidebar-ui.md)

### Discord Bot

The Discord bot is for notification and quick interaction. It is important
because the user may forget to open the web app.

The first Discord workflow is quick idea capture with `/idea`. The bot should
call Ideas commands instead of writing product tables directly.

It may eventually own:

- quick capture
- pushed reminders
- daily scheduler messages
- reminder buttons
- review prompts
- concise status updates

The Discord bot should call product commands. It should not implement its own
planning or routine rules.

Detailed docs:

- [apps/discord-bot/overview.md](apps/discord-bot/overview.md)

## Infrastructure Services

Infrastructure services support product features, plugin workers, and app
surfaces. They own technical mechanisms, not product decisions.

Infrastructure owns:

- database persistence, migrations, indexes, and transaction support
- future cache support, likely Redis, when repeated read paths or ephemeral
  coordination need it
- future event publishing, subscribing, retries, and delivery tracking
- future background execution for reminders, scheduled review work, plugin
  runs, and notification delivery
- external service adapters

Product features define entities, commands, validations, and domain events.
Infrastructure stores those entities now. Future infrastructure may move events
between modules when reminder, review, plugin, or cache flows need it.

For the first version, only Neon PostgreSQL is implemented. Redis/cache,
event/dataflow, queues, and background workers are future infrastructure
directions. They still belong in infrastructure because product features should
not depend directly on a specific storage engine, queue, or notification
transport.

Detailed docs:

- [infrastructure/database.md](infrastructure/database.md)
- [infrastructure/redis.md](infrastructure/redis.md)

## Data Flow

Typical daily flow:

```text
User input
  -> app surface
  -> product command
  -> validated state change
  -> infrastructure persistence
  -> scheduler or review update
  -> future plugin or dataflow hook
  -> app notification or dashboard update
```

Example reminder flow:

```text
Scheduler
  -> reminder job
  -> Discord delivery
  -> user button response
  -> product routine/task command
  -> infrastructure persistence
  -> completion event recorded
  -> review update
  -> optional future reward flow
```

Example English coach flow:

```text
Web app
  -> English coach plugin session
  -> plugin context lookup
  -> learning response and correction
  -> learning memory saved
  -> optional task/routine suggestion through product command
```
