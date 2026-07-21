# Daily Board Scheduling Redesign

Status: partially implemented. Routine reminder timestamps, due-window cron
selection, reminder delivery idempotency, and project task daily selections are
implemented. Routine `Later` and `Tomorrow` actions remain future work.

## Boundary

Routines and project tasks both appear on Today, but they need different data
models:

- routines generate concrete occurrences from recurrence rules
- project tasks are selected onto a daily board

Daily Review is not a routine. It only shares the Cloudflare cron route and
Discord notification service. Its duplicate protection can continue to use
`discord_message_deliveries` with `daily-review:<date>` unless Daily Review
becomes a first-class persisted feature later.

Important Today board invariant:

- completed routine instances should stay visible on Today until the local
  daily board date changes
- completed project tasks should stay visible on Today when they have a
  `project_task_daily_selections` row for the current local date

Server-side Today queries must resolve the current local date from the app
user's stored timezone first. If the user preference is `system`, use
`user_settings.resolved_timezone`, which is the last concrete browser-resolved
IANA timezone synced by the web app. Falling back to UTC is allowed only when
no stored concrete timezone exists.

## Shared Naming

Use the same date/time naming rule across both designs:

- `_date`: date only
- `_time`: local clock time only
- `_at`: exact timestamp, either planned or actual

Use `Move to tomorrow` for the full action name and `Tomorrow` for a compact
button label.

Use `Later` for "remind me again in 1 hour".

Avoid `Push to tomorrow` in user-facing text. It is understandable, but
`Move to tomorrow` is more natural English for this product.

## Routine Redesign

### Current Behavior

- `routine_instances` are created when the Today page loads.
- The cron path can also create or ensure a `routine_instance` when it thinks a
  reminder is due.
- Reminder matching currently compares the cron run's local `HH:mm` exactly
  against the routine definition's `preferred_time`.
- Routines without `preferred_time` are ignored by reminder cron.
- Dashboard UI currently exposes only checkbox completion/reopen behavior.

### Purpose

Routine reminders should become reliable with a 15-minute Cloudflare cron
cadence. The current exact-minute check is too fragile because a routine at
`18:00` can be missed if cron runs at `17:58` and then `18:13`.

The redesign should keep routine definitions understandable while making
routine instances the concrete reminder and completion target.

### Data Model Direction

Keep `routine_instances`. It is still the correct table because it stores one
concrete occurrence generated from a recurring routine definition.

Keep both routine-level preference and instance-level schedule:

```text
routine_rules.preferred_time
routine_instances.scheduled_date
routine_instances.scheduled_time
routine_instances.remind_at
routine_instances.reminded_at
routine_instances.moved_at
routine_instances.moved_from_date
```

Meaning:

- `routine_rules.preferred_time`: the user's default clock-time preference for
  future routine occurrences.
- `routine_instances.scheduled_date`: the local calendar day this concrete
  occurrence belongs to.
- `routine_instances.scheduled_time`: the planned local clock time for this
  concrete occurrence.
- `routine_instances.remind_at`: the exact timestamp when Discord should next
  remind the user.
- `routine_instances.reminded_at`: the exact timestamp when the current
  `remind_at` reminder was sent.
- `routine_instances.moved_at`: the exact timestamp when the user moved this
  occurrence.
- `routine_instances.moved_from_date`: the previous `scheduled_date` before
  the move.

Do not remove `scheduled_time`. The routine definition's `preferred_time` is a
preference, while the routine instance's `scheduled_time` is the resolved time
for one occurrence.

### Status Direction

The routine instance status should be simplified:

```text
pending | completed
```

`skipped` should stop being a first-class current UI state if the product uses
`Later` and `Tomorrow` instead. If historical rows already contain `skipped`,
the migration should either map them to `pending` or keep compatibility until a
cleanup migration is safe.

### Reminder Timing

The first reminder should happen once near the routine's preferred time.

Target behavior:

- If `preferred_time` exists, `scheduled_time` should stay equal to that
  preferred time. It is the planned occurrence time shown to the user.
- If `preferred_time` is empty, use `18:00` local time as the fallback
  `scheduled_time`.
- The first `remind_at` should be 30 minutes before the scheduled occurrence.
  It is the exact timestamp cron uses for Discord delivery.
- Cron should treat a reminder as due inside a 25-minute window after
  `remind_at`. This keeps routine reminder scheduling tolerant of the
  15-minute Cloudflare cron cadence.
- Cron should send only when `remind_at <= now`, `reminded_at IS NULL`, and the
  instance is still pending.
- After a successful send, set `reminded_at = now`.
- Later cron runs should stay silent until the user changes the instance, such
  as choosing `Later`.

### User Actions

#### Complete

The checkbox completes the routine occurrence.

```text
status = completed
completed_at = clicked_at
```

Unchecking reopens the occurrence.

```text
status = pending
completed_at = null
```

#### Later

`Later` means "remind me again in 1 hour".

```text
status stays pending
remind_at = clicked_at + 1 hour
reminded_at = null
```

Do not create another routine instance for `Later`. It is the same occurrence
with a new reminder time. `Later` does not change `scheduled_date` or
`scheduled_time`.

#### Tomorrow

`Tomorrow` moves the same occurrence to the next local day.

When the user clicks `Tomorrow`, use the routine definition's latest
`preferred_time` immediately to resolve the moved instance's `scheduled_time`.
If the routine has no `preferred_time`, use `18:00`.

```text
scheduled_date = tomorrow
scheduled_time = latest preferred_time, or 18:00 if preferred_time is null
remind_at = tomorrow scheduled timestamp minus the reminder lead window
reminded_at = null
moved_at = clicked_at
moved_from_date = old scheduled_date
status stays pending
```

The move should avoid duplicate routine rows. If tomorrow's normal generation
would create the same occurrence, it should find the moved instance instead of
creating another one.

### Preference Change Rules

When `routine_rules.preferred_time` changes, update pending future
`routine_instances` for that routine:

```text
scheduled_time = new preferred_time, or 18:00 if preferred_time is null
remind_at = recomputed from scheduled_date and scheduled_time
reminded_at = null
```

Do not touch completed instances.

If the user moves an instance to tomorrow and later changes the routine's
preferred time, the pending moved instance should update to the latest
preferred time. If the user changes preferred time first and then clicks
`Tomorrow`, the moved instance should also use the latest preferred time.

In short: for pending future instances, the latest routine preferred time wins.

### Today Behavior

Today should show routine instances for the current local date, including
completed instances. Completing a routine should update its checkbox state, but
it should not remove the row from Today until the local daily board date
changes.

The backend returns at most six routine instances for Today. Existing
`routine_instances` for the current local scheduled date are loaded first,
including completed instances. If fewer than six existing instances are present,
the backend can create new instances from routine definitions whose recurrence
matches the current local scheduled date.

New or edited routine definitions follow the same rule on the next Today load:
if the routine should occur today and there is room in the six-row board, a
new instance can be created. If a routine instance already exists for today,
editing the routine definition should not hide that instance from Today.
Pending future instances can still have their scheduled time and reminder time
updated from the latest routine preference.

### Cron Flow

One cron route can handle routine reminders and Daily Review delivery.

Routine reminder flow:

```text
Cloudflare cron
  -> web cron route
  -> ensure upcoming routine instances that need reminder timestamps
  -> find pending instances where remind_at is inside the due window
  -> send Discord reminder
  -> set reminded_at when send succeeds
```

Do not add a separate "tomorrow routine creation" cron yet. The reminder cron
can generate or ensure the small set of upcoming routine instances it needs.

### Idempotency

Discord delivery should continue to use `discord_message_deliveries`.

Recommended idempotency key:

```text
routine-reminder:<routine_instance_id>:<remind_at>
```

Including `remind_at` allows the same routine instance to be reminded again
after the user chooses `Later`, while still preventing duplicate sends for the
same reminder moment.

## Project Task Daily Selections

### Purpose

Project tasks also need a daily board selection model so completed tasks can
stay visible on Today after completion, while still allowing a task to be moved
to another day without changing the task itself.

Project tasks should not reuse `routine_instances`. A project task does not
repeat from a recurrence rule, but it can be selected onto a daily board.

### Data Model

Project task daily selections use a lightweight table:

```text
project_task_daily_selections
- id
- user_id
- task_id
- scheduled_date
- created_at
- moved_at nullable
- moved_from_date nullable
- source: manual | scheduler
```

Recommended database protection:

```text
unique(user_id, task_id, scheduled_date)
```

Field meaning:

- `scheduled_date`: the local Today date this task should appear on.
- `created_at`: the exact timestamp when the task was selected for that date.
- `moved_at`: the exact timestamp when the selection was moved away from its
  original date.
- `moved_from_date`: the previous `scheduled_date` before the move.
- `source`: whether the row was created by the user or by future scheduler
  logic.

Do not add `dismissed_at` for now. If the user no longer wants a task on
Today, the first model should move the selection to another date instead of
creating a separate dismissed state.

### Today Behavior

Today task behavior is:

```text
resolve the app user's current local Today date
  -> load project_task_daily_selections for that scheduled_date
  -> join project_tasks
  -> include completed and incomplete tasks
  -> keep completed tasks visible while scheduled_date is today
```

If fewer than six visible task selections exist for today, the backend fills
empty slots from open project tasks that are eligible for automatic scheduling.
An unscheduled task is eligible only when:

- the task is not completed
- the task and project are not deleted
- its milestone, when present, is not deleted
- its start date is empty or not after today
- it has a deadline
- its deadline is within the next five days, including today

The backend returns at most six task rows for Today. If a task is already
selected for today, later edits to its deadline or start date do not remove it
from Today. It stays visible until the scheduled date changes, the task is
deleted, the project is deleted, or a future move/remove command changes the
selection.

This separates:

- task completion: `project_tasks.completed_at`
- task visibility on Today: `project_task_daily_selections.scheduled_date`
- moving a selected task: `moved_at` and `moved_from_date`

The task design reuses the same `_date`, `_time`, and `_at` naming rule.

Daily Review should use the same returned Today rows as the visible Dashboard
panels.

## Implementation Plan

1. Routine reminder due-window behavior is covered by focused tests.
2. Routine instance reminder fields are added by migration.
3. Backend helpers compute local scheduled timestamps and reminder timestamps.
4. Reminder cron selects due `routine_instances` by `remind_at`.
5. Today checkbox behavior keeps working with optimistic UI.
6. Add Discord reminder actions later: `Done`, `Later`, and `Tomorrow`.
7. Add web UI controls only after the backend behavior is stable.
8. Add future move/remove controls for project task daily selections after the
   first stable Today behavior is released.

## Deferred Questions

- Whether historical `skipped` rows should be converted immediately or kept
  readable until a later cleanup.
- Whether the first reminder lead time should stay fixed at 30 minutes or
  become configurable later.
- Whether the Today page should expose `Later` and `Tomorrow`, or reserve them
  for Discord reminder responses first.
- Whether project task daily selections need a separate remove-from-Today state
  later, or whether moving to another date is enough.
