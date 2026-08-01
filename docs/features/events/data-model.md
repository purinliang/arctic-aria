# Events Data Model

This document defines Event persistence, backend validation, and database
constraints. Product behavior is documented in [overview.md](overview.md), and UI
behavior is documented in [ui.md](ui.md).

## Validation And Consistency

Backend validation should check:

- event title is required and 1-120 characters
- event description is optional and 2000 characters or fewer
- optional event group id is blank or a valid group owned by the same user
- event group name is required and 1-80 characters
- event group description is optional and 500 characters or fewer
- start date is a valid `YYYY-MM-DD` date
- optional end date is blank or not before the start date
- recurrence rule type is `once`, `daily`, or `weekly`
- event time is a valid `HH:mm` clock time
- timezone is a valid IANA timezone when an Event is saved
- estimated duration is optional and, when present, a positive decimal hour
  value up to 24 hours
- location is optional and 500 characters or fewer

Database constraints should protect:

- event ownership through `user_id`
- event group ownership through `user_id`
- active Event group names are unique per user
- required title, start date, rule, scheduled time, and timezone
- title, description, location, and estimated-duration bounds
- one rule per Event definition
- one Event instance per rule date and rule time
- allowed Event instance statuses
- soft deletion through `deleted_at`

## Deletion Behavior

Event delete actions are soft deletes.

Current rules:

- `events.deleted_at` marks an Event definition deleted
- normal Event definition lists show only rows where `deleted_at IS NULL`
- generated Event instance lists show only instances for active definitions
  whose instance status is not `canceled`
- deleting an Event Group soft-deletes the group and moves active Events in the
  group to no group
- hard delete should only be used as explicit cleanup

## `event_groups`

Stores optional folders for related Event definitions.

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
- when a group is deleted, active Events in that group move to no group

## `events`

Stores Event definitions.

Current fields:

- `id`
- `user_id`
- `group_id`
- `title`
- `description`
- `start_date`
- `end_date`
- `estimated_duration_hours`
- `location`
- `created_at`
- `updated_at`
- `deleted_at`

Field rules:

- `title` and `start_date` are required.
- `group_id`, `description`, `end_date`, `estimated_duration_hours`, and
  `location` are optional and stored as `NULL` when omitted.
- `estimated_duration_hours` is stored as a two-decimal-hour value after submit.
- `end_date` is inclusive and cannot be before `start_date`.

Indexes:

- `(user_id, start_date, created_at)` where `deleted_at IS NULL`
- `(user_id, group_id, start_date)` where `deleted_at IS NULL`

## `event_rules`

Stores recurrence settings for one Event definition.

Current fields:

- `id`
- `event_id`
- `rule_type`
- `scheduled_time`
- `weekday`
- `timezone`
- `created_at`
- `updated_at`

Supported rule types:

- `once`: one Event instance on `events.start_date`
- `daily`: one Event instance per local day while the Event definition is
  active
- `weekly`: one Event instance on the start date weekday each week while active

Current database protection:

- `event_id` references `events.id`.
- `rule_type` is constrained to `once`, `daily`, or `weekly`.
- `scheduled_time` is required.
- `weekday` is required only for weekly rules and must be 0-6 when present.
- `timezone` stores an IANA timezone such as `Australia/Sydney`.
- `event_id` is unique so each Event has one rule.

## `event_instances`

Stores concrete generated Event appointments.

Current fields:

- `id`
- `user_id`
- `event_id`
- `rule_date`
- `rule_time`
- `scheduled_date`
- `scheduled_time`
- `location_override`
- `status`
- `canceled_at`
- `cancellation_reason`
- `rescheduled_at`
- `reschedule_reason`
- `created_at`
- `updated_at`

Current statuses:

- `scheduled`
- `canceled`

Field rules:

- `rule_date` and `rule_time` identify the recurrence slot that generated the
  instance.
- `scheduled_date` and `scheduled_time` identify the current appointment time.
- `location_override` is optional. The effective UI location is
  `location_override` first, then the Event definition's default location.
- `canceled_at` is required when status is `canceled` and must be empty when
  status is `scheduled`.
- cancellation and reschedule reason fields are optional and 500 characters or
  fewer.

Indexes:

- unique `(event_id, rule_date, rule_time)`
- `(user_id, scheduled_date, scheduled_time, created_at)`
- `(event_id, scheduled_date, scheduled_time)`

## Instance Generation

Event page and Today loads lazily ensure up to the next three Event instances
per active Event definition from the current user board date. Save/update also
regenerates upcoming scheduled instances for that definition.

The generator does not rewrite canceled, rescheduled, or otherwise customized
instances. The unique rule-slot index protects concurrent ensure behavior from
creating duplicates.

## Migration Direction

Migration `0030_create_events.sql` creates the `events` table and active event
schedule index. Migration `0031_events_estimated_duration_hours.sql` adds and
backfills decimal-hour Event duration. Migration
`0032_drop_event_estimated_duration_minutes.sql` removes the legacy Event
minute-duration column. Migration `0034_create_event_instances.sql` adds Event
Groups, Event Rules, and Event Instances, renames `event_date` to `start_date`,
adds `end_date`, backfills existing Events as `once` rules and scheduled
instances, and drops the legacy `event_time` column.
