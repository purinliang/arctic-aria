# Event Groups, Recurring Instances, And Work History Plan

Status: implemented through Event Groups, Event rules, Event instances,
next-3 Event and Routine instance generation, split definition/instance
management panels, shared instance filters, and split completion-history
tables.

Remaining later work: none in this goal. Future product work may add richer
Event instance history, reminder delivery, or shortcut recurrence presets after
usage proves a need.

This document was the implementation-ready planning source for the recurrence
goal. It remains the product rationale and a record of the implementation
checklist.

## Starting Facts Before This Goal

Current Events:

- `events` is both the Event definition and the one concrete appointment.
- `event_date` and `event_time` are stored directly on `events`.
- the Events page filters by `All`, `Upcoming`, and `Past`.
- Today shows only Events for the current scheduled board date.

Current Routines:

- `routines` stores the definition.
- `routine_rules` stores recurrence.
- `routine_instances` stores generated concrete actions.
- current Today loading creates routine instances for the current board date,
  not a broader upcoming action plan.

Current work history:

- `completion_events` stores project task and routine instance work-completion
  history.
- Memories do not use `completion_events`; Memories use `memory_events`.
- Calendar Events must not use `completion_events`.

## Product Model

Events and Routines should look structurally similar in the app because both
have definitions and instances. Their actions remain different.

Routine definition:

- repeated flexible work
- no location in v1
- can have group, recurrence rule, preferred time, estimated duration, and
  description

Routine instance:

- one concrete scheduled routine action
- can be completed, reopened, missed/skipped, moved, or done at another time
- can remain useful even when the exact planned time was not followed

Event definition:

- fixed external appointment series
- can have group, recurrence rule, default scheduled time, default location,
  estimated duration, and description
- represents appointments with outside dependency, such as customer work,
  classes, meetings, bookings, deadlines, or supervisor commitments

Event instance:

- one concrete appointment
- can be rescheduled, canceled, or given a one-off location override
- should not be casually moved to tomorrow as a completion strategy

Event Group:

- optional folder for related Event definitions
- examples: school tutorials, student lessons, customer meetings, weekly
  reports
- groups related series but does not own recurrence or a required location

Modeling rule:

- different predictable time, location, customer, class, or channel should be
  separate Event definitions inside one Event Group.
- one-off changes belong on the Event instance.

## Event Recurrence

Event rules should support exactly these rule types in the first recurring
Event version:

- `once`
- `daily`
- `weekly`

Do not add monthly, yearly, every-N-days, or multi-slot Event rules in this
plan.

Rule behavior:

- `once`: one Event instance on `events.start_date`.
- `daily`: one Event instance per local day while the Event definition is
  active.
- `weekly`: one Event instance on one selected weekday per week while active.

Weekly rules:

- one Event definition has one weekly rule.
- one weekly rule has one weekday and one scheduled time.
- multiple weekly sessions should be separate Event definitions in the same
  Event Group.

Daily rules:

- daily is valid for externally constrained appointments that really happen
  every day.
- daily is not the model for "weekdays only" in v1. If a weekday-only pattern is
  needed, create separate weekly Event definitions inside one Event Group until
  the product clearly needs a weekday shortcut.

## Implemented Data Model

The target schema separates Event definitions, Event rules, Event instances,
and Event groups.

### `event_groups`

Purpose: optional grouping for related Event definitions.

Fields:

- `id`
- `user_id`
- `name`
- `description`
- `created_at`
- `updated_at`
- `deleted_at`

Rules:

- soft delete through `deleted_at`
- active group names should be unique per user, case-insensitively
- deleting a group should move active Events in the group to no group
- no required location field

### `events`

Purpose: Event definition table.

Implemented changes:

- add optional `group_id`
- add or migrate to `start_date`
- add optional `end_date`
- keep title, description, estimated duration, default location, ownership,
  timestamps, and soft delete
- stop treating this table as the only concrete scheduled row after
  `event_instances` exists

Default location:

- `events.location` remains the default location/channel for the Event series.
- instance display should use `event_instances.location_override` first, then
  fall back to `events.location`.

### `event_rules`

Purpose: one recurrence rule per Event definition.

Fields:

- `id`
- `event_id`
- `rule_type`: `once`, `daily`, or `weekly`
- `scheduled_time`
- `weekday`
- `timezone`
- `created_at`
- `updated_at`

Rules:

- one rule per Event definition
- `weekday` is required only for `weekly`
- `weekday` is null for `once` and `daily`
- timezone stores an IANA timezone

### `event_instances`

Purpose: concrete generated appointment rows.

Fields:

- `id`
- `user_id`
- `event_id`
- `rule_date`
- `rule_time`
- `scheduled_date`
- `scheduled_time`
- `location_override`
- `status`: `scheduled` or `canceled`
- `canceled_at`
- `cancellation_reason`
- `rescheduled_at`
- `reschedule_reason`
- `created_at`
- `updated_at`

Field meaning:

- `rule_date` and `rule_time` store the generated slot from the Event rule.
- `scheduled_date` and `scheduled_time` store the current real appointment.
- `location_override` stores an instance-specific location only when it differs
  from `events.location`.

Rewrite rules when an Event definition changes:

- past Event instances stay unchanged
- canceled Event instances stay unchanged
- rescheduled Event instances stay unchanged
- future uncustomized Event instances may be deleted and regenerated
- `rule_date` and `rule_time` stay useful for audit and duplicate protection

### Routine Tables

Keep the existing Routine table split:

- `routines`
- `routine_rules`
- `routine_instances`

Implemented Routine behavior changes:

- generate upcoming routine instances beyond Today
- generate at most the next 3 future instances per active routine
- do not add routine location in v1
- do not rewrite completed, moved, or otherwise customized routine instances
  when a Routine definition changes

## Instance Generation

Routines and Events should both support a short future action plan.

Shared generation rule:

- generate at most the next 3 future Event instances per active Event
  definition
- generate at most the next 3 future Routine instances per active Routine
- generation should be lazy/top-up
- database uniqueness must prevent duplicate rule-generated instances

Generation entry points:

- Today load
- Events page load
- Routines page load
- reminder/cron paths
- save/update definition paths

Today remains date-scoped:

- Today still shows only the current scheduled board date.
- Today does not become the full instance browser.

## Instance Filters

Events and Routines should use the same four instance filters:

- `All`
- `Recent`
- `Future`
- `Past`

Date reference:

- compute ranges from the user's scheduled board date
- do not use raw browser midnight as the boundary

Filter ranges:

- `All`: all visible instances
- `Recent`: yesterday through three days after today
- `Future`: four or more days after today
- `Past`: two or more days before today

Range notation:

- `Recent`: `-1, 0, +1, +2, +3`
- `Future`: `>= +4`
- `Past`: `<= -2`

Default:

- use `Recent` for both Events and Routines management pages after instance
  views exist

## UI Direction

Events and Routines management pages should split definitions and instances
into separate panels.

Events page:

- Event Definitions panel
  - list and edit Event definitions
  - show group, rule summary, default location, and estimated duration
  - create, edit, and delete Event Groups
  - create, edit, and delete Event definitions

- Event Instances panel
  - list generated Event instances
  - use `All`, `Recent`, `Future`, `Past`
  - display scheduled date/time and effective location
  - later support reschedule and cancel actions
  - use location override first, then default Event location

Routines page:

- Routine Definitions panel
  - existing routine definition list/editor conceptually belongs here
  - show group, rule summary, preferred time, and estimated duration

- Routine Instances panel
  - list generated Routine instances
  - use `All`, `Recent`, `Future`, `Past`
  - support complete/reopen now where possible
  - later support move/miss actions
  - no location field

## Completion History Split

`completion_events` is a poor long-term name because this codebase also has the
calendar Events feature. Do not use it for calendar Events.

Target tables:

- `project_task_completion_events`
- `routine_completion_events`

Do not create another shared target-polymorphic completion table. Project task
completion history and routine completion history should be separate tables.

`project_task_completion_events` fields:

- `id`
- `user_id`
- `task_id`
- `event_type`: `completed`, `reopened`, `blocked`, or `unblocked`
- `previous_completed_weight`
- `new_completed_weight`
- `occurred_at`
- `source`

`routine_completion_events` fields:

- `id`
- `user_id`
- `routine_instance_id`
- `event_type`: `completed`, `skipped`, or `reopened`
- `occurred_at`
- `source`

Implemented migration direction:

- create both new tables
- backfill `completion_events` rows where `target_type = 'task'` into
  `project_task_completion_events`
- backfill `completion_events` rows where `target_type = 'routine_instance'`
  into `routine_completion_events`
- update Project write paths to use `project_task_completion_events`
- update Routine write paths to use `routine_completion_events`
- update docs and tests
- stop writing to `completion_events`
- drop or retire `completion_events` only after no reads/writes remain

Memory history:

- Memories stay separate on `memory_events`
- do not merge memory history into the new completion tables

Calendar Event lifecycle history:

- do not store Event reschedule/cancel history in completion tables
- current Event instance state can live on `event_instances`
- if immutable audit is later needed, add `event_instance_history`

## Implementation Order

Implemented branch sequence:

1. Update this planning doc and related doc references.
2. Split `completion_events` into project and routine completion history
   tables.
3. Add Routine next-3 upcoming instance generation and Routine instance
   filters.
4. Add Event Groups, Event rules, Event instances, and backfill current Events.
5. Add Event next-3 upcoming instance generation.
6. Add split definition/instance panels for Routines and Events.
7. Add Event instance reschedule/cancel and location override actions.

Keep each branch focused and commit after each coherent migration or UI step.

## Implementation Tests

Completion history tests:

- existing task completion rows backfill to `project_task_completion_events`
- existing routine rows backfill to `routine_completion_events`
- Project writes no longer insert into `completion_events`
- Routine writes no longer insert into `completion_events`
- Memories still use `memory_events`

Routine tests:

- next-3 routine instance generation
- no duplicate generated routine instances under concurrent ensure behavior
- completed/moved/customized routine instances are not overwritten
- `All`, `Recent`, `Future`, `Past` filter helper behavior

Event tests:

- current one-time Events backfill to Event definition, rule, and instance
- `once`, `daily`, and `weekly` generation
- next-3 Event instance generation
- no duplicate generated Event instances
- rescheduled/canceled Event instances are not overwritten
- location override falls back correctly
- Event Group create/edit/delete behavior
- `All`, `Recent`, `Future`, `Past` filter helper behavior

Full validation before merge:

- `git diff --check`
- focused feature tests
- `pnpm --dir apps/web test`
- `pnpm --dir apps/web lint`
- `pnpm --dir apps/web build`
- `pnpm --dir apps/web database:migrate` when migrations are added
