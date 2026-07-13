# Tasks Web Implementation

This document records the current user-detectable Tasks web behavior. Product
rules are defined in [tasks.md](../../core-layer/tasks.md), and UI rules are
defined in [tasks-ui.md](../../core-layer/tasks-ui.md).

## Current Scope

The current web implementation supports database-backed task testing:

- load dashboard task candidates from Neon
- load normal tasks on the Tasks page from Neon
- add, edit, archive, and delete top-level tasks
- add simple child tasks while adding or editing a task
- complete, skip, block, and reopen tasks through server actions
- update task progress by total weight and completed weight
- record task completion, partial-completion, and skip events
- show task command failure through shared notifications

The current task implementation does not include:

- automatic daily plan optimization
- Discord task reminders
- dependency graph editing
- AI-generated task breakdown
- reward calculations
- review-card finalization

## Current User Flow

The user opens the Tasks page from the sidebar.

The page should show:

- status filters
- plan filters when task plans exist
- task list
- `Add` action

`Add` opens a task creation dialog.

Task `Edit` opens a task editing dialog.

`Progress` opens a focused progress dialog for total weight and completed
weight.

## Dashboard Behavior

The dashboard `Today's Tasks` section loads task candidates from the database.
It no longer uses dashboard dummy task data for signed-in users.

Dashboard task cards support:

- expand and collapse
- child task checkboxes
- `Done`
- `Block`
- `Skip`
- `Edit`, which opens the Tasks page for management

`Done`, `Block`, and `Skip` collapse the card immediately and use optimistic
UI. If the backend rejects the command, the previous visible state is restored
and the shared notification component shows the error.

## Code Locations

Task web UI:

```text
apps/web/src/features/dashboard/components/TasksPage.tsx
apps/web/src/features/dashboard/components/TaskCard.tsx
apps/web/src/features/dashboard/components/Dashboard.tsx
```

Task server actions:

```text
apps/web/src/features/tasks/actions.ts
```

Task backend:

```text
apps/web/src/features/tasks/server/
```

Database migration:

```text
apps/web/database/migrations/0004_create_tasks.sql
```

Tests:

```text
apps/web/src/features/tasks/__tests__/task-service.test.ts
```
