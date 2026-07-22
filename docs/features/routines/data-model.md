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
- optional routine group id is blank or a valid group owned by the same user
- routine group name is required and 1-80 characters
- routine group description is optional and 500 characters or fewer
- first start date is a valid date
- optional end date is blank or not before first start date
- recurrence rule type is supported
- weekly rules derive one weekday from first start date
- monthly rules derive day of month from first start date
- fixed day interval values are positive integers when used
- preferred time uses `HH:mm` when provided
- timezone is a valid IANA timezone when a routine is saved

Database constraints should protect:

- routine ownership through `user_id`
- routine group ownership through `user_id`
- active routine group names are unique per user
- one rule per routine
- one routine instance per routine/date/time combination
- allowed routine instance statuses
- reminder timestamps on routine instances
- end date not before first start date
- positive interval values when present
- valid day-of-month range when present
- timezone is present as a non-empty text value

Do not rely on read-before-insert checks alone for routine instance generation.
The unique schedule index must protect concurrent generation of the same
routine occurrence.

## Deletion Behavior

Routine delete actions are soft deletes.

Current rules:

- `routines.deleted_at` marks a routine deleted
- normal routine lists and Today rows show only routines where
  `deleted_at IS NULL`
- deleted routines are excluded from future instance generation
- existing historical routine instances remain available for review/history
  unless a future cleanup command explicitly removes them
- hard delete should only be used as explicit cleanup and should remove related
  rule and instance data intentionally

Do not add a lifecycle `status` column to `routines`. Routine instance status is
separate and remains on `routine_instances`.

## `routines`

Stores the repeatable routine definition.

Current fields:

- `id`
- `user_id`
- `group_id`
- `title`
- `description`
- `first_start_date`
- `end_date`
- `created_at`
- `updated_at`
- `deleted_at`

Field rules:

- `title` is required.
- `description` is optional and stored as `NULL` when omitted.
- `group_id` is optional and points at a routine group owned by the same user.
- Generated default description copy is render-only and must not be stored in
  the database.

Removed routine fields:

- `status`

## `routine_groups`

Stores optional parallel buckets for routine definitions.

Routine groups are different from project milestones. Groups are unordered
life-area filters such as English learning, PTE practice, or housework.
Milestones remain ordered project phases.

Current fields:

- `id`
- `user_id`
- `name`
- `description`
- `created_at`
- `updated_at`
- `deleted_at`

Current rules:

- group names are required and 1-80 characters
- descriptions are optional and 500 characters or fewer
- active group names are unique per user, case-insensitively
- deleting a group is a soft delete
- when a group is deleted, active routines in that group move to no group
- no built-in routine groups exist yet

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
- `timezone` stores an IANA timezone such as `Australia/Melbourne`, not a fixed
  UTC offset. This allows future reminder code to handle daylight-saving
  changes. Dates remain plain date keys for now.

## `routine_instances`

Stores concrete routine occurrences.

Current fields:

- `id`
- `user_id`
- `routine_id`
- `scheduled_date`
- `scheduled_time`
- `remind_at`
- `reminded_at`
- `moved_at`
- `moved_from_date`
- `status`
- `completed_at`
- `skipped_at`
- `created_at`
- `updated_at`

Current statuses:

- `pending`
- `completed`
- `skipped`

`skipped` remains readable for compatibility, but current dashboard UI does not
create new skipped rows. Future reminder responses should prefer `Later` and
`Move to tomorrow` instead of treating skip as a first-class current action.

Reminder fields:

- `scheduled_date` is the local date this occurrence belongs to.
- `scheduled_time` is the planned local clock time for this concrete
  occurrence. It is resolved from `routine_rules.preferred_time`, or `18:00`
  when preferred time is empty.
- `remind_at` is the exact timestamp when Discord reminder delivery should be
  attempted.
- `reminded_at` is set only after the reminder send succeeds.
- `moved_at` and `moved_from_date` are reserved for moving a pending occurrence
  to another day.

Current database protection:

- `user_id` references `users.id`.
- `routine_id` references `routines.id`.
- status is constrained to `pending`, `completed`, or `skipped`.
- unique schedule index prevents duplicate instances for the same
  routine/date/time.
- due reminder index covers pending rows with `remind_at` set and
  `reminded_at` empty.
- move metadata requires `moved_from_date` to have `moved_at`.

## `completion_events`

Routine completion and skip actions should create immutable completion history
for daily review.

Current routine event target:

- target type: `routine_instance`
- target id: the routine instance id

The latest state remains on `routine_instances`. Event history records what
happened.

## Reminder Delivery

Routine reminder delivery is implemented through the shared Discord
notification service and `discord_message_deliveries`.

The first reminder sender:

- scans active routines
- resolves each routine's stored timezone, preferred time, and `18:00` fallback
- ensures routine instances only when their `remind_at` is inside the due
  window
- queries pending routine instances by `remind_at`
- sends only pending instances
- sets `reminded_at` after successful Discord delivery
- uses the routine instance id and `remind_at` in the Discord delivery
  idempotency key

No separate routine reminder table exists yet. `discord_message_deliveries`
records the outbound Discord delivery result.

## Migration Direction

Historical migrations still show the old routine lifecycle shape:

- `0003_create_routines.sql` created `routines.status`.
- `0019_make_description_fields_nullable.sql` made routine descriptions
  nullable.
- `0020_add_timezone_preferences.sql` reserves user settings columns for the
  pending timezone-preference UI.
- `0021_database_deletion_governance.sql` adds `routines.deleted_at`, backfills
  deleted rows from the old `status = 'deleted'` value, drops the old lifecycle
  status column, and replaces the active-routine index.
- `0022_add_routine_reminder_state.sql` adds instance-level reminder and move
  metadata, backfills pending `remind_at` values, and adds the due-reminder
  index.
- `0026_create_routine_groups.sql` adds optional `routine_groups` and
  `routines.group_id`.

Because migration history is immutable, do not edit old migration files to
match the current model. Add a follow-up migration when schema governance
changes again.
