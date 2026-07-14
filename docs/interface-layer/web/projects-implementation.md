# Projects Web Implementation

This document records the current user-detectable Projects web behavior.
Product rules are defined in
[projects/overview.md](../../core-layer/projects/overview.md), data rules are
defined in [projects/data-model.md](../../core-layer/projects/data-model.md),
and UI rules are defined in [projects/ui.md](../../core-layer/projects/ui.md).

## Current Scope

The current web implementation supports the first database-backed Project model:

- load Projects, Milestones, Tasks, and Subtasks from Neon
- add and edit projects
- add and edit milestones
- add and edit tasks under milestones
- add and edit subtask checklist items while editing a task
- complete, skip, block, and reopen tasks through server actions
- update subtask checklist state
- record task completion, skip, block, unblock, and reopen events
- show task command failure through shared notifications
- show dashboard task cards for today's selected tasks

The current implementation does not include:

- automatic daily plan optimization
- Discord task reminders
- dependency graph editing
- AI-generated task breakdown
- reward calculations
- review-card finalization
- milestone reorder UI
- project pause, resume, complete, and archive UI

## Current User Flow

The user opens the Projects page from the sidebar.

## Component Naming

Use `ProjectsPage` for the list and management entry point because it shows the
collection of projects. Use `ProjectDetailPage` for one selected project and
its milestone/task/subtask tree.

Do not use `ProjectPage` unless the component truly has no list/detail
distinction.

The Projects page should show:

- project list
- selected project detail
- milestone, task, and subtask tree
- `Add project` action
- milestone and task add/edit actions

`Add project` should open project creation.

Task `Edit` can still use a dialog inside the project detail page.

Progress comes from completed subtasks, completed tasks, and milestone phases
instead of editable numeric progress fields.

## Dashboard Behavior

The dashboard should show `Today's tasks to move projects forward`. It should
load task candidates from the database for signed-in users.

Dashboard task cards support:

- expand and collapse
- subtask checkboxes
- `Done`
- `Block`
- `Skip`
- `Edit`, which opens the Projects page for management

`Done`, `Block`, and `Skip` collapse the card immediately and use optimistic
UI. If the backend rejects the command, the previous visible state is restored
and the shared notification component shows the error.

Dashboard task cards should not show standalone project progress visualization
or editable numeric progress. They can show concise text such as `2 of 5
subtasks done`.

## Code Locations

Project web UI:

```text
apps/web/src/features/projects/components/ProjectsPage.tsx
apps/web/src/features/projects/components/ProjectDetailPage.tsx
apps/web/src/features/projects/components/ProjectsList.tsx
apps/web/src/features/projects/components/ProjectTaskCard.tsx
apps/web/src/features/dashboard/components/Dashboard.tsx
apps/web/src/features/dashboard/components/DashboardHome.tsx
```

Project server actions:

```text
apps/web/src/features/projects/actions.ts
```

Project backend:

```text
apps/web/src/features/projects/server/
```

Database migrations:

```text
apps/web/database/migrations/0005_create_projects.sql
```

Tests:

```text
apps/web/src/features/projects/__tests__/project-service.test.ts
```

## Refactor Status

Completed in `agent/refactor-web-source-organization`:

- moved memory, routine, and task page/card components from dashboard-owned
  folders into their feature folders
- split dashboard data hooks and home composition out of the main dashboard
  component
- split memory, routine, and task page dialogs/lists/helpers out of oversized
  page files
- split PostgreSQL repository mapping/query helpers out of oversized repository
  adapters
- added ESLint enforcement for type-only imports
- kept every `apps/web/src` TypeScript source file below 400 lines

Completed in `agent/feat-projects-implementation`:

- added `features/projects` for the stable Project model
- replaced the legacy task prototype page with `ProjectsPage` and
  `ProjectDetailPage`
- replaced old plan and numeric-progress UI with project, milestone, task, and
  subtask fields
- added Project/Milestone/Subtask schema in `0005_create_projects.sql`
- removed the obsolete task prototype code
