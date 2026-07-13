# Core Model

This document defines the first Core data model for plans, tasks, routines, and
memories. It describes product entities and rules before SQL schema details.
Database tables should follow this model unless a later design decision updates
it.

## Scope

The first Core model should support:

- user records for registration and login
- long-running plans
- tasks and subtasks with status-derived progress
- recurring routines
- generated routine instances
- daily plans
- quick idea capture
- personal memories for repeatable enjoyable experiences
- daily reviews
- completion history for review

The first Core model should not include:

- internal plugin or agent context, such as learning history or retrieval
  context
- event bus design
- Discord-specific message details

Detailed user registration and login rules are documented in
[core-layer/user.md](core-layer/user.md). User settings are documented in
[core-layer/user-settings.md](core-layer/user-settings.md). Task rules are
documented in [core-layer/tasks.md](core-layer/tasks.md). Routine rules are
documented in [core-layer/routines.md](core-layer/routines.md). Memory rules
are documented in [core-layer/memories.md](core-layer/memories.md).

## User

User records are Core data because plans, tasks, routines, ideas, daily plans,
and reviews all need a stable owner.

`users` should store:

- id
- username
- password hash
- display name
- created and updated timestamps

Personal configuration such as timezone and day boundary belongs to user
settings, not the main user identity record.

## Plans

A plan is a long-running personal initiative that may last for weeks or months,
such as finding a job, applying for a degree, applying for a visa, or finishing
a study/work project.

`plans` should store:

- user id
- title
- description
- status
- priority
- optional deadline
- created and updated timestamps
- archived timestamp, if archived

Plan statuses:

- `active`: currently relevant.
- `paused`: intentionally stopped for now.
- `completed`: finished.
- `archived`: hidden from normal planning views.

A plan's progress should be derived from its tasks when possible. Avoid storing
manual plan progress in the first version unless there is no task data yet.

## Tasks

A task is executable work. A task may belong to a plan, but standalone tasks
should be allowed because not every useful action starts as a formal plan.

Detailed task behavior is documented in [core-layer/tasks.md](core-layer/tasks.md).

`tasks` should store:

- user id
- optional plan id
- optional parent task id
- title
- description
- status
- priority
- optional deadline
- optional scheduled date
- created and updated timestamps
- completed timestamp, if completed
- archived timestamp, if archived

Task statuses:

- `todo`: captured but not started.
- `doing`: actively in progress.
- `blocked`: waiting on something.
- `skipped`: intentionally not done for the relevant period.
- `done`: completed.
- `archived`: hidden from normal planning views.

Subtasks are tasks with `parent_task_id`. A task can contain subtasks, but
subtasks are not a separate entity type.

Task progress rules:

- Leaf tasks are either open or done.
- Parent task progress should be derived from child task completion.
- Plan progress should be derived from task completion.
- Do not expose numeric task weight or completed weight in the first
  user-facing workflow.

Parent progress should be derived from child tasks when child tasks exist. If a
task has no children, use its own status.

## Routines

A routine is repeatable daily-life work. It is not a plan and should not use the
task hierarchy.

Detailed routine behavior is documented in
[core-layer/routines.md](core-layer/routines.md).

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

The Core layer may generate routine instances ahead of time or lazily when the
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

Ideas are quick captured thoughts that may later become plans, tasks, routines,
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
- `converted`: turned into a plan, task, routine, or plugin request.
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
such as cuisine, sightseeing, anime, games, books, or shops. They are Core data
because the user directly creates, manages, pins, completes, and deletes them.

Memories are not tasks or routines. They are soft candidates for enjoyment and
should not become overdue.

The first model should include:

- memory categories
- memory records
- pinned memories for the current dashboard shortlist
- immutable memory events for pin, ignore, complete, cancel, unpin, replace,
  and delete actions

Detailed behavior and table attributes are documented in
[core-layer/memories.md](core-layer/memories.md).

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

The Core model owns the task or routine instance result. Infrastructure owns
whether a Discord reminder was sent, snoozed, retried, or failed.
