# Plans And Tasks

This document defines the Core product rules for plans and tasks. User-visible
web behavior is documented in [tasks-ui.md](tasks-ui.md).

A plan is a long-running personal initiative with many details to track. A
plan can represent things like finding a job, applying for a degree, applying
for a visa, finishing a study program, or completing a work project.

A task is executable work inside or outside a plan. Tasks are smaller than
plans and are suitable for scheduling into today's work.

Use `Plan` as the product term for now. It is broad enough for personal
planning, study, work, and life administration. `Project` can be treated as an
informal synonym in user thinking, but the app should not introduce a separate
Project type unless a future design finds a real difference.

## Boundary

Plans and tasks are Core product data because the user creates, edits,
completes, skips, blocks, schedules, and reviews them.

The plan and task engine owns plan identity, task identity, hierarchy,
prerequisite relationships, status, progress, deadlines, and completion events.
The scheduler may select tasks for a daily plan, but plan and task state remains
owned by the plan and task engine.

The first task feature should not implement the full scheduler, review engine,
reward plugin, Discord reminder delivery, or agent-generated plan
decomposition. It should create the stable task model those later features will
use.

## Scope

The next refactor should include:

- creating and editing plans
- showing a Plans card or Plans section on the Tasks page
- grouping tasks by plan
- creating standalone tasks
- editing task title, description, priority, deadline, and scheduled date
- assigning a task to an optional plan record
- creating and editing child tasks as subtasks
- showing today's task candidates on the dashboard from the database
- showing all normal tasks on a Tasks page
- completing a whole task
- tracking plan progress from completed tasks
- toggling child tasks as done or not done
- blocking, unblocking, skipping, archiving, and deleting tasks
- recording completion events for complete and skip actions

The next refactor should not include:

- automatic daily plan optimization
- calendar drag-and-drop scheduling
- recurring tasks; use routines for repeated work
- Discord task reminders
- reward calculations
- AI plan breakdown
- shareable review cards
- numeric user-facing task weights

## Plans

A plan is a long-running initiative that groups tasks and records the user's
implementation approach. A task may belong to a plan, but standalone tasks must
be allowed because not every useful action starts as a formal plan.

Plans should be user-managed. The user decides the big thing, why it matters,
its deadline, and the rough implementation approach. The system can then help
break that plan into tasks and select which task is useful today.

Plan examples:

- Find a job
- Apply for a degree
- Apply for a visa
- Finish a research paper
- Prepare a final exam
- Launch a small app

The task feature should include real plan records:

- a task may have no plan
- a task may reference an existing plan
- a plan can contain tasks
- a plan can later contain phases or milestones
- a plan can show derived progress from its tasks

Full calendar scheduling, AI plan breakdown, and plan review summaries can wait
for later features.

Plan progress should be derived from the tasks in the plan. Do not store manual
plan progress in the first refactor unless a later design explicitly needs it.

## Plan Record

Recommended fields:

- `id`
- `user_id`
- `title`
- `description`
- `status`
- `priority`
- `deadline_at`
- `created_at`
- `updated_at`
- `completed_at`
- `archived_at`

Plan statuses:

- `active`: currently relevant.
- `paused`: intentionally stopped for now.
- `completed`: finished.
- `archived`: hidden from normal planning views.

Optional later fields or tables:

- plan phases or milestones
- plan notes
- plan review summaries

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
- Do not expose `weight` or `completed_weight` to the user in the next
  implementation. If a future scheduler needs effort scoring, add an internal
  estimate later after the task workflow feels right.

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
- Marking a task `done` should set `completed_at`.
- Reopening a `done` task should clear `completed_at` and normally return it to
  `todo` or `doing`.
- `blocked` should preserve child task state and should not reset completed
  subtasks.
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

## Progress

The next user-facing implementation should not ask the user to enter task
weight or completed weight. Those fields are too abstract for first manual use
and can trigger browser-native localized validation hints in numeric inputs.

First progress rules:

- leaf tasks are either not done or done
- parent task progress is derived from child task completion
- plan progress is derived from task completion
- partial progress should be represented by completed child tasks, phases, or
  checklist items, not by a numeric completed-weight field

When a task has child tasks:

- parent progress should be derived from child task completion
- completing all child tasks should complete the parent
- reopening a child task should reopen the parent unless the parent is archived

When a task has no child tasks:

- use the task's own status

## Child Tasks

Child tasks represent subtasks. They should remain full task records so they can
have status, deadline, and history.

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
- block task
- unblock task
- skip task
- add prerequisite task
- remove prerequisite task

Command behavior:

- validate ownership for every command
- validate status transitions
- update parent derived status or progress after child changes
- write completion events for user-visible progress changes
- return fresh task dashboard and task page data after successful writes

## Dependencies

Some tasks cannot start until another task is finished. These relationships are
prerequisites, not parent-child hierarchy.

Example:

- parent plan: `Apply for a visa`
- prerequisite task: `Receive university offer`
- dependent task: `Submit visa application`

Recommended table:

- `task_dependencies`

Recommended fields:

- `task_id`
- `depends_on_task_id`
- `created_at`

Rules:

- both tasks must belong to the same user
- prevent self-dependency
- prevent dependency cycles
- dependency UI can be simple at first, such as selecting prerequisite tasks in
  the edit dialog
- do not build a graph visualization in the first refactor

## Completion Events

Completion events are immutable history used by the future review engine.

Task events should use:

- target type: `task`
- target id: task id
- event type: `completed`, `reopened`, `blocked`, `unblocked`, or `skipped`
- occurred at timestamp
- source, such as `web`, `discord`, `scheduler`, or `agent`

State tables store the latest state. Completion events store what happened.

## Dashboard Selection

The first database-backed task dashboard should use a simple deterministic
selection, not an AI scheduler.

Dashboard wording should make the relationship to plans clear:

`Today's tasks to fulfill your plans`

Suggested selection inputs:

1. tasks scheduled for the current personal day
2. overdue unfinished tasks
3. tasks from active plans with near deadlines
4. high-priority unfinished tasks with near deadlines
5. prerequisite-ready tasks, meaning their dependencies are done
6. recently updated `doing` tasks
7. a small fallback set of normal `todo` tasks

Dashboard selection should exclude archived tasks and completed tasks by
default. Skipped tasks may remain visible for the same personal day if the UI
needs to show what happened, but they should not be treated as recommended work.

## Database Direction

Use PostgreSQL relational tables.

Recommended first tables:

- `plans`
- `tasks`
- `task_dependencies`
- `completion_events`

The current implementation used numeric `weight` and `completed_weight`. The
next migration should remove those fields from the user-facing model and either
drop them or keep them as ignored legacy columns until a cleanup migration is
safe.

## UI

Task UI behavior is documented in [tasks-ui.md](tasks-ui.md). Keep this file
focused on product rules, data behavior, commands, and event history.
