# Projects Web Implementation

This document records the current user-detectable Projects web behavior.
Product rules are defined in
[overview.md](overview.md), data rules are defined in
[data-model.md](data-model.md), and UI rules are defined in [ui.md](ui.md).

## Current Scope

The current web implementation supports the first database-backed Project model:

- load Projects, Milestones, and Tasks from Neon
- add and edit projects with a single description field
- add and edit milestones
- add and edit tasks under milestones
- validate calendar dates before database writes
- complete, skip, block, and reopen tasks through server actions
- return project database failures through normal action results instead of a
  Next.js runtime overlay
- record task completion, skip, block, unblock, and reopen events
- show task command failure through shared notifications
- show dashboard task rows for today's selected tasks

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
its tasks and milestone management.

Do not use `ProjectPage` unless the component truly has no list/detail
distinction.

The Projects page should show:

- project list
- `New` action

The Project detail page should show:

- breadcrumb with project switcher
- selected project detail
- flat task list and milestone management
- project, milestone, and task add/edit actions

`New` should open project creation.

Project creation and editing should use one `Description` textarea instead of
separate objective and importance fields. The prompt should guide the user to
write the objective and why the project matters. While the current database
still has `objective` and `importance_reason`, the web layer treats them as one
description field for user-facing behavior.

Project timeline input should use a mode selection:

- `Deadline`: enables a deadline date input and clears duration.
- `Duration`: enables a duration dropdown and clears deadline.

The first duration options are `1-3 months`, `3-6 months`, `6-12 months`, and
`1-3 years`. The web layer maps these ranges to the current numeric
`expected_duration_days` storage until a later database cleanup migration.

Task `Edit` can still use a dialog inside the project detail page.

Progress comes from completed tasks and milestone phases instead of editable
numeric progress fields.

## Dashboard Behavior

The dashboard should show `Today's tasks to move projects forward`. It should
load task candidates from the database for signed-in users.

Dashboard task rows support:

- static read-only task summary rows
- left-side `Done` checkbox
- title, description, and supporting metadata

Checking `Done` uses optimistic UI. Dashboard task rows must not expose edit,
expand, collapse, or task-management detail controls. If the backend rejects
the command, the previous visible state is restored and the shared notification
component shows the error.

Dashboard task rows should not show standalone project progress visualization,
editable numeric progress, or colored tag chips.

## Current UI Structure

The app shell owns navigation and page switching:

```text
AppShell
  Sidebar
  page title bar
  Dashboard or ProjectsPage
  NotificationStack
```

When `activeView` is `projects`, `AppShell` renders `ProjectsPage` as the page
body under the shared page title bar.

### Projects Page Component Tree

`ProjectsPage` owns project-management state for the selected project and open
editor dialogs. It switches between the list page and the detail page inside the
existing dashboard view.

```text
ProjectsPage
  ProjectsList, when no project is selected for detail view
  ProjectDetailPage, when a project is selected for detail view
  ProjectEditorDialog, when adding or editing a project
  MilestoneEditorDialog, when adding or editing a milestone
  ProjectTaskEditorDialog, when adding or editing a task
```

The project list and project detail are separate user-visible pages. Do not use
a permanent side-by-side list/detail grid for this flow.

### Project List Layout

`ProjectsList` is the first Projects page. It uses one shared `Panel`.

Top header:

- parent layout: horizontal flex with wrapping
- left group: `Projects` title, then the descriptive sentence below it
- right group: secondary `New` button
- icon: `Plus`

List body:

- parent layout: vertical grid
- empty state: `No projects yet. Add a project for a larger goal.`
- item parent component: shared `ListItem` with row layout
- item first line: project title only
- item second line: truncated description
- item third line: timeline text and progress text
- item right action: outlineless right-arrow button
- do not render milestone preview rows or task rows on the list page

Clicking only the right-arrow button opens the detail page. The whole project
item is not clickable. Do not add a text `View` button or footer action inside
project list items. The list page does not show task rows.

### Project Detail Layout

`ProjectDetailPage` is the second Projects page. It uses one shared `Panel`.

Breadcrumb row:

- layout: horizontal flex with wrapping
- first item: `Projects`, which returns to the list page
- divider: `/`
- second item: project name switcher
- switching through the project name keeps the user on the detail page
- title action: `Edit3` icon plus `Edit`, placed to the right of the
  breadcrumb and opening the project editor dialog

Project overview card:

- card title: `Overview`
- first row: labeled description block with label `Description`
- metadata rows: `Start date` and `Timeline`
- start date value uses English display format, not raw `YYYY-MM-DD`
- do not repeat the project title inside this card because the page title
  already shows it
- no card-level edit action; project edit belongs beside the page title
- do not show colored status or priority tags

Milestone management card:

- parent layout: vertical grid
- location: right panel, below `Overview`
- milestone parent component: shared `ListItem`
- milestone header layout: horizontal flex with wrapping
- milestone left group: title, then objective or progress text
- milestone right group: `Edit` with `Edit3`
- do not render task rows inside milestone rows

Task list:

- location: main left panel
- parent card title: `Tasks`
- header action: `New` with `Plus`
- rows are flat task rows, not nested under milestone sections
- task sort order: not-done tasks first, then `deadlineDate` ascending with
  empty deadlines last, then `startDate` ascending
- sorting happens when data is loaded/refreshed or after adding/editing a task;
  checking or unchecking `Done` must keep the current visible row order

Task row layout:

- parent surface: shared `ListItem`
- row direction: three columns
- left column: `Done` checkbox
- middle column: title, description, then optional `milestone · deadline`
  metadata
- right column: `Edit`
- do not show task status tags, priority tags, or Block/Skip actions in the
  first UI
- checking `Done` or unchecking it uses optimistic UI without disabling the row,
  the clicked checkbox, or other controls, updates derived task progress text
  immediately, and rolls back with a shared notification if the backend rejects
  the latest command

### Project Editor Dialog Layout

`ProjectEditorDialog` and `MilestoneEditorDialog` share `DialogShell`.

Dialog shell:

- parent overlay: `DialogOverlay`
- backdrop: `DialogBackdrop`
- frame: `DialogFrame`
- top row: `DialogHeader`
- save and delete failures use `NotificationStack`; do not render page-local or
  dialog-local inline action messages
- field area: vertical grid
- footer: `DialogActionRow` with one full-width primary `Save` button
- save icon: `Save`
- loading icon: animated `LoaderCircle`
- existing project, milestone, and task edit dialogs also show a full-width
  secondary `Delete` button below `Save`
- `Delete` opens shared `ConfirmDialog`; confirmation uses the standard primary
  button style and deletes only after backend success

Project field order:

- `Title` text input
- `Description` textarea with neutral placeholder copy, such as
  `Describe the goal, context, and why it matters.`
- `Timeline` segmented buttons: `Deadline`, `Duration`
- date/duration fields: two columns on desktop, stacked on mobile
Project and task priority are intentionally hidden in the first UI. Hidden
priority values default to `medium`; do not render priority selectors.

Milestone field order should mirror the project editor where the data model
overlaps:

- `Title` text input
- `Objective` textarea
- `Timeline` segmented buttons: `Deadline`, `Duration`
- date/duration fields: two columns on desktop, stacked on mobile
- do not use a typed `Duration days` number field in the milestone dialog

`ProjectTaskEditorDialog` uses its own vertical dialog layout:

- basics group: title, description
- meta group: milestone selector, start date, deadline
- milestone selector defaults to `No milestone`; choosing a milestone is
  optional
- do not render a scheduled date field in the task dialog
- do not render done/not-done controls in the task dialog; completion belongs
  to task rows and the dashboard Project Tasks panel
- do not render priority, status tag, or child checklist fields in the task
  dialog

### Dashboard Project Tasks Panel Layout

`Dashboard` renders the project task panel as the main left dashboard panel:

```text
Dashboard
  ProjectTasksPanel
    CardHeader(Check, "Today's tasks to move projects forward")
    ProjectTaskRow[]
  right aside
    routines Panel
    PinnedMemoriesPanel
```

`ProjectTasksPanel` owns the dashboard task section. `ProjectTaskRow` owns the
dashboard view of one task.

Task row:

- parent element: shared `ListItem`
- row layout: left completion checkbox, then task content
- text group direction: vertical
- first line: task title
- second line: task description, always visible
- third line: supporting metadata as `project · milestone · deadline`,
  omitting the milestone segment when the task has no milestone
- no chevron
- no expanded content
- no dashboard edit action

## Code Locations

Project web UI:

```text
apps/web/src/features/projects/components/ProjectsPage.tsx
apps/web/src/features/projects/components/ProjectDetailPage.tsx
apps/web/src/features/projects/components/ProjectsList.tsx
apps/web/src/features/projects/components/ProjectTasksPanel.tsx
apps/web/src/features/dashboard/components/Dashboard.tsx
apps/web/src/app-shell/AppShell.tsx
```

Project server actions:

```text
apps/web/src/features/projects/actions.ts
apps/web/src/features/projects/project-date-validation.ts
apps/web/src/features/projects/project-database-errors.ts
```

Project backend:

```text
apps/web/src/features/projects/server/
```

Database migrations:

```text
apps/web/database/migrations/0005_create_projects.sql
apps/web/database/migrations/0006_drop_project_subtasks.sql
```

Tests:

```text
apps/web/src/features/projects/__tests__/project-action-helpers.test.ts
apps/web/src/features/projects/__tests__/postgres-project-save-queries.test.ts
apps/web/src/features/projects/__tests__/project-service.test.ts
```

## Database Error Handling

Project server actions should catch database failures and return
`ProjectActionResult` failures. The UI can then keep dialogs open or show shared
notifications instead of exposing a Next.js runtime overlay.

If the database reports that `projects`, `project_milestones`, or
`project_tasks` does not exist, the action message should tell the developer to
run:

```text
pnpm --dir apps/web db:migrate
```

This is especially important after switching to a new Neon database or after
pulling the `0005_create_projects.sql` migration onto an existing database.

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

Completed in the Project implementation branch:

- added `features/projects` for the stable Project model
- replaced the legacy task prototype page with `ProjectsPage` and
  `ProjectDetailPage`
- replaced old plan and numeric-progress UI with project, milestone, and task
  fields
- added Project/Milestone/Task schema in `0005_create_projects.sql`
- added `0006_drop_project_subtasks.sql` after removing the child checklist
  table
- added project action error mapping for missing project migrations
- removed the obsolete task prototype code
