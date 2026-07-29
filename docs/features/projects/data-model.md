# Projects Data Model

This document defines the product entities and SQL direction for Projects,
Milestones, and Tasks. UI behavior is documented in [ui.md](ui.md).

## Entity Ownership

All project records are user-owned.

The Projects feature owns:

- projects
- milestones
- tasks
- completion history

The scheduler may select tasks for a day, but the scheduler must not own
project structure.

## Validation And Consistency

Projects uses the shared database integrity rules from
[../../infrastructure/database.md](../../infrastructure/database.md).

Backend validation should check single-row user input before persistence:

- required title fields
- optional objective/description length
- valid date strings
- deadline not before start date
- exactly one project timeline mode: deadline or no fixed deadline
- milestone and task ownership before user-visible edits

Database constraints should protect durable consistency:

- `project_milestones.project_id` must reference an existing project.
- `project_tasks.project_id` must reference an existing project.
- `project_tasks.milestone_id`, when present, must reference an existing
  milestone.
- date-order and positive-duration rules should be protected with check
  constraints where practical.
- project sidebar pin order, when present, should be constrained to slots 1-3
  and unique per user.

When the database rejects a write, the backend should translate known failures
into user-facing messages. Do not expose raw SQL errors in the UI.

## Deletion Behavior

Project, milestone, and task delete actions are soft deletes.

Current rules:

- deletable project tables use `deleted_at`
- normal project lists, project detail views, Today task rows, pinned
  sidebar shortcuts, and scheduler candidates show only rows where
  `deleted_at IS NULL`
- deleting a project clears its `sidebar_pin_order`
- deleting a milestone soft-deletes its visible tasks
- deleting a task hides it from normal project and Today views
- hard delete is not a user-facing command for project data

Do not add a lifecycle `status` column for project, milestone, or task
visibility. Use `deleted_at` for soft deletion and task-specific timestamps for
task state.

## Concurrency Behavior

- Do not rely on read-before-write checks alone for future unique project data.
- If a future feature adds unique project names, unique milestone slugs, or
  ordering keys, protect them with database constraints and handle conflicts in
  backend actions.
- Sidebar project pinning must remain race-safe. The backend can choose the next
  available slot, but the database must still enforce one pinned project per
  `(user_id, sidebar_pin_order)` slot and return a clear conflict message if
  concurrent requests collide.

## Projects

`projects` stores the top-level initiative.

Current fields:

- `id`
- `user_id`
- `title`
- `objective`
- `start_date`
- `deadline_date`
- `expected_duration_days`
- `sidebar_pin_order`
- `created_at`
- `updated_at`
- `completed_at`
- `deleted_at`

Field rules:

- `title` is required.
- `objective` is optional. It describes what the project is trying to accomplish
  and why it matters to the user.
- Empty objectives are stored as `NULL`. Generated default objective copy is
  render-only and must not be stored in the database.
- `start_date` is required.
- `deadline_date` is optional.
- `expected_duration_days` is optional.
- A project must use exactly one timeline mode: either `deadline_date` or a no
  fixed deadline mode represented by `expected_duration_days`.
- The first duration ranges are `1-3 months`, `3-6 months`, `6-12 months`, and
  `1-3 years`.
- Do not expose free numeric duration input in the first UI.
- `sidebar_pin_order` is optional. When present, it stores the sidebar shortcut
  order for one of the user's pinned projects. Valid values are `1`, `2`, or
  `3`; null means the project is not pinned in the sidebar.
- Deleted projects cannot remain pinned.

Removed project fields:

- `status`
- `priority`
- `archived_at`
- `importance_reason`

## Milestones

`project_milestones` stores phase boundaries inside a project.

Current fields:

- `id`
- `user_id`
- `project_id`
- `title`
- `objective`
- `sort_order`
- `start_date`
- `deadline_date`
- `expected_duration_days`
- `created_at`
- `updated_at`
- `completed_at`
- `deleted_at`

Field rules:

- Milestones are optional phase boundaries.
- A project can have zero milestones.
- Project creation must not create a default milestone.
- `objective` is optional and stored as `NULL` when omitted. Empty milestone
  objectives should render localized default copy without storing generated
  text.
- Tasks can exist without a milestone.
- Milestones can be renamed, reordered, completed, and soft deleted.
- Milestones should stay lightweight. They are phase boundaries, not full
  independent projects.

Removed milestone fields:

- `status`
- `archived_at`

## Tasks

`project_tasks` stores schedulable work under a project, with an optional
milestone pointer.

Current fields:

- `id`
- `user_id`
- `project_id`
- `milestone_id`, nullable
- `title`
- `description`
- `start_date`
- `deadline_date`
- `sort_order`
- `created_at`
- `updated_at`
- `completed_at`
- `deleted_at`

Field rules:

- A task belongs to exactly one project.
- `description` is optional and stored as `NULL` when omitted. Empty task
  descriptions should render localized default copy without storing generated
  text.
- A task can optionally point to one milestone in the same project.
- If `milestone_id` is null, UI metadata should omit the milestone segment.
- A task is schedulable.
- A task can span several days.
- A task should not contain another task as a child.
- Do not expose editable numeric progress fields.
- Task done/not-done state is stored through `completed_at`.
- The UI maps checked to `completed_at = occurred_at` and unchecked to
  `completed_at = NULL`.
- Today visibility is stored separately in `project_task_daily_selections`.
  Completing a task should not remove its scheduled Today row.

Removed task fields:

- `status`
- `priority`
- `scheduled_date`
- `skipped_at`
- `blocked_at`
- `archived_at`

## Task Dependencies

The current schema does not include `project_task_dependencies`.

Prerequisite or dependency behavior is a future design problem. If it returns,
it needs a new data model covering ownership, self-dependency prevention,
cycle prevention, same-project behavior, UI interaction, and migration rules.

## Completion Events

`completion_events` supports task-level history.

Current task event types:

- `completed`
- `reopened`

Do not add task-child completion events in the current design. The current
schedulable unit is the task.

## Project Task Daily Selections

`project_task_daily_selections` stores the project tasks selected for one
Today board date.

Current fields:

- `id`
- `user_id`
- `task_id`
- `scheduled_date`
- `source`
- `created_at`
- `moved_at`
- `moved_from_date`

Field rules:

- `scheduled_date` is the local Today date where the task should appear.
- `source` is `scheduler` for automatic Today filling or `manual` for future
  explicit user selection.
- There can be only one selection per `(user_id, task_id, scheduled_date)`.
- A selected task stays visible on Today after completion.
- A selected task stays visible on Today even if its start date or deadline is
  edited later.
- Deleted tasks, deleted projects, and tasks under deleted milestones do not
  appear on Today.
- Automatic Today filling returns at most six selected project task rows.
- Automatic Today filling only considers open tasks whose start date has
  arrived, whose deadline exists, and whose deadline is within the next five
  days including today.
- If a task is edited before it has been selected, the new date fields decide
  whether it can be selected on the next Today load.
- If a task is edited after it has been selected, the selection remains until a
  future move/remove command changes it or the selected date is no longer
  Today.

## Migration Direction

Historical migrations still show the old task and project prototype shape:

- `0004_create_tasks.sql` created the previous plan/task prototype.
- `0005_create_projects.sql` replaced the prototype tables with project,
  milestone, task, and dependency tables.
- `0006_drop_project_subtasks.sql` removed the abandoned subtask table.
- `0008_allow_project_tasks_without_milestone.sql` made `milestone_id`
  nullable.
- `0009_add_project_sidebar_pins.sql` added sidebar pin slots.
- `0019_make_description_fields_nullable.sql` made user-facing descriptions
  nullable and removed `importance_reason`.
- `0021_database_deletion_governance.sql` standardizes project, milestone,
  task, and routine soft deletion on `deleted_at`, removes project/task
  priority, removes task status variants, removes task scheduled-date storage,
  and drops `project_task_dependencies`.
- `0025_create_project_task_daily_selections.sql` adds stable Today selection
  rows so completed scheduled project tasks do not disappear from Today.

Because migration history is immutable, do not edit old migration files to
match the current model. Add a follow-up migration when schema governance
changes again.
