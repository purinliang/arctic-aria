# Feature Model Overview

This document summarizes the current product model for projects, tasks,
routines, ideas, and memories. It describes entities and rules before SQL schema
details. Database tables should follow the feature data-model docs and
`apps/database/schema.md` when a conflict appears here.

## Scope

The current feature model supports:

- user records for registration and login
- long-running projects
- milestones and tasks with status-derived progress
- recurring routines
- generated routine instances
- user settings
- Today selections
- quick idea capture
- personal memories for repeatable enjoyable experiences
- Daily Review text generation and Discord delivery
- completion history for review

The first feature model should not include:

- internal assistant context, such as retrieval context
- infrastructure event/dataflow design
- Discord-specific message details

Detailed feature docs:

- Auth rules: [auth/overview.md](auth/overview.md)
- Auth persistence: [auth/data-model.md](auth/data-model.md)
- Settings rules: [settings/overview.md](settings/overview.md)
- Settings persistence: [settings/data-model.md](settings/data-model.md)
- Project and task rules: [projects/overview.md](projects/overview.md)
- Project and task persistence: [projects/data-model.md](projects/data-model.md)
- Routine rules: [routines/overview.md](routines/overview.md)
- Routine persistence: [routines/data-model.md](routines/data-model.md)
- Memory rules: [memories/overview.md](memories/overview.md)
- Memory persistence: [memories/data-model.md](memories/data-model.md)
- Ideas rules: [ideas/overview.md](ideas/overview.md)
- Ideas persistence: [ideas/data-model.md](ideas/data-model.md)
- Ideas UI: [ideas/ui.md](ideas/ui.md)
- Ideas implementation: [ideas/web-implementation.md](ideas/web-implementation.md)
- Discord integration: [discord/overview.md](discord/overview.md)

## User

User records are product data because projects, tasks, routines, ideas, Today
selections, and review delivery all need a stable owner.

`users` should store:

- id
- username
- password hash
- display name
- administrator flag
- created and updated timestamps

Personal configuration such as theme, language, time format, and timezone
belongs to user settings, not the main user identity record.

## Projects

A project is a long-running personal initiative that may last for one month,
several months, or several years. Examples include finding a job, applying for
a degree, applying for a visa, or finishing a study/work objective.

`projects` should store:

- user id
- title
- optional objective, combining what the project should accomplish and why it
  matters
- status
- start date
- optional deadline date
- optional expected duration
- optional sidebar pin order
- created and updated timestamps
- completed timestamp, if completed
- deleted timestamp, if soft-deleted

A project's progress is derived from milestone and task state. The current
schema does not store editable project status, priority, archived state, or
manual progress.

## Milestones

A milestone is a phase boundary inside a project. It can behave like a smaller
project for planning purposes, but it should stay lightweight. It helps the user
avoid planning too far into the future and focus on the first or current phase.

`project_milestones` should store:

- user id
- project id
- title
- optional objective
- sort order
- optional start date
- optional deadline date
- optional expected duration
- created and updated timestamps
- completed timestamp, if completed
- deleted timestamp, if soft-deleted

Milestones are optional. A project can have zero milestones, and project
creation must not create a default milestone. Tasks can exist directly under a
project without a milestone.

## Tasks

A task is executable work under one project, optionally assigned to one
milestone. Tasks are the atomic project items selected onto Today.
A task may last less than a day or up to a few weeks, depending on project
scale.

Detailed project and task behavior is documented in
[projects/overview.md](projects/overview.md).

`project_tasks` store:

- user id
- project id
- optional milestone id
- title
- description
- optional start date
- optional deadline date
- sort order
- created and updated timestamps
- completed timestamp, if completed
- deleted timestamp, if soft-deleted

The current schema does not store task status, priority, skipped state, blocked
state, scheduled date, dependencies, or child tasks. Today scheduling is stored
separately in `project_task_daily_selections`.

Task progress rules:

- Tasks are either open or completed at Today/review level.
- Milestone and project progress should be derived from task completion.
- Do not expose editable numeric progress fields in the first user-facing
  workflow.

## Routines

A routine is repeatable daily-life work. It is not a project and should not use
the project hierarchy.

Detailed routine behavior is documented in
[routines/overview.md](routines/overview.md).

`routines` should store:

- user id
- optional group id
- title
- description
- first start date
- optional end date, inclusive
- created and updated timestamps
- deleted timestamp, if soft-deleted

Routine groups are optional user-owned labels for organizing routines. Deleting
a group sets `deleted_at` and leaves linked routines ungrouped.

The optional end date is inclusive. If it is blank, the routine continues until
the user deletes it.

## Routine Rules

`routine_rules` define when routine instances should be generated.

Rule types:

- `daily`: every day.
- `weekly`: every 7 days or selected weekdays.
- `bi_weekly`: every 14 days.
- `once`: once on the first start date.
- `monthly_by_date`: every 1, 2, 3, 6, or 12 months on a selected day of
  month. The routine editor exposes a yearly preset as a 12-month interval.
- `day_interval`: every fixed number of days, such as every 30 days.

`routine_rules` should store:

- routine id
- rule type
- interval value, when the rule uses a month or day interval
- weekdays, when the rule uses selected weekdays
- day of month, when the rule uses monthly-by-date recurrence
- preferred reminder time
- timezone

Monthly rules need a clear policy for short months. The first policy should be:
if the target day does not exist in a month, use the last day of that month.

## Routine Instances

A routine instance is a concrete occurrence generated from a routine rule.

`routine_instances` should store:

- user id
- routine id
- scheduled date
- optional scheduled time
- reminder timestamp
- reminder-sent timestamp
- move timestamp and previous date, for future Move to tomorrow behavior
- status
- completed timestamp, if completed
- skipped timestamp, if skipped
- created and updated timestamps

Routine instance statuses:

- `pending`: not answered yet.
- `completed`: done.
- `skipped`: intentionally skipped.

`Later` and `Move to tomorrow` are planned reminder responses. They are not
implemented UI actions yet.

The routine feature may generate routine instances ahead of time or lazily when the
scheduler prepares a daily plan. The same routine should not generate duplicate
instances for the same scheduled date and scheduled time.

## Today Selections

Today is built from feature-owned scheduling tables, not from a separate
`daily_plans` table.

Project tasks use `project_task_daily_selections`:

- user id
- task id
- scheduled date
- source, currently scheduler-generated
- created and updated timestamps

Routine rows use `routine_instances`, because routines are recurring
definitions with concrete occurrences.

## Ideas

Ideas are quick captured thoughts that may later become projects, tasks,
routines, memories, or review notes.

`ideas` should store:

- user id
- raw text
- source, such as web, Discord, mobile, or agent
- triage status
- optional source metadata
- created and updated timestamps
- converted target type and target id, if converted

Idea triage statuses:

- `untriaged`: captured but not reviewed.
- `kept`: saved as a note or idea.
- `converted`: turned into a project, task, routine, memory, or review note.
- `archived`: hidden from normal views.

Detailed idea behavior is documented in [ideas/overview.md](ideas/overview.md).

## Daily Review

Daily Review summarizes one local day.

The current implementation does not store a `daily_reviews` table. It generates
summary text from current Today data and sends scheduled Discord messages with
duplicate protection through `discord_message_deliveries`.

A future first-class Reviews feature may add persisted daily, weekly, or monthly
review tables after the workflow is designed.

## Memories

Memories are repeatable personal experiences that the user may want to revisit,
such as cuisine, sightseeing, anime, games, books, or shops. They are product
data because the user directly creates, manages, pins, completes, and deletes
them.

Memories are not tasks or routines. They are soft candidates for enjoyment and
should not become overdue.

The current model includes:

- memory categories
- memory records
- pinned memories for the current Today shortlist
- append-only memory events for pin, ignore, complete, cancel, unpin, and
  replace actions while the memory record exists

Detailed behavior and table attributes are documented in
[memories/overview.md](memories/overview.md).

## Completion Events

Completion events are immutable history records used by review logic.

`completion_events` should store:

- user id
- target type: `task` or `routine_instance`
- target id
- event type, such as `completed`, `reopened`, `blocked`, `unblocked`, or
  `skipped`
- occurred at timestamp
- source, such as web, Discord, scheduler, or agent

State tables store the latest state. Completion events store what happened.

## Reminder Jobs

Reminder jobs are infrastructure delivery records. They are not the source of
routine recurrence rules.

`reminder_jobs` should target a task or routine instance and store delivery
state such as pending, sent, answered, snoozed, failed, or expired.

The product model owns the task or routine instance result. Infrastructure owns
whether a Discord reminder was sent, snoozed, retried, or failed.
