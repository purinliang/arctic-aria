# Routines

This document defines the Core product rules for routines.

Routines are repeatable daily-life work such as medication, walking, evening
shutdown, English practice, exercise, or review. A routine is not a plan, and it
should not use the task hierarchy. Plans and tasks describe work to complete;
routines describe recurring behavior to check.

## Boundary

Routines are Core product data because the user creates, edits, pauses,
archives, completes, and skips them.

Reminder delivery is not the routine itself. The routine engine owns routine
definitions, recurrence rules, routine instances, and completion or skip
results. Reminder jobs, Discord messages, retries, and snoozes are
Infrastructure or Interface concerns.

## Scope

The first routines feature should include:

- creating routines
- editing routine title and description
- pausing and resuming routines
- archiving routines
- defining recurrence rules
- generating routine instances
- showing today's routine instances on the dashboard
- marking a routine instance completed
- marking a routine instance skipped
- recording completion events for review and future rewards

The first routines feature should not include:

- Discord reminder delivery
- advanced scheduler optimization
- reward calculation
- health-device integration
- AI-generated routine coaching
- task subtasks inside routines

## Routine Definition

A routine definition stores the repeatable behavior.

Recommended fields:

- `id`
- `user_id`
- `title`
- `description`
- `status`
- `first_start_date`
- `end_date`
- `created_at`
- `updated_at`
- `archived_at`

Routine statuses:

- `active`: can generate future instances.
- `paused`: kept by the user, but does not generate new instances.
- `archived`: hidden from normal views.

The optional `end_date` is inclusive. If it is blank, the routine continues
until the user pauses or archives it.

## Routine Rules

A routine rule defines when instances should be generated.

Supported first rule types:

- `daily`: every day.
- `weekly`: selected weekdays.
- `bi_weekly`: every 14 days.
- `monthly_by_day`: each month on a selected day of month.
- `fixed_interval_days`: every N days.

Recommended fields:

- `id`
- `routine_id`
- `rule_type`
- `interval_days`
- `weekdays`
- `day_of_month`
- `preferred_time`
- `timezone`
- `created_at`
- `updated_at`

Rule constraints:

- `interval_days` is required only for `fixed_interval_days`.
- `weekdays` is required only for selected-weekday weekly rules.
- `day_of_month` is required only for `monthly_by_day`.
- `preferred_time` is optional, but the dashboard should show it when present.
- `timezone` should default to the user's settings timezone.

Monthly rules need a short-month policy. The first policy is: if the target day
does not exist in a month, use the last day of that month.

## Routine Instances

A routine instance is the concrete occurrence generated for one date and
optional time.

Recommended fields:

- `id`
- `user_id`
- `routine_id`
- `scheduled_date`
- `scheduled_time`
- `status`
- `completed_at`
- `skipped_at`
- `created_at`
- `updated_at`

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

The first dashboard can keep the existing expanded-card behavior:

- clicking a routine expands or collapses it
- a currently active reminder can start expanded
- expanded state shows `Done`, `Busy`, and `Skip`

Action behavior:

- `Done` marks the routine instance `completed`.
- `Skip` marks the routine instance `skipped`.
- `Busy` should not change the instance status. It should create or update
  reminder delivery state when reminder jobs are implemented.

## Events

Completing or skipping a routine instance should create immutable completion
history for daily review and future reward logic.

The first event target should be:

- target type: `routine_instance`
- target id: the routine instance id

The latest state remains on `routine_instances`. Event history records what
happened.

## UI

Routine UI behavior is documented in [routines-ui.md](routines-ui.md). Keep this
file focused on product rules and data behavior.
