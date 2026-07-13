# Projects Data Model

This document defines the product entities and SQL direction for Projects,
Milestones, Tasks, and Subtasks. UI behavior is documented in [ui.md](ui.md).

## Entity Ownership

All project records are user-owned.

The Core layer owns:

- projects
- milestones
- tasks
- subtasks
- task dependencies
- completion history

The scheduler may select tasks for a day, but the scheduler must not own
project structure.

## Projects

`projects` stores the top-level initiative.

Recommended fields:

- `id`
- `user_id`
- `title`
- `objective`
- `importance_reason`
- `status`
- `priority`
- `start_date`
- `deadline_date`
- `expected_duration_days`
- `created_at`
- `updated_at`
- `completed_at`
- `archived_at`

Field rules:

- `title` is required.
- `objective` is required because it describes what the project is trying to
  accomplish.
- `importance_reason` is strongly recommended because it reminds the user why
  the project matters.
- `start_date` is required.
- `deadline_date` is optional.
- `expected_duration_days` is optional.
- A project can have a deadline, an expected duration, or both.
- If a project has neither a deadline nor expected duration, the UI should allow
  it but mark the project as open-ended.

Statuses:

- `active`: currently relevant.
- `paused`: intentionally stopped for now.
- `completed`: finished.
- `archived`: hidden from normal views.

## Milestones

`project_milestones` stores phase boundaries inside a project.

Recommended fields:

- `id`
- `user_id`
- `project_id`
- `title`
- `objective`
- `status`
- `sort_order`
- `start_date`
- `deadline_date`
- `expected_duration_days`
- `created_at`
- `updated_at`
- `completed_at`
- `archived_at`

Field rules:

- Every task belongs to one milestone.
- Every project should have at least one milestone.
- If the user does not create a milestone, create a default milestone titled
  `Project completion`.
- Milestones can be renamed, reordered, archived, and completed.
- Milestones should stay lightweight. They are phase boundaries, not full
  independent projects.

Statuses:

- `active`
- `paused`
- `completed`
- `archived`

## Tasks

`project_tasks` stores schedulable work under a milestone.

Recommended fields:

- `id`
- `user_id`
- `project_id`
- `milestone_id`
- `title`
- `description`
- `status`
- `priority`
- `scheduled_date`
- `start_date`
- `deadline_date`
- `sort_order`
- `created_at`
- `updated_at`
- `completed_at`
- `skipped_at`
- `blocked_at`
- `archived_at`

Field rules:

- A task belongs to exactly one milestone.
- A task inherits `project_id` through its milestone, but storing `project_id`
  on the task can make common queries simpler.
- A task is schedulable.
- A task can span several days.
- A task should not contain another task as a child. Use subtasks for checklist
  detail.
- Do not expose editable numeric progress fields.

Statuses:

- `todo`
- `doing`
- `blocked`
- `skipped`
- `done`
- `archived`

## Subtasks

`project_subtasks` stores checklist items inside a task.

Recommended fields:

- `id`
- `user_id`
- `task_id`
- `title`
- `description`
- `is_done`
- `sort_order`
- `created_at`
- `updated_at`
- `completed_at`

Field rules:

- A subtask belongs to exactly one task.
- A subtask cannot contain another subtask.
- A subtask is not schedulable.
- A subtask should not have its own deadline, priority, dependencies, or
  reminder delivery.
- Subtask completion updates task progress display, but the scheduler should
  still schedule the parent task.

## Task Dependencies

`project_task_dependencies` stores prerequisite relationships between tasks.

Recommended fields:

- `task_id`
- `depends_on_task_id`
- `created_at`

Rules:

- both tasks must belong to the same user
- both tasks should usually belong to the same project
- prevent self-dependency
- prevent dependency cycles
- the first UI can use simple prerequisite selection, not a graph visualization

## Completion Events

`completion_events` should support task-level history.

Recommended target types:

- `task`

Recommended event types:

- `completed`
- `reopened`
- `blocked`
- `unblocked`
- `skipped`

Subtask toggles can be stored on `project_subtasks` first. Add subtask events
only if review or audit behavior needs them later.

## Migration Direction

The current prototype migration created the previous task feature shape:

- top-level grouping records from the previous prototype
- task records that also represent child checklist items
- editable numeric progress fields

The next implementation should replace that shape with project-oriented tables:

- `projects`
- `project_milestones`
- `project_tasks`
- `project_subtasks`
- `project_task_dependencies`

Because the current branch is still a feature branch, it is acceptable to redo
the migration before merging. Prefer replacing `0004_create_tasks.sql` with the
project schema instead of adding permanent compatibility tables, unless user
data must be preserved.
