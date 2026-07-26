# Projects Web Implementation

This document records the current user-detectable Projects web behavior.
Product rules are defined in
[overview.md](overview.md), data rules are defined in
[data-model.md](data-model.md), and UI rules are defined in [ui.md](ui.md).

## Current Scope

The current web implementation supports the first database-backed Project model:

- load Projects, Milestones, and Tasks from Neon
- add and edit projects with a single optional objective field
- add and edit milestones
- add and edit tasks under projects, with optional milestone assignment
- validate calendar dates before database writes
- complete and reopen tasks through server actions
- return project database failures through normal action results instead of a
  Next.js runtime overlay
- record task completion and reopen events
- show task command failure through shared notifications
- show Today task rows for today's selected tasks
- pin up to three non-deleted projects into the sidebar

The current implementation does not include:

- automatic daily plan optimization
- Discord task reminders
- prerequisite/dependency design
- AI-generated task breakdown
- review-card finalization
- milestone reorder UI
- project pause, resume, and complete UI

## Current User Flow

The user opens the Projects page from the sidebar.

The main sidebar `Projects` item opens the Projects list at `/projects`.
Pinned project shortcuts, when present, appear below it and open their detail
page directly at `/projects/<project-id>`.

## Component Naming

Use `ProjectsPage` for the list and management entry point because it shows the
collection of projects. Use `ProjectDetailPage` for one selected project and
its milestone-focused task view.

Do not use `ProjectPage` unless the component truly has no list/detail
distinction.

The Projects page should show:

- project list
- `New` action
- pin and unpin actions for sidebar shortcuts

The Project detail page should show:

- breadcrumb with project switcher
- selected project detail
- selected milestone task list
- milestone overview and milestone switching
- project, milestone, and task add/edit actions
- project pin or unpin action in the title bar

`New` should open project creation.

Project creation and editing should use one optional `Objective` textarea instead
of separate objective and importance fields. The current database keeps one
nullable `objective` column. The web layer treats it as one user-facing
objective field and renders localized fallback copy when it is missing.

Project timeline input should use a mode selection:

- `Deadline`: enables a deadline date input and clears duration.
- `No fixed deadline`: enables an `Expected duration` dropdown and clears the
  deadline.
- `Start date` is independent from the timeline mode. Render it before the
  timeline selector, then render only the end field controlled by the selected
  mode.

The first duration options are `1-3 months`, `3-6 months`, `6-12 months`, and
`1-3 years`. The web layer maps these ranges to the current numeric
`expected_duration_days` storage until a later database cleanup migration.

Task `Edit` can still use a dialog inside the project detail page.

Progress comes from completed tasks and milestone phases instead of editable
numeric progress fields.

## Today Behavior

Today should show `Tasks`. It should load selected task rows from the database
for signed-in users.

Today task rows support:

- static read-only task summary rows
- left-side `Done` checkbox
- title, description, and supporting metadata

Checking `Done` uses optimistic UI. Today task rows must not expose edit,
expand, collapse, or task-management detail controls. If the backend rejects
the command, the previous visible state is restored and the shared notification
component shows the error.

The checkbox must remain enabled while the backend request is pending so the
user can immediately undo the optimistic state. Do not disable the clicked
checkbox, other Today task checkboxes, or the row navigation action.
Successful checkbox responses stay silent and must not apply a full Today
data refresh to checkbox rows while another lightweight checkbox request may be
in progress. Failed requests roll back only the affected task row when that
failed request is still the latest request for that row.

Today task rows should not show standalone project progress visualization,
editable numeric progress, or colored tag chips.

## Current UI Structure

The app shell owns route-backed navigation and page switching:

```text
AppShell
  Sidebar
  app-routes
  page title bar
  Dashboard or ProjectsPage
  NotificationStack
```

When the current route maps to `projects`, `AppShell` renders `ProjectsPage` as
the page body under the shared page title bar. `/projects` opens the list page.
`/projects/<project-id>` opens the detail page for that selected project. Do
not add or depend on `/project?id=<id>`.

### Projects Page Component Tree

`ProjectsPage` owns project-management state for the selected project and open
editor dialogs. It switches between the list page and the detail page based on
the selected route-backed project id.

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
- item third line: one-line timeline text and progress text, truncated when
  needed on narrow screens
- item right actions: icon-only outline `Pin` or `PinOff` button
- do not render milestone preview rows or task rows on the list page
- keep `min-w-0` shrink constraints on the page wrapper, panel, row, and text
  columns so the full-width list behaves like split layouts on mobile

Clicking only the underlined project title opens the detail page. The whole
project item is not clickable. Do not add a text `View` button or footer action
inside project list items. `Pin` and `Unpin` only update sidebar shortcuts and
must not navigate. The list page does not show task rows.

### Project Detail Layout

`ProjectDetailPage` is the second Projects page. It uses one shared `Panel`.

Breadcrumb row:

- layout: vertical title plus metadata row
- main title: project title on project-level detail, selected milestone title on
  milestone-level detail
- metadata row first item: `Projects`, which returns to the list page
- metadata row divider: `/`
- metadata row second item: project name plus chevron switcher
- clicking the project name keeps the user on or returns the user to
  project-level detail and clears the selected milestone
- clicking the `ChevronDown` button opens the project switcher menu
- the chevron switcher is hidden whenever the page is in the compact stacked
  split-layout mode, using the same `53rem` container breakpoint as the detail
  panels
- when visible, the project switcher menu opens below the chevron button with
  its left edge aligned to the chevron
- project switcher menu width is capped at `24rem` and the viewport width minus
  page padding
- project and milestone timeline metadata are shown in overview panels, not in
  the page title bar
- title action: icon-only outline `Pin` or `PinOff`, updating the sidebar
  shortcut state for the selected project

Project-level overview card:

- card title: `Project Overview`
- location: main left panel
- icon: same `FolderKanban` project icon used by the sidebar
- description: short project-scope/progress hint
- body first line: objective text without an `Objective` label
- body second line: `start date - deadline` for deadline projects, otherwise
  `start date · expected duration` or `start date · open-ended`
- header action: `Edit3` icon plus `Edit`
- body progress: horizontal progress bar with primary task-completion fill and
  secondary elapsed-calendar fill only for deadline projects
- body final line: compact project task completion text

Milestone overview card:

- card title: `Milestone Overview`
- location: milestone-level right panel, above the milestone switcher
- icon: `Flag`
- description: short selected-phase/progress hint
- header action: `Edit3` icon plus `Edit`
- `Edit` opens the selected milestone editor dialog; the `No milestone` group
  has no edit action
- body first line: milestone objective text without an `Objective` label
- body second line: milestone `start date - deadline` for deadline milestones,
  otherwise `start date · expected duration` or `start date · open-ended`
- date values use localized display format, not raw `YYYY-MM-DD`
- body third line: thin progress bar with primary milestone task-completion
  fill and secondary elapsed-calendar fill only for deadline milestones
- body final line: compact milestone task completion text
- do not repeat the milestone title inside this card because the page title
  already shows it
- do not show colored status or priority tags

Milestone switcher card:

- parent layout: vertical grid
- location: right panel; on project-level detail it is the first right panel,
  and on milestone-level detail it is below `Milestone Overview`
- milestone parent component: shared `ListItem`
- milestone header layout: horizontal flex with wrapping
- milestone rows are jump controls, not edit controls
- milestone row text: title only
- milestone rows sort by deadline from earliest to latest, then start date and
  title; milestones without a deadline sort after milestones with a deadline
- if unassigned tasks exist, show a final `No milestone` switch target
- do not render task rows inside milestone rows

Task list:

- location: milestone-level main left panel
- parent card title: `Tasks`
- header action: `New` with `Plus`
- rows show only tasks for the selected milestone switch target
- new tasks default to the selected milestone when a real milestone is selected
- task sort order: `deadlineDate` ascending with empty deadlines last, then
  `startDate` ascending, then title
- completed state does not affect sorting
- sorting happens when data is loaded/refreshed or after adding/editing a task;
  checking or unchecking `Done` must keep the current visible row order

Task row layout:

- parent surface: shared `ListItem`
- row direction: three columns
- left column: `Done` checkbox
- middle column: title, description, then deadline metadata
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
- backdrop: non-interactive `DialogOverlay`; clicking outside the dialog does
  not close add/edit state
- frame: `DialogFrame`
- top row: `DialogHeader`
- save and delete failures use `NotificationStack`; do not render page-local or
  dialog-local inline action messages
- field area: vertical grid
- footer: `DialogActionRow` with one full-width primary `Save` button
- save icon: `Save`
- save pending label: animated `Saving.`, `Saving..`, and `Saving...`; keep the
  full-width button stable and do not show a loading icon
- existing project, milestone, and task edit dialogs also show a full-width
  secondary `Delete` button below `Save`
- `Delete` opens shared `ConfirmDialog`; confirmation uses the standard primary
  button style, changes to static `Deleting...` while pending, avoids animated
  dots in the compact auto-width button, and deletes only after backend success

Project field order:

- `Title` text input
- optional `Objective` textarea with a localized placeholder chosen once when
  the dialog opens
- `Start date` date picker
- `Timeline` segmented buttons: `Deadline`, `No fixed deadline`
- conditional end field below the timeline selector: `Deadline` date picker
  when deadline mode is selected, or `Expected duration` dropdown when no fixed
  deadline is selected
Milestone field order should mirror the project editor where the data model
overlaps:

- `Title` text input
- optional `Objective` textarea with a localized placeholder chosen once when
  the dialog opens
- `Start date` date picker
- `Timeline` segmented buttons: `Deadline`, `No fixed deadline`
- conditional end field below the timeline selector: `Deadline` date picker
  when deadline mode is selected, or `Expected duration` dropdown when no fixed
  deadline is selected
- do not use a typed `Duration days` number field in the milestone dialog

`ProjectTaskEditorDialog` uses its own vertical dialog layout:

- basics group: title, optional description
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
    CardHeader(Check, "Tasks")
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
- no Today edit action

## Code Locations

Project web UI:

```text
apps/web/src/features/projects/components/ProjectsPage.tsx
apps/web/src/features/projects/components/ProjectDetailPage.tsx
apps/web/src/features/projects/components/ProjectsList.tsx
apps/web/src/features/projects/components/ProjectTasksPanel.tsx
apps/web/src/features/dashboard/components/Dashboard.tsx
apps/web/src/app-shell/AppShell.tsx
apps/web/src/app-shell/app-routes.ts
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
apps/database/migrations/0005_create_projects.sql
apps/database/migrations/0006_drop_project_subtasks.sql
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
pnpm --dir apps/web database:migrate
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
