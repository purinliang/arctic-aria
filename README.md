# Arctic Aria

Arctic Aria is a personal life assistant for turning messy daily life into a
clear plan. It focuses on planning, tasks, routines, reminders, ideas, daily
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
- Choose what to do today based on priority, urgency, progress, and deadlines.
- Remember routines with reminders and quick completion checks.
- Capture ideas, possible tasks, and possible routines before they are lost.
- Revisit saved personal experiences such as cuisine, sightseeing, books, or
  shows.
- Review the day and keep enough progress context to see what changed.

## How It Works

Arctic Aria is organized around features and supporting services:

- Features: auth, settings, projects, routines, memories, dashboard, ideas,
  and future reviews.
- Apps: web dashboard for full control, plus a Discord integration hosted by
  the web app for quick idea capture, account binding, test direct messages,
  and future reminders or review prompts.
- Infrastructure: Neon PostgreSQL now, with future cache, background job,
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

Documentation directories:

- [docs/features/](docs/features/): feature behavior, data model, UI, and web
  implementation notes.
- [docs/web/](docs/web/): shared web UI, color, theme, localization, and
  sidebar rules.
- [docs/infrastructure/](docs/infrastructure/): database, environment, Redis,
  and future infrastructure direction.
- [docs/releases/](docs/releases/): release-note records and PR/merge-message
  source text.
