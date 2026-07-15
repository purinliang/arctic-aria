# Projects Data Model

This document defines the product entities and SQL direction for Projects,
Milestones, and Tasks. UI behavior is documented in [ui.md](ui.md).

## Entity Ownership

All project records are user-owned.

The Projects feature owns:

- projects
- milestones
- tasks
- task dependencies
- completion history

The scheduler may select tasks for a day, but the scheduler must not own
project structure.

## Validation And Consistency

Projects uses the shared database integrity rules from
[../../infrastructure/database.md](../../infrastructure/database.md).

Backend validation should check single-row user input before persistence:

- required title and description fields
- title and description length
- valid status values exposed by the current command
- valid date strings
- deadline not before start date
- exactly one project timeline mode: deadline or duration
- milestone and task ownership before user-visible edits

Database constraints should protect durable consistency:

- `project_milestones.project_id` must reference an existing project.
- `project_tasks.project_id` must reference an existing project.
- `project_tasks.milestone_id`, when present, must reference an existing
  milestone.
- status and priority columns should be constrained to allowed values.
- date-order and positive-duration rules should be protected with check
  constraints where practical.
- task dependencies should prevent duplicate dependency pairs and self
  dependency.

When the database rejects a write, the backend should translate known failures
into user-facing messages. Do not expose raw SQL errors in the UI.

Deletion behavior:

- The current web UI uses archive commands for project, milestone, and task
  deletion.
- Archived project records stay in the database but are hidden from normal
  project lists, project detail views, dashboard task rows, and scheduler
  candidates.
- Archiving a milestone should also archive or detach the visible task rows
  according to the implemented repository behavior; the current PostgreSQL
  repository archives tasks assigned to the archived milestone.
- A future hard-delete command should refuse deleting a non-empty project or
  milestone by default.
- Cascade cleanup must be explicitly documented before it is used for
  user-visible project data.

Concurrency behavior:

- Do not rely on read-before-write checks alone for future unique project data.
- If a future feature adds unique project names, unique milestone slugs, task
  dependency keys, or ordering keys, protect them with database constraints and
  handle conflicts in backend actions.

## Projects

`projects` stores the top-level initiative.

Recommended fields:

- `id`
- `user_id`
- `title`
- `description`
- `status`
- `priority`
- `start_date`
- `deadline_date`
- `duration_range`
- `created_at`
- `updated_at`
- `completed_at`
- `archived_at`

Field rules:

- `title` is required.
- `description` is required. It combines what the project is trying to
  accomplish and why it matters to the user.
- `start_date` is required.
- `deadline_date` is optional.
- `duration_range` is optional.
- A project must use exactly one timeline mode: either `deadline_date` or
  `duration_range`.
- The first duration ranges are `1-3 months`, `3-6 months`, `6-12 months`, and
  `1-3 years`.
- Do not expose free numeric duration input in the first UI.
- `priority` is retained in storage for now, but the first UI must not expose a
  priority selector or priority tag. New hidden project priority defaults to
  `medium`.

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

- Milestones are optional phase boundaries.
- A project can have zero milestones.
- Project creation must not create a default milestone.
- Tasks can exist without a milestone.
- Milestones can be renamed, reordered, archived, and completed.
- Milestones should stay lightweight. They are phase boundaries, not full
  independent projects.

Statuses:

- `active`
- `paused`
- `completed`
- `archived`

## Tasks

`project_tasks` stores schedulable work under a project, with an optional
milestone pointer.

Recommended fields:

- `id`
- `user_id`
- `project_id`
- `milestone_id`, nullable
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

- A task belongs to exactly one project.
- A task can optionally point to one milestone in the same project.
- If `milestone_id` is null, UI metadata should omit the milestone segment.
- A task is schedulable.
- A task can span several days.
- A task should not contain another task as a child.
- Do not expose editable numeric progress fields.
- `scheduled_date` is retained in storage for compatibility, but the first UI
  must not expose a scheduled-date selector.
- `priority` is retained in storage for now, but the first UI must not expose a
  priority selector or priority tag. New hidden task priority defaults to
  `medium`.

Statuses:

- `todo`
- `doing`
- `blocked`
- `skipped`
- `done`
- `archived`

First-stage UI rule:

- Keep the stored status enum for compatibility, but expose only a done/not-done
  checkbox for tasks. The UI should map checked to `done` and unchecked to
  `todo`.

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
- prerequisite selection is planned for later; the current first UI does not
  expose dependency editing

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

Do not add task-child completion events in the current design. The current
schedulable unit is the task.

## Migration Direction

The current prototype migration created the previous task feature shape:

- top-level grouping records from the previous prototype
- task records that also represent child checklist items
- editable numeric progress fields

The next implementation should replace that shape with project-oriented tables:

- `projects`
- `project_milestones`
- `project_tasks`
- `project_task_dependencies`

Because some local and Neon databases may already have recorded
`0004_create_tasks.sql` as applied, the current implementation uses
`0005_create_projects.sql` to replace the prototype tables with the Project
schema. The migration drops the old prototype `plans` and `tasks` tables and
creates the Project tables above.

`0006_drop_project_subtasks.sql` drops the removed `project_subtasks` table for
development databases that already ran the earlier project migration. Task
dependency storage remains a future direction; the current first UI does not
expose dependency editing.

Current compatibility note:

- `0005_create_projects.sql` still has `objective`, `importance_reason`, and
  `expected_duration_days` columns.
- The web UI treats project description as one user-facing field and maps it
  into the current columns until a later cleanup migration renames the storage
  columns.
- The web UI treats duration as a dropdown range and maps the selected range to
  the current numeric `expected_duration_days` storage until the cleanup
  migration adds a native `duration_range` column.
