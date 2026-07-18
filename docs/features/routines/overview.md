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
completes, and skips them.

Reminder delivery is not the routine itself. The routine engine owns routine
definitions, recurrence rules, routine instances, and completion or skip
results. Reminder jobs, Discord messages, retries, and snoozes are
Infrastructure or Interface concerns.

## Scope

The first routines feature should include:

- creating routines
- editing routine title and description
- deleting routines
- defining recurrence rules
- generating routine instances
- showing today's routine instances on the dashboard
- marking a routine instance completed
- marking a routine instance skipped
- recording completion events for daily review

The first routines feature should not include:

- Discord reminder delivery
- advanced scheduler optimization
- pause and resume
- archive-only user flows
- health-device integration
- automatic schedule suggestions
- task child checklists inside routines

## Routine Definition

A routine definition stores the repeatable behavior.

Routine statuses:

- `active`: can generate future instances.
- `deleted`: hidden from normal views and excluded from future instance
  generation.

The optional `end_date` is inclusive. If it is blank, the routine continues
until the user deletes it.

## Routine Rules

A routine rule defines when instances should be generated.

Supported first UI choices:

- `Daily`: every day.
- `Weekly`: every 7 days from the first start date. The weekday is implied by
  the first start date.
- `Monthly`: every month on the calendar day implied by the first start
  date. This is useful for bills and renewal checks.
- `Every 14 days`: every 14 days from the first start date.
- `Every 30 days`: useful when the user wants a fixed 30-day
  cycle instead of a calendar month.
- `Fixed day interval`: useful for subscription-like routines that should
  repeat after exactly 90 days by default, or another explicit number of days,
  instead of on a calendar date.

Rule constraints:

- `interval_value` stores either a month interval for `monthly_by_date` or a
  day interval for `day_interval`.
- `weekdays` stores the first start date weekday for `weekly`.
- `day_of_month` stores the first start date day for `monthly_by_date`.
- `preferred_time` is optional, but the dashboard should show it when present.
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

`Busy` is not a routine instance status. It is a reminder response that snoozes
or reschedules notification delivery. `reminding` is also not a routine
instance status; it is a UI or delivery state for an active reminder.

## Dashboard Behavior

The dashboard should show today's routine instances, not routine definitions.

Each routine instance should show:

- title
- scheduled time, when present
- current instance status
- useful small metadata such as streak or due text when available

The first dashboard should use static routine rows:

- the completion checkbox appears on the left of the row
- rows do not expand or collapse
- `Busy` and `Skip` are not exposed in the current dashboard UI

Action behavior:

- Checking the left checkbox marks the routine instance `completed`.
- Unchecking the left checkbox reopens the routine instance as `pending`.
- `Skip` and `Busy` remain future reminder-response actions. `Busy` should not
  change the instance status; it should create or update reminder delivery state
  when reminder jobs are implemented.

## Events

Completing or skipping a routine instance should create immutable completion
history for daily review.

The first event target should be:

- target type: `routine_instance`
- target id: the routine instance id

The latest state remains on `routine_instances`. Event history records what
happened.

## UI

Routine UI behavior is documented in [ui.md](ui.md). Keep this
file focused on product rules and data behavior.
