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

Start here:

- [docs/user-story.md](docs/user-story.md): user problems and workflows.
- [docs/roadmap.md](docs/roadmap.md): current version focus, future work, and
  removed roadmap items.
- [docs/architecture.md](docs/architecture.md): feature, plugin, app, and
  infrastructure responsibilities.
- [docs/implementation.md](docs/implementation.md): technology, storage, and
  current repository structure.

Feature map:

- [docs/features/overview.md](docs/features/overview.md): feature-level index
  for settings, auth, projects, routines, memories, dashboard, ideas, and
  reviews.
- [docs/features/settings/overview.md](docs/features/settings/overview.md):
  user-facing settings and preference rules.

Auth:

- [docs/features/auth/overview.md](docs/features/auth/overview.md): auth
  product rules for registration, login, sessions, and future OAuth.
- [docs/features/auth/data-model.md](docs/features/auth/data-model.md): auth
  persistence, validation, and database constraints.
- [docs/features/auth/ui.md](docs/features/auth/ui.md): auth page UI behavior.
- [docs/features/auth/web-implementation.md](docs/features/auth/web-implementation.md):
  current web auth implementation notes.

Projects:

- [docs/features/projects/overview.md](docs/features/projects/overview.md):
  project, milestone, and task product rules.
- [docs/features/projects/data-model.md](docs/features/projects/data-model.md):
  project feature data model and database direction.
- [docs/features/projects/ui.md](docs/features/projects/ui.md): project and
  task UI behavior.
- [docs/features/projects/web-implementation.md](docs/features/projects/web-implementation.md):
  current web project implementation notes.

Routines:

- [docs/features/routines/overview.md](docs/features/routines/overview.md):
  routine product rules and data behavior.
- [docs/features/routines/data-model.md](docs/features/routines/data-model.md):
  routine persistence, validation, and database constraints.
- [docs/features/routines/ui.md](docs/features/routines/ui.md): routine page
  and dashboard UI behavior.
- [docs/features/routines/web-implementation.md](docs/features/routines/web-implementation.md):
  current web routine implementation notes.

Memories:

- [docs/features/memories/overview.md](docs/features/memories/overview.md):
  memory product rules and suggestion behavior.
- [docs/features/memories/data-model.md](docs/features/memories/data-model.md):
  memory persistence, validation, and database constraints.
- [docs/features/memories/ui.md](docs/features/memories/ui.md): memory page
  and pinned memory UI behavior.
- [docs/features/memories/web-implementation.md](docs/features/memories/web-implementation.md):
  current web memory implementation notes.

Dashboard:

- [docs/features/dashboard/ui.md](docs/features/dashboard/ui.md): dashboard
  panels, interactions, and visual behavior.
- [docs/features/dashboard/web-implementation.md](docs/features/dashboard/web-implementation.md):
  current web dashboard implementation notes.

Shared Web UI:

- [docs/ui.md](docs/ui.md): shared UI terminology and links to web component
  rules.
- [docs/web/ui-components.md](docs/web/ui-components.md): shared web component
  rules for buttons, inputs, dialogs, notifications, cards, lists, and layout.
- [docs/web/sidebar.md](docs/web/sidebar.md): sidebar product behavior.
- [docs/web/sidebar-ui.md](docs/web/sidebar-ui.md): sidebar visual and
  interaction rules.
- [docs/web/theme.md](docs/web/theme.md): theme behavior and color direction.

Apps And Infrastructure:

- [docs/apps/discord-bot/prototype.md](docs/apps/discord-bot/prototype.md):
  Discord bot prototype direction.
- [docs/infrastructure/database.md](docs/infrastructure/database.md): database
  direction, data lifecycle, credential/data protection, and current Neon
  PostgreSQL notes.
- [docs/infrastructure/redis.md](docs/infrastructure/redis.md): planned Redis
  direction for latency, cache, rate limiting, idempotency, and short-lived
  coordination.

Release Records:

- [docs/releases/README.md](docs/releases/README.md): release-note format and
  links to previous release records.
