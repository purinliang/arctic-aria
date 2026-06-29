# Implementation Proposal

This document proposes the first implementation direction for Arctic Aria. The
module architecture is documented in [architecture.md](architecture.md).

## Technology Direction

### Core Layer

Use TypeScript for the first Core layer implementation.

Reasons:

- The main app is Next.js, so TypeScript keeps shared types and validation close
  to the UI and backend.
- The Discord bot can also use TypeScript through `discord.js`.
- Core rules should be deterministic and testable, not hidden inside agent
  prompts.
- The system can avoid cross-language duplication for early task, routine,
  scheduler, idea, and review logic.

Python can be added later for plugin workers or agent services, but the first
Core layer should not depend on Python.

### Plugin Layer

Use Python for plugin workers when the plugin needs agent workflows, retrieval,
document processing, speech practice, or ML/data tooling.

The plugin layer should communicate with the Core layer through explicit APIs or
jobs. A plugin should not directly mutate core tables without going through a
validated command or service.

Simple plugins can still be TypeScript if they do not need Python-specific
libraries.

### Interface Layer

Use Next.js for the web dashboard.

The dashboard should be responsive and usable from desktop and iPhone Chrome. It
should be the main product surface for planning, timetable editing, task
progress, reviews, rewards, and plugin views.

Use `discord.js` for the Discord bot unless a later implementation branch finds
a concrete blocker.

Reasons:

- It keeps the interface layer in the same TypeScript workspace as the web app
  and shared contracts.
- The bot can share validation schemas, API clients, and command payload types.
- `discord.js` supports slash commands and interaction handling in Node.js.

Python Discord libraries are viable, especially if the bot becomes tightly
coupled to Python plugin workers. For this project, the bot is mostly an
interface for reminders, quick capture, buttons, and status updates, so
TypeScript is the cleaner first choice.

### Infrastructure Layer

Treat the database, event bus, migrations, and background jobs as
Infrastructure layer concerns.

The Core layer should expose commands and domain events. Infrastructure should
provide the technical implementation that persists command results, publishes
events, schedules jobs, and records delivery state.

For the first version, keep infrastructure simple:

- PostgreSQL for durable storage.
- Background jobs for reminders and plugin work when a direct request is not
  reliable enough.
- An event bus design can be added later when the event flow is clearer.

Do not introduce Kafka, RabbitMQ, Redis Streams, or a separate document database
until the project has a concrete scaling or reliability need.

## Storage Strategy

Use PostgreSQL as the system of record for Core layer data.

PostgreSQL should store:

- users and accounts
- plans, tasks, task weights, and progress
- ideas and triage state
- routines, routine rules, and routine instances
- scheduler events and notification state
- completion events and daily reviews
- plugin registrations and plugin run records

Use document-style storage for plugin memory, but do not start with a separate
document database unless the need is proven.

Recommended first approach:

- PostgreSQL relational tables for core entities.
- PostgreSQL `jsonb` columns for flexible plugin metadata, conversation
  summaries, extracted memories, and raw agent outputs.
- PostgreSQL vector extension or a later dedicated vector store for retrieval if
  the English coach or research coach needs semantic search.

This keeps deployment simpler while leaving room for document-like plugin data.
A separate document database can be added later if plugin memory becomes large,
independent, or hard to model in PostgreSQL.

## Proposed Repository Structure

```text
arctic-aria/
|-- apps/
|   |-- web/
|   |   |-- src/
|   |   |   |-- app/                 # Next.js App Router routes
|   |   |   |-- components/          # Web-only UI components
|   |   |   |-- features/            # Dashboard feature modules
|   |   |   `-- server/              # Route handlers and server actions
|   |   `-- package.json
|   |
|   `-- discord-bot/
|       |-- src/
|       |   |-- commands/            # Slash command definitions
|       |   |-- interactions/        # Button and modal handlers
|       |   |-- reminders/           # Discord reminder delivery
|       |   `-- index.ts
|       `-- package.json
|
|-- packages/
|   |-- core/
|   |   |-- src/
|   |   |   |-- plans/
|   |   |   |-- tasks/
|   |   |   |-- routines/
|   |   |   |-- ideas/
|   |   |   |-- scheduler/
|   |   |   `-- reviews/
|   |   `-- package.json
|   |
|   |-- database/
|   |   |-- migrations/
|   |   |-- src/
|   |   |   |-- schema/
|   |   |   |-- repositories/
|   |   |   `-- client.ts
|   |   `-- package.json
|   |
|   `-- contracts/
|       |-- src/
|       |   |-- api/
|       |   |-- events/
|       |   `-- schemas/
|       `-- package.json
|
|-- plugins/
|   |-- reward-system/
|   |   |-- src/
|   |   |-- pyproject.toml
|   |   `-- README.md
|   |
|   |-- english-coach/
|   |   |-- src/
|   |   |-- pyproject.toml
|   |   `-- README.md
|   |
|   `-- README.md
|
|-- docs/
|   |-- architecture.md
|   |-- core-model.md
|   |-- implementation.md
|   |-- infrastructure/
|   |   |-- database.md
|   |   `-- event-bus.md
|   |-- roadmap.md
|   `-- user-story.md
|
|-- package.json
|-- pnpm-workspace.yaml
|-- README.md
`-- AGENTS.md
```

There is no shared `packages/ui` package in the first structure. UI components
should start inside `apps/web`. A shared UI package can be added later only if
another web surface needs the same components.

Each plugin can have its own `README.md` later to describe setup, commands,
dependencies, and integration contracts.

## Implementation Boundary

The current implementation started with the smallest useful auth foundation:
username and password registration, login, bcrypt password hashing, Neon
PostgreSQL storage, and matching frontend/backend validation. Its implementation
notes are documented in
[interface-layer/web/auth-implementation.md](interface-layer/web/auth-implementation.md).

After auth, the next main product slice should implement the smallest useful
Core planning slice:

- plan and task capture
- parent-child tasks
- task weights
- complete and partial-complete events
- daily plan
- daily review
- PostgreSQL schema for those entities
- user and Discord binding schema
- routine instance and reminder job schema
- basic Next.js dashboard views for capture, plan, progress, and review

Do not implement the Discord bot, English coach, reward inventory, or sharing in
the next Core planning branch. They should be separate branches after the core
contracts are stable.

## Open Decisions

- Whether to keep direct SQL beyond the current auth prototype or move broader
  Core data access to Prisma or Drizzle.
- Whether the first deployment target should be Vercel plus managed PostgreSQL,
  a VPS, or a local Docker Compose setup.
- Whether plugin workers should run as separate services, background jobs, or
  manually triggered scripts in the first version.
- Whether retrieval should start with PostgreSQL `jsonb` and full-text search,
  PostgreSQL vector search, or a later external vector database.
- What event bus or dataflow mechanism should be used once the first reminder
  and plugin flows are clearer.
