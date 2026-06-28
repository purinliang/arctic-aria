# Core Model

This document defines the first Core data model for plans, tasks, and routines.
It describes product entities and rules before SQL schema details. Database
tables should follow this model unless a later design decision updates it.

## Scope

The first Core model should support:

- user records for registration and login
- long-running plans
- tasks and subtasks with weighted progress
- recurring routines
- generated routine instances
- daily plans
- quick idea capture
- daily reviews
- completion history for review and rewards

The first Core model should not include:

- plugin-specific memory
- reward inventory
- event bus design
- Discord-specific message details

Detailed user registration and login rules are documented in
[core-layer/user.md](core-layer/user.md). User settings are documented in
[core-layer/user-settings.md](core-layer/user-settings.md).

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

A plan is a long-running goal that may last for weeks or months.

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

`tasks` should store:

- user id
- optional plan id
- optional parent task id
- title
- description
- status
- priority
- weight, default `1`
- completed weight, default `0`
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

- `weight` must be positive.
- `completed_weight` must be between `0` and `weight`.
- Setting `completed_weight` to `weight` should mark the task `done`.
- Marking a task `done` should set `completed_weight` to `weight`.
- Partial completion should update `completed_weight` without forcing `done`.

Parent progress should be derived from child tasks when child tasks exist. If a
task has no children, use its own `weight` and `completed_weight`.

## Routines

A routine is repeatable daily-life work. It is not a plan and should not use the
task hierarchy.

`routines` should store:

- user id
- title
- description
- status
- first start date
- optional end date, inclusive
- created and updated timestamps
- archived timestamp, if archived

Routine statuses:

- `active`: can generate future instances.
- `paused`: kept but not generating new instances.
- `archived`: hidden from normal views.

The optional end date is inclusive. If it is blank, the routine continues until
the user pauses or archives it.

## Routine Rules

`routine_rules` define when routine instances should be generated.

Rule types:

- `daily`: every day.
- `weekly`: every 7 days or selected weekdays.
- `bi_weekly`: every 14 days.
- `monthly_by_day`: each month on a selected day of month.
- `fixed_interval_days`: every N days, such as every 30 days.

`routine_rules` should store:

- routine id
- rule type
- interval days, when the rule uses a fixed day interval
- weekdays, when the rule uses selected weekdays
- day of month, when the rule uses monthly-by-day recurrence
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

The first version can store simple review summary fields. More detailed reward
or sharing data should wait until those features are designed.

## Completion Events

Completion events are immutable history records used by review and future reward
logic.

`completion_events` should store:

- user id
- target type: `task` or `routine_instance`
- target id
- event type: `completed`, `partially_completed`, or `skipped`
- previous completed weight, for tasks
- new completed weight, for tasks
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
