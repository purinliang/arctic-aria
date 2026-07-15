# Feature Model Overview

This document defines the first product data model for projects, tasks,
routines, and memories. It describes product entities and rules before SQL
schema details. Database tables should follow this model unless a later design
decision updates it.

## Scope

The first feature model should support:

- user records for registration and login
- long-running projects
- milestones and tasks with status-derived progress
- recurring routines
- generated routine instances
- user settings
- daily plans
- quick idea capture
- personal memories for repeatable enjoyable experiences
- daily reviews
- completion history for review

The first feature model should not include:

- internal plugin or agent context, such as learning history or retrieval
  context
- infrastructure event/dataflow design
- Discord-specific message details

Detailed feature docs:

- Auth rules: [auth/overview.md](auth/overview.md)
- Auth persistence: [auth/data-model.md](auth/data-model.md)
- Settings rules: [settings/overview.md](settings/overview.md)
- Project and task rules: [projects/overview.md](projects/overview.md)
- Project and task persistence: [projects/data-model.md](projects/data-model.md)
- Routine rules: [routines/overview.md](routines/overview.md)
- Routine persistence: [routines/data-model.md](routines/data-model.md)
- Memory rules: [memories/overview.md](memories/overview.md)
- Memory persistence: [memories/data-model.md](memories/data-model.md)

## User

User records are product data because projects, tasks, routines, ideas, daily
plans, and reviews all need a stable owner.

`users` should store:

- id
- username
- password hash
- display name
- created and updated timestamps

Personal configuration such as timezone and day boundary belongs to user
settings, not the main user identity record.

## Projects

A project is a long-running personal initiative that may last for one month,
several months, or several years. Examples include finding a job, applying for
a degree, applying for a visa, or finishing a study/work objective.

`projects` should store:

- user id
- title
- description, combining the objective and why it matters
- status
- priority
- start date
- optional deadline date
- optional expected duration
- created and updated timestamps
- completed timestamp, if completed
- archived timestamp, if archived

Project statuses:

- `active`: currently relevant.
- `paused`: intentionally stopped for now.
- `completed`: finished.
- `archived`: hidden from normal planning views.

A project's progress should be derived from milestone and task state. Avoid
storing manual project progress in the first version.

## Milestones

A milestone is a phase boundary inside a project. It can behave like a smaller
project for planning purposes, but it should stay lightweight. It helps the user
avoid planning too far into the future and focus on the first or current phase.

`project_milestones` should store:

- user id
- project id
- title
- optional objective
- status
- sort order
- optional start date
- optional deadline date
- optional expected duration
- created and updated timestamps
- completed timestamp, if completed
- archived timestamp, if archived

Milestones are optional. A project can have zero milestones, and project
creation must not create a default milestone. Tasks can exist directly under a
project without a milestone.

## Tasks

A task is executable work under one project, optionally assigned to one
milestone. Tasks are the atomic items selected by the dashboard and scheduler.
A task may last less than a day or up to a few weeks, depending on project
scale.

Detailed project and task behavior is documented in
[projects/overview.md](projects/overview.md).

`project_tasks` should store:

- user id
- project id
- milestone id
- title
- description
- status
- priority
- optional scheduled date
- optional start date
- optional deadline date
- sort order
- created and updated timestamps
- completed timestamp, if completed
- skipped timestamp, if skipped
- blocked timestamp, if blocked
- archived timestamp, if archived

Task statuses:

- `todo`: captured but not started.
- `doing`: actively in progress.
- `blocked`: waiting on something.
- `skipped`: intentionally not done for the relevant period.
- `done`: completed.
- `archived`: hidden from normal planning views.

Tasks can depend on other tasks, but they should not contain child tasks in the
current model.

Task progress rules:

- Tasks are either open or done at scheduler level.
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
- title
- description
- status
- first start date
- optional end date, inclusive
- created and updated timestamps

Routine statuses:

- `active`: can generate future instances.
- `deleted`: hidden from normal views and excluded from future instance
  generation.

The optional end date is inclusive. If it is blank, the routine continues until
the user deletes it.

## Routine Rules

`routine_rules` define when routine instances should be generated.

Rule types:

- `daily`: every day.
- `weekly`: every 7 days or selected weekdays.
- `bi_weekly`: every 14 days.
- `monthly_by_date`: every 1, 2, 3, 6, or 12 months on a selected day of
  month.
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
- status
- completed timestamp, if completed
- skipped timestamp, if skipped
- created and updated timestamps

Routine instance statuses:

- `pending`: not answered yet.
- `completed`: done.
- `skipped`: intentionally skipped.

`Busy` is not a routine instance status. It is a reminder response that snoozes
or reschedules notification delivery.

The routine feature may generate routine instances ahead of time or lazily when the
scheduler prepares a daily plan. The same routine should not generate duplicate
instances for the same scheduled date and scheduled time.

## Daily Plans

A daily plan is the selected work for one personal day.

`daily_plans` should store:

- user id
- day date
- day starts at timestamp
- day ends at timestamp
- status
- created and updated timestamps

Daily plan statuses:

- `draft`: generated or edited but not final.
- `active`: used for the current day.
- `reviewed`: daily review completed.

`daily_plan_items` should link a daily plan to tasks and routine instances.

Daily plan item fields:

- daily plan id
- item type: `task` or `routine_instance`
- item id
- optional scheduled start time
- optional scheduled end time
- sort order

## Ideas

Ideas are quick captured thoughts that may later become projects, tasks, routines,
or plugin requests.

`ideas` should store:

- user id
- title or raw text
- optional description
- source, such as web, Discord, mobile, or agent
- triage status
- created and updated timestamps
- converted target type and target id, if converted

Idea triage statuses:

- `untriaged`: captured but not reviewed.
- `kept`: saved as a note or idea.
- `converted`: turned into a project, task, routine, or plugin request.
- `archived`: hidden from normal views.

## Daily Reviews

Daily reviews summarize one personal day.

`daily_reviews` should store:

- user id
- day date
- summary text
- completed count
- skipped count
- partial count
- created and updated timestamps

The first version can store simple review summary fields. More detailed sharing
data should wait until that feature is designed.

## Memories

Memories are repeatable personal experiences that the user may want to revisit,
such as cuisine, sightseeing, anime, games, books, or shops. They are product
data because the user directly creates, manages, pins, completes, and deletes
them.

Memories are not tasks or routines. They are soft candidates for enjoyment and
should not become overdue.

The first model should include:

- memory categories
- memory records
- pinned memories for the current dashboard shortlist
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
