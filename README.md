# Arctic Aria

Arctic Aria is a personal life assistant for turning messy daily life into a
clear plan. It focuses on planning, tasks, routines, reminders, ideas, daily
review, memories, and positive feedback.

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
- Review the day and show completed work, partial progress, and unfinished work.
- Give positive feedback through rewards, progress summaries, and shareable
  review cards.

## How It Works

Arctic Aria is organized around features and supporting services:

- Features: auth, settings, projects, routines, memories, dashboard, reviews,
  and future idea capture.
- Plugins: optional helpers such as rewards, English coach, research coach,
  cuisine and sightseeing planner, movie or anime recommender, and future
  specialized assistants.
- Apps: web dashboard for full control and Discord bot for reminders, quick
  capture, daily push messages, and review prompts.
- Infrastructure: Neon PostgreSQL now, with future cache, background job,
  dataflow, and external service adapters added only when needed.

The web dashboard is the main workspace. The Discord bot is important because it
can reach the user when they forget to open the app.

## Future Plugins

Plugins make the system more useful and more fun without making the core planner
too complicated.

- English coach: help choose what to learn today, especially when the subject is
  very open-ended.
- Reward system: give gold, items, boxes, and collection progress for persistent
  effort.
- Weekend planner: suggest new cuisine, sightseeing, or other outside
  activities beyond saved memories.
- Home entertainment recommender: suggest new movies or anime when staying home.
- Research coach: help collect sources, summarize material, and turn it into
  ideas or tasks.

## Project Documents

- [docs/user-story.md](docs/user-story.md): user problems and workflows.
- [docs/architecture.md](docs/architecture.md): feature, plugin, app, and
  infrastructure responsibilities.
- [docs/features/overview.md](docs/features/overview.md): first feature model
  for settings, projects, milestones, tasks, routines, daily plans, ideas,
  memories, and reviews.
- [docs/features/settings/overview.md](docs/features/settings/overview.md):
  user-facing settings and preference rules.
- [docs/features/auth/overview.md](docs/features/auth/overview.md):
  auth product rules for registration, login, sessions, and future OAuth.
- [docs/features/auth/data-model.md](docs/features/auth/data-model.md):
  auth persistence, validation, and database constraints.
- [docs/features/projects/overview.md](docs/features/projects/overview.md):
  project, milestone, and task product rules.
- [docs/features/projects/data-model.md](docs/features/projects/data-model.md):
  project feature data model and database direction.
- [docs/features/projects/ui.md](docs/features/projects/ui.md): project
  and task UI behavior.
- [docs/features/routines/overview.md](docs/features/routines/overview.md):
  routine product rules and data behavior.
- [docs/features/routines/data-model.md](docs/features/routines/data-model.md):
  routine persistence, validation, and database constraints.
- [docs/features/routines/web-implementation.md](docs/features/routines/web-implementation.md):
  current web routine implementation notes.
- [docs/features/memories/overview.md](docs/features/memories/overview.md):
  memory product rules and suggestion behavior.
- [docs/features/memories/data-model.md](docs/features/memories/data-model.md):
  memory persistence, validation, and database constraints.
- [docs/features/dashboard/ui.md](docs/features/dashboard/ui.md): current
  dashboard UI behavior.
- [docs/features/dashboard/web-implementation.md](docs/features/dashboard/web-implementation.md):
  current web dashboard implementation notes.
- [docs/ui.md](docs/ui.md): shared UI terminology and links to web component
  rules.
- [docs/implementation.md](docs/implementation.md): technology, storage, and
  repository structure.
- [docs/infrastructure/database.md](docs/infrastructure/database.md): database
  direction and current Neon PostgreSQL notes.
- [docs/features/auth/web-implementation.md](docs/features/auth/web-implementation.md):
  current web auth implementation notes.
- [docs/features/projects/web-implementation.md](docs/features/projects/web-implementation.md):
  current web project implementation notes.
- [docs/roadmap.md](docs/roadmap.md): implementation phases.
