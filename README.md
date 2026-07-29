# Arctic Aria

Arctic Aria is a personal life assistant for turning messy daily life into a
clear plan. It focuses on planning, tasks, routines, events, reminders, ideas, daily
review, and memories.

The project is important because the hard part is often not doing one task. The
hard part is deciding what to do next, breaking a large project into daily work,
remembering routines, collecting small ideas before they disappear, and seeing
enough progress to feel that the effort was real.

Arctic Aria is a productivity support tool. It can help clarify priorities,
suggest next steps, remind the user, and adjust planning when work is stuck. It is
not a medical, therapy, or mental health treatment product.

## What It Helps With

- Break a long-term project into milestones and tasks.
- Choose what to do today based on start dates, deadlines, progress, and the
  current daily board.
- Remember routines with reminders and quick completion checks.
- Capture ideas, possible tasks, and possible routines before they are lost.
- Revisit saved personal experiences such as cuisine, sightseeing, books, or
  shows.
- Review the day and keep enough progress context to see what changed.

## How It Works

Arctic Aria is organized around features and supporting services:

- Features: auth, settings, projects, routines, events, memories, dashboard, ideas,
  Daily Review delivery, and future broader reviews.
- Apps: web dashboard for full control, Discord integration hosted by the web
  app for quick idea capture and messages, and CLI tooling for local developer
  import workflows.
- Infrastructure: Neon PostgreSQL for persistence and a Cloudflare cron worker
  for scheduled web-route invocation, with future cache, richer background job,
  dataflow, and external service adapters added only when needed.

The web dashboard is the main workspace. The Discord integration is important
because it can reach the user when they forget to open the app.

## Project Documents

Start here:

- [docs/user-story.md](docs/user-story.md): user-facing product story,
  implemented workflows, and in-progress workflows.
- [docs/roadmap.md](docs/roadmap.md): current version focus and future work.
- [docs/architecture.md](docs/architecture.md): feature, app, and
  infrastructure responsibilities.
- [docs/implementation.md](docs/implementation.md): technology, storage, and
  current repository structure. Its Implementation References section contains
  the detailed file-level documentation map.
- [docs/implementation-audit.md](docs/implementation-audit.md):
  documentation-only known limitations and implementation risks found during
  repository inspection.

Documentation directories:

- [docs/features/](docs/features/): feature behavior, data model, UI, and web
  implementation notes.
- [docs/apps/](docs/apps/): app-surface notes such as CLI tooling.
- [docs/web/](docs/web/): shared web UI, color, theme, localization, and
  sidebar rules.
- [docs/infrastructure/](docs/infrastructure/): cron scheduling, database,
  environment, Redis, and future infrastructure direction.
- [docs/releases/](docs/releases/): release-note records and PR/merge-message
  source text.
