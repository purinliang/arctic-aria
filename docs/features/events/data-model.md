# Events Data Model

This document defines Event persistence, backend validation, and database
constraints. Product behavior is documented in [overview.md](overview.md), and UI
behavior is documented in [ui.md](ui.md).

## Validation And Consistency

Backend validation should check:

- event title is required and 1-120 characters
- event description is optional and 2000 characters or fewer
- event date is a valid `YYYY-MM-DD` date
- event time is a valid `HH:mm` clock time
- estimated duration is optional and, when present, a positive decimal hour
  value up to 24 hours
- location is optional and 500 characters or fewer

Database constraints should protect:

- event ownership through `user_id`
- required title, date, and time
- title, description, location, and estimated-duration bounds
- soft deletion through `deleted_at`

## Deletion Behavior

Event delete actions are soft deletes.

Current rules:

- `events.deleted_at` marks an Event deleted
- normal Events page lists and Today rows show only rows where
  `deleted_at IS NULL`
- past Events remain visible until deleted
- hard delete should only be used as explicit cleanup

## `events`

Stores one-time scheduled items.

Current fields:

- `id`
- `user_id`
- `title`
- `description`
- `event_date`
- `event_time`
- `estimated_duration_hours`
- `location`
- `created_at`
- `updated_at`
- `deleted_at`

Field rules:

- `title`, `event_date`, and `event_time` are required.
- `description`, `estimated_duration_hours`, and `location` are optional and
  stored as `NULL` when omitted.
- `estimated_duration_hours` is stored as a two-decimal-hour value after submit.
- `event_date` and `event_time` are plain local calendar and clock fields. The
  database does not store an Event-specific timezone in the first version.

Indexes:

- `(user_id, event_date, event_time, created_at)` where `deleted_at IS NULL`

## Migration Direction

Migration `0030_create_events.sql` creates the `events` table and active event
schedule index. Migration `0031_events_estimated_duration_hours.sql` adds and
backfills decimal-hour Event duration. Migration
`0032_drop_event_estimated_duration_minutes.sql` removes the legacy Event
minute-duration column.
