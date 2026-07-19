# Routines Data Model

This document defines routine persistence, backend validation, and database
constraints. Product behavior is documented in [overview.md](overview.md), and UI
behavior is documented in [ui.md](ui.md).

## Validation And Consistency

Routines uses the shared database integrity rules from
[../../infrastructure/database.md](../../infrastructure/database.md).

Backend validation should check:

- routine title is required and 1-120 characters
- routine description is optional and 2000 characters or fewer
- first start date is a valid date
- optional end date is blank or not before first start date
- recurrence rule type is supported
- weekly rules derive one weekday from first start date
- monthly rules derive day of month from first start date
- fixed day interval values are positive integers when used
- preferred time uses `HH:mm` when provided

Database constraints should protect:

- routine ownership through `user_id`
- one rule per routine
- one routine instance per routine/date/time combination
- allowed routine statuses
- allowed routine instance statuses
- end date not before first start date
- positive interval values when present
- valid day-of-month range when present

Do not rely on read-before-insert checks alone for routine instance generation.
The unique schedule index must protect concurrent generation of the same
routine occurrence.

Deletion behavior:

- Current user-visible delete marks a routine as `deleted`.
- Deleted routines are hidden from normal routine lists and dashboard rows.
- Deleted routines are excluded from future instance generation.
- Existing historical routine instances remain available for review/history
  unless a future cleanup command explicitly removes them.
- Hard delete should only be used as explicit cleanup and should remove related
  rule and instance data intentionally.

## `routines`

Stores the repeatable routine definition.

Current fields:

- `id`
- `user_id`
- `title`
- `description`
- `status`
- `first_start_date`
- `end_date`
- `created_at`
- `updated_at`

Field rules:

- `title` is required.
- `description` is optional and stored as `NULL` when omitted.
- Generated default description copy is render-only and must not be stored in
  the database.

Current statuses:

- `active`
- `deleted`

## `routine_rules`

Stores recurrence settings for one routine.

Current fields:

- `id`
- `routine_id`
- `rule_type`
- `interval_value`
- `weekdays`
- `day_of_month`
- `preferred_time`
- `timezone`
- `created_at`
- `updated_at`

Supported rule types:

- `daily`
- `weekly`, anchored to first start date weekday
- `monthly_by_date`, anchored to first start date day
- `bi_weekly`, anchored to first start date
- `day_interval`, used by the every-30-days preset and the fixed-days option,
  which defaults to 90 days

Current database protection:

- `routine_id` references `routines.id`.
- `rule_type` is constrained to supported values.
- `interval_value` is null or positive.
- `day_of_month` is null or 1-31.
- `routine_id` is unique so each routine has one rule.

## `routine_instances`

Stores concrete routine occurrences.

Current fields:

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

Current statuses:

- `pending`
- `completed`
- `skipped`

Current database protection:

- `user_id` references `users.id`.
- `routine_id` references `routines.id`.
- status is constrained to `pending`, `completed`, or `skipped`.
- unique schedule index prevents duplicate instances for the same
  routine/date/time.

## `completion_events`

Routine completion and skip actions should create immutable completion history
for daily review.

Current routine event target:

- target type: `routine_instance`
- target id: the routine instance id

The latest state remains on `routine_instances`. Event history records what
happened.
