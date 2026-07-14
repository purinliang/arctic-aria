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

- Break a long-term project into milestones, tasks, and subtasks.
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

- Features: auth, projects, routines, memories, dashboard, reviews, and future
  idea capture.
- Plugins: optional helpers such as rewards, English coach, research coach,
  cuisine and sightseeing planner, movie or anime recommender, and future
  specialized assistants.
- Apps: web dashboard for full control and Discord bot for reminders, quick
  capture, daily push messages, and review prompts.
- Infrastructure: database, background jobs, event bus, and external service
  adapters.

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
  for projects, milestones, tasks, routines, daily plans, ideas, memories, and
  reviews.
- [docs/features/projects/overview.md](docs/features/projects/overview.md):
  project, milestone, task, and subtask product rules.
- [docs/features/projects/data-model.md](docs/features/projects/data-model.md):
  project feature data model and database direction.
- [docs/features/projects/ui.md](docs/features/projects/ui.md): project
  and task UI behavior.
- [docs/features/routines/design.md](docs/features/routines/design.md):
  routine product rules and data behavior.
- [docs/implementation.md](docs/implementation.md): technology, storage, and
  repository structure.
- [docs/infrastructure/database.md](docs/infrastructure/database.md): database
  direction and current Neon PostgreSQL prototype notes.
- [docs/features/auth/web-implementation.md](docs/features/auth/web-implementation.md):
  current web auth implementation notes.
- [docs/features/projects/web-implementation.md](docs/features/projects/web-implementation.md):
  current web project implementation notes.
- [docs/roadmap.md](docs/roadmap.md): implementation phases.
