# Tasks

This document defines the Core product rules for tasks and lightweight plan
relationships. User-visible web behavior is documented in
[tasks-ui.md](tasks-ui.md).

Tasks are executable work. A task can be standalone, belong to a long-running
plan, or be a child of another task. Subtasks are not a separate entity type;
they are tasks with `parent_task_id`.

## Boundary

Tasks are Core product data because the user creates, edits, completes,
partially completes, skips, blocks, and reviews them.

The task engine owns task identity, hierarchy, status, weight, progress,
deadline, and completion events. The scheduler may select tasks for a daily
plan, but task state remains owned by the task engine.

The first task feature should not implement the full scheduler, review engine,
reward plugin, Discord reminder delivery, or agent-generated plan
decomposition. It should create the stable task model those later features will
use.

## Scope

The first task feature should include:

- creating standalone tasks
- editing task title, description, priority, deadline, and scheduled date
- assigning a task to an optional plan label or plan record
- creating and editing child tasks as subtasks
- showing today's task candidates on the dashboard from the database
- showing all normal tasks on a Tasks management page
- completing a whole task
- partially completing a task by weight
- toggling child tasks as done or not done
- blocking, unblocking, skipping, archiving, and deleting tasks
- recording completion events for complete, partial-complete, and skip actions

The first task feature should not include:

- automatic daily plan optimization
- calendar drag-and-drop scheduling
- dependency graph UI
- recurring tasks; use routines for repeated work
- Discord task reminders
- reward calculations
- AI plan breakdown
- shareable review cards

## Plans

A plan is a long-running goal that groups tasks. A task may belong to a plan,
but standalone tasks must be allowed.

The first task feature can use lightweight plan support:

- a task may have no plan
- a task may reference an existing plan
- the UI may allow creating a simple plan name while adding or editing a task

Full plan management, plan review, milestones, and plan-level dashboard pages
can wait for a later plan feature.

Plan progress should be derived from the tasks in the plan. Do not store manual
plan progress in the first task feature unless a later design explicitly needs
it.

## Task Record

Recommended fields:

- `id`
- `user_id`
- `plan_id`
- `parent_task_id`
- `title`
- `description`
- `status`
- `priority`
- `weight`
- `completed_weight`
- `deadline_at`
- `scheduled_date`
- `sort_order`
- `created_at`
- `updated_at`
- `completed_at`
- `skipped_at`
- `blocked_at`
- `archived_at`

Field notes:

- `plan_id` is optional.
- `parent_task_id` is optional.
- `deadline_at` is an absolute timestamp. Display it with date and time when
  the time exists.
- `scheduled_date` is the user's intended work date, not a hard deadline.
- `sort_order` is scoped to siblings with the same parent task or to top-level
  tasks in a task list.
- `archived_at` hides the task from normal planning views.
- Delete can be physical delete in the first implementation, but archive is
  safer for user-created work and should be available in the UI.

## Statuses

Allowed task statuses:

- `todo`: captured but not started.
- `doing`: actively in progress.
- `blocked`: waiting on something.
- `skipped`: intentionally not done for the relevant day or plan cycle.
- `done`: completed.
- `archived`: hidden from normal planning views.

Status rules:

- New tasks start as `todo` unless the user explicitly creates them as `doing`.
- A task with `completed_weight = weight` should be `done`.
- Marking a task `done` should set `completed_weight = weight` and
  `completed_at`.
- Reducing `completed_weight` below `weight` should move `done` tasks back to
  `doing` unless the user explicitly chooses another status.
- `blocked` should preserve progress and should not reset completed weight.
- `skipped` means intentionally not done for the relevant context. It does not
  delete the task and does not necessarily mean the whole plan failed.
- `archived` hides the task from normal views and should exclude it from daily
  selection.

## Priority

Allowed task priorities:

- `high`
- `medium`
- `low`

Priority is user intent, not urgency. Urgency should be derived from deadline
and scheduled date. The dashboard can combine priority and urgency when sorting
today's tasks.

## Weight And Progress

Task progress is weight based.

Rules:

- `weight` must be greater than `0`.
- `completed_weight` must be greater than or equal to `0`.
- `completed_weight` must be less than or equal to `weight`.
- Default `weight` is `1`.
- Default `completed_weight` is `0`.
- Partial completion changes `completed_weight` without forcing `done` unless
  `completed_weight` reaches `weight`.

When a task has child tasks:

- parent progress should be derived from child task weights
- direct parent `completed_weight` should not be the primary source of truth
- completing all child tasks should complete the parent
- reopening a child task should reopen the parent unless the parent is archived

When a task has no child tasks:

- use the task's own `weight` and `completed_weight`

## Child Tasks

Child tasks represent subtasks. They should remain full task records so they can
have weight, progress, status, deadline, and history.

First child-task rules:

- a child task belongs to the same user as its parent
- a child task should inherit `plan_id` from the parent by default
- moving a child to another parent should keep user ownership valid
- deleting or archiving a parent should affect child visibility
- prevent cycles in the parent-child graph

The first implementation can limit nesting depth to one visible level in the
web UI even though the data model can support deeper nesting later.

## Commands

The first task service should expose commands rather than letting UI code mutate
tables directly.

Required commands:

- create task
- update task
- archive task
- delete task
- add child task
- reorder child tasks
- complete task
- reopen task
- update partial progress
- block task
- unblock task
- skip task

Command behavior:

- validate ownership for every command
- validate status transitions
- validate weight and completed weight together
- update parent derived progress after child changes
- write completion events for user-visible progress changes
- return fresh task dashboard and task page data after successful writes

## Completion Events

Completion events are immutable history used by the future review engine.

Task events should use:

- target type: `task`
- target id: task id
- event type: `completed`, `partially_completed`, or `skipped`
- previous completed weight
- new completed weight
- occurred at timestamp
- source, such as `web`, `discord`, `scheduler`, or `agent`

State tables store the latest state. Completion events store what happened.

## Dashboard Selection

The first database-backed task dashboard should use a simple deterministic
selection, not an AI scheduler.

Suggested selection order:

1. tasks scheduled for the current personal day
2. overdue unfinished tasks
3. high-priority unfinished tasks with near deadlines
4. recently updated `doing` tasks
5. a small fallback set of normal `todo` tasks

Dashboard selection should exclude archived tasks and completed tasks by
default. Skipped tasks may remain visible for the same personal day if the UI
needs to show what happened, but they should not be treated as recommended work.

## Database Direction

Use PostgreSQL relational tables.

Recommended first tables:

- `plans`
- `tasks`
- `completion_events`

Optional later table:

- `task_dependencies`

Do not add `task_dependencies` until there is a concrete UI or scheduler need.
Parent-child hierarchy is enough for the first task feature.

## UI

Task UI behavior is documented in [tasks-ui.md](tasks-ui.md). Keep this file
focused on product rules, data behavior, commands, and event history.
