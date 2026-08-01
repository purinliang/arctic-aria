# Routines

This document defines the Core product rules for routines. Routine persistence,
backend validation, and database constraints are documented in
[data-model.md](data-model.md).

Routines are repeatable daily-life work such as medication, walking, evening
shutdown, household upkeep, exercise, or review. A routine is not a project,
and it should not use the project hierarchy. Projects and tasks describe work
to complete; routines describe recurring behavior to check.

## Boundary

Routines are Core product data because the user creates, edits, deletes,
completes, and reopens them.

Reminder delivery is not the routine itself. The routine engine owns routine
definitions, recurrence rules, routine instances, completion results, and
historical skip state. Reminder jobs, Discord messages, retries, and snoozes are
Infrastructure or Interface concerns.

## Scope

The first routines feature should include:

- creating routines
- editing routine title and optional description
- deleting routines
- defining recurrence rules
- generating routine instances
- showing today's routine instances on Today
- marking a routine instance completed
- reopening a completed routine instance
- recording completion events for daily review
- Discord reminder delivery for due routine instances

The first routines feature should not include:

- advanced scheduler optimization
- pause and resume
- health-device integration
- automatic schedule suggestions
- task child checklists inside routines

## Routine Definition

A routine definition stores the repeatable behavior. Deleted routine definitions
are marked with `deleted_at`, hidden from normal views, and excluded from future
instance generation.

The optional `end_date` is inclusive. If it is blank, the routine continues
until the user deletes it.

## Routine Rules

A routine rule defines when instances should be generated.

Supported first UI choices:

- `Once`: one check on the start date.
- `Daily`: every day.
- `Weekly`: every 7 days from the start date. The weekday is implied by
  the start date.
- `Monthly`: every month on the calendar day implied by the first start
  date. This is useful for bills and renewal checks.
- `Yearly`: every year on the date implied by the start date.
- `Every 14 days`: every 14 days from the start date.
- `Every 30 days`: useful when the user wants a fixed 30-day
  cycle instead of a calendar month.
- `Fixed interval`: useful for routines that repeat after an explicit number of
  days instead of on a calendar date.

Rule constraints:

- `interval_value` stores either a month interval for `monthly_by_date` or a
  day interval for `day_interval`. The yearly preset uses `monthly_by_date`
  with a 12-month interval.
- `weekdays` stores the start date weekday for `weekly`.
- `day_of_month` stores the start date day for `monthly_by_date`.
- `preferred_time` is optional, but Today should show it when present.
- `timezone` should default to the user's settings timezone.

Monthly rules need a short-month policy. The first policy is: if the target day
does not exist in a month, use the last day of that month.

## Routine Instances

A routine instance is the concrete occurrence generated for one date and
optional time.

Routine instance statuses:

- `pending`: not answered yet.
- `completed`: done.
- `skipped`: intentionally skipped.

The same routine should not generate duplicate instances for the same
`scheduled_date` and `scheduled_time`.

For reminder delivery, the instance also stores `remind_at` and `reminded_at`.
The first reminder is scheduled 30 minutes before the resolved local occurrence
time, then snapped to the nearest 15-minute cron tick. Cron may send when the
current cron timestamp is within two minutes of `remind_at`. If a routine has no
preferred time, the resolved occurrence time is `18:00` local. Routine instances
used by Today roll to the next scheduled date at `04:00` local time, not
midnight.

`Busy` is not a routine instance status. It is a reminder response that snoozes
or reschedules notification delivery. `reminding` is also not a routine
instance status; it is a UI or delivery state for an active reminder.

The first Discord reminders are plain direct messages. They should not add
Discord response buttons in this version.

## Today Behavior

Today should show today's routine instances, not routine definitions.

Each routine instance should show:

- title
- scheduled time, when present
- current instance status
- description

The current Today panel uses static routine rows:

- the completion checkbox appears on the left of the row
- rows do not expand or collapse
- `Busy`, `Skip`, `Later`, and `Move to tomorrow` are not exposed in the
  current Today UI

Action behavior:

- Checking the left checkbox marks the routine instance `completed`.
- Unchecking the left checkbox reopens the routine instance as `pending`.
- `Skip` and `Busy` remain future reminder-response actions. `Busy` should not
  change the instance status; it should create or update reminder delivery
  state after reminder response actions are designed.

## Completion History

Completing or skipping a routine instance should create immutable completion
history for daily review.

The current history target is:

- table: `routine_completion_events`
- target id: `routine_instance_id`
- event types: `completed`, `skipped`, and `reopened`

The latest state remains on `routine_instances`. Event history records what
happened.

## UI

Routine UI behavior is documented in [ui.md](ui.md). Keep this
file focused on product rules and data behavior.
