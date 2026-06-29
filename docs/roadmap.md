# Roadmap

This roadmap describes implementation phases. It should change as the project
becomes clearer.

## Phase 0: Documentation And Specification

- Define product goals, workflows, collaboration rules, and initial structure.
- Define architecture, implementation direction, and user stories.
- Keep README as a simple project overview.

## Phase 1: Core Model

- Build the username and password auth foundation first so later records have a
  stable owner.
- Define plans, tasks, subtasks, routines, ideas, scheduler data, reviews, and
  completion events.
- Choose concrete database schema and migration tooling.
- Define commands and events for task completion, partial completion, routine
  completion, idea capture, and daily review.

## Phase 2: Web Dashboard

- Build the main web dashboard.
- Show daily plan, backlog, deadlines, weighted progress, routines, timetable,
  idea capture, and review history.
- Support editing, rescheduling, completing, partially completing, skipping, and
  reviewing items.

## Phase 3: Discord Bot

- Add quick capture commands.
- Add pushed reminder delivery.
- Add reminder buttons for complete, skip, and busy responses.
- Add daily scheduler messages and review prompts.

## Phase 4: Reward Plugin

- Add money, boxes, gems, flowers, and simple inventory records.
- Add reward rules based on daily plan fulfillment and review results.
- Add shareable reward or review summaries.

## Phase 5: English Coach Plugin

- Add daily topic suggestions.
- Add chat-style speaking practice.
- Add mistake correction and daily learning reviews.
- Save learning history for future context.
- Allow learning progress to grant extra rewards.

## Phase 6: Future Life Plugins

- Add cuisine and sightseeing suggestions.
- Add movie and anime recommendations.
- Add research coach workflows.
- Keep each plugin independent from core planning logic.

## Phase 7: Sharing And Deployment

- Add optional progress sharing and encouragement interactions.
- Decide the production hosting model for the web app, backend, database, and
  Discord bot.
- Add backup, sync, and account strategy when the data model is stable.
