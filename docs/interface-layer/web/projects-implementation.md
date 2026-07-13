# Projects Web Implementation

This document records the current user-detectable Projects web behavior and the
known conflicts in the first task prototype. Product rules are defined in
[projects/overview.md](../../core-layer/projects/overview.md), data rules are
defined in [projects/data-model.md](../../core-layer/projects/data-model.md),
and UI rules are defined in [projects/ui.md](../../core-layer/projects/ui.md).

## Current Scope

The current web implementation supports database-backed task testing, but it
does not yet match the Project model:

- load dashboard task candidates from Neon
- load normal tasks on the current prototype page from Neon
- add, edit, archive, and delete prototype tasks
- add simple child checklist items while adding or editing a task
- complete, skip, block, and reopen tasks through server actions
- record task completion, partial-completion, and skip events
- show task command failure through shared notifications

The current implementation does not include:

- automatic daily plan optimization
- Discord task reminders
- dependency graph editing
- project management
- milestone management
- AI-generated task breakdown
- reward calculations
- review-card finalization
- removal of legacy numeric progress fields from the UI and schema

## Current User Flow

The user should open the Projects page from the sidebar. The current code still
uses older prototype component names and should be renamed during the project
refactor.

The Projects page should show:

- status filters
- project filters when projects exist
- project list
- selected project detail
- milestone, task, and subtask tree
- `Add` action

`Add project` should open project creation.

Task `Edit` can still use a dialog inside the project detail page.

The next version should make progress come from completed subtasks, completed
tasks, and milestone phases instead of editable numeric progress fields.

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

## Current Code Conflict

The current implementation still follows the previous prototype shape. Before
merging this feature as the stable Project feature, update the code and schema
to match the Project docs:

- use Projects as the user-facing feature surface
- replace the prototype top-level grouping with projects
- add milestones between projects and tasks
- replace child tasks with non-schedulable subtasks
- remove editable numeric progress fields
- remove dashboard standalone task progress visualization

## Code Locations

Project prototype web UI:

```text
apps/web/src/features/dashboard/components/TasksPage.tsx
apps/web/src/features/dashboard/components/TaskCard.tsx
apps/web/src/features/dashboard/components/Dashboard.tsx
```

Project prototype server actions:

```text
apps/web/src/features/tasks/actions.ts
```

Project prototype backend:

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
