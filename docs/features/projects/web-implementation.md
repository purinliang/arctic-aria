# Projects Web Implementation

This document records the current user-detectable Projects web behavior.
Product rules are defined in
[overview.md](overview.md), data rules are defined in
[data-model.md](data-model.md), and UI rules are defined in [ui.md](ui.md).

## Current Scope

The current web implementation supports the first database-backed Project model:

- load Projects, Milestones, Tasks, and Subtasks from Neon
- add and edit projects with a single description field
- add and edit milestones
- add and edit tasks under milestones
- add and edit subtask checklist items while editing a task
- validate calendar dates before database writes
- complete, skip, block, and reopen tasks through server actions
- update subtask checklist state
- return project database failures through normal action results instead of a
  Next.js runtime overlay
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
- milestone summaries inside each project list item
- `New` action

The Project detail page should show:

- breadcrumb with project switcher
- selected project detail
- milestone, task, and subtask tree
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
  optional InlineMessage
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
- item parent component: shared `ListItem` with block layout
- item first line: project title, status `Tag`, priority `Tag`
- item second line: truncated description
- item third line: timeline text, current milestone, progress text
- milestone preview: vertical rows below the project summary
- milestone preview row: milestone title, status `Tag`, progress text

Clicking the project item opens the detail page. Do not add a separate `View`
button or footer action inside project list items. The list page does not show
task or subtask rows.

### Project Detail Layout

`ProjectDetailPage` is the second Projects page. It uses one shared `Panel`.

Breadcrumb row:

- layout: horizontal flex with wrapping
- first item: `Projects`, which returns to the list page
- divider: `/`
- second item: project name switcher
- switching through the project name keeps the user on the detail page

Project header:

- first row: project title, then status `Tag`
- second row: description
- third row: started date, timeline text, progress text

Action row:

- layout: horizontal flex with wrapping
- actions: `Edit project`, then `New`
- icons: `Edit3`, `Plus`

Milestone list:

- parent layout: vertical grid
- milestone parent component: shared `ListItem` with block layout
- milestone header layout: horizontal flex with wrapping
- milestone left group: title, status `Tag`, then objective or progress text
- milestone right group: `Edit` with `Edit3`
- task rows append vertically below the milestone header
- task create action appears below that milestone's existing task rows as
  `New task` with `Plus`

Task row layout inside a milestone:

- parent surface: rounded bordered row
- row direction: horizontal with wrapping
- left group: title, status `Tag`, priority `Tag`, then subtask summary and
  deadline
- right group: `Done` with `Check`, then `Edit`
- `Done` uses the normal secondary button tone, not the green success tone,
  because the task is not completed until the command succeeds

### Project Editor Dialog Layout

`ProjectEditorDialog` and `MilestoneEditorDialog` share `DialogShell`.

Dialog shell:

- parent overlay: `DialogOverlay`
- backdrop: `DialogBackdrop`
- frame: `DialogFrame`
- top row: `DialogHeader`
- optional `InlineMessage` below the header
- field area: vertical grid
- footer: `DialogActionRow` with one full-width primary `Save` button
- save icon: `Save`
- loading icon: animated `LoaderCircle`

Project field order:

- `Title` text input
- `Description` textarea with neutral placeholder copy, such as
  `Describe the goal, context, and why it matters.`
- `Timeline` segmented buttons: `Deadline`, `Duration`
- date/duration fields: two columns on desktop, stacked on mobile
- `Priority` segmented buttons: `High`, `Medium`, `Low`

Milestone field order should mirror the project editor where the data model
overlaps:

- `Title` text input
- `Objective` textarea
- `Timeline` segmented buttons: `Deadline`, `Duration`
- date/duration fields: two columns on desktop, stacked on mobile
- do not use a typed `Duration days` number field in the milestone dialog

`ProjectTaskEditorDialog` uses its own vertical dialog layout:

- basics group: title, description
- meta group: scheduled date, start date, deadline, priority, status
- subtasks group: vertical subtask cards
- subtask card first row: title input, `Done` checkbox, `Remove` with `X`
- subtask card second row: description input
- bottom action: `New subtask` with `Plus`

### Dashboard Project Task Card Layout

`Dashboard` renders the project task panel as the main left dashboard panel:

```text
Dashboard
  main Panel
    CardHeader(Check, "Today's tasks to move projects forward")
    ProjectTaskCard[]
  right aside
    routines Panel
    pinned memories Panel
```

`ProjectTaskCard` owns the dashboard view of one task.

Collapsed card:

- parent element: full-width `article`
- clickable row layout: two columns, task text then chevron
- text group direction: vertical
- first line: task title, priority label, status `Tag`
- second line: project label, milestone label, deadline, subtask summary
- right icon: `ChevronDown`, rotated when expanded

Expanded card:

- expanded content appends below the clickable row
- first element: task description
- middle elements: subtask checklist rows
- subtask row layout: checkbox, then title and description
- footer layout: horizontal flex with wrapping
- actions in order: `Done` with `Check`, `Block` with `Ban`, `Skip` with
  `SkipForward`, `Edit` with `Edit3`
- `Done` uses the normal secondary button tone, not the green success tone

## Code Locations

Project web UI:

```text
apps/web/src/features/projects/components/ProjectsPage.tsx
apps/web/src/features/projects/components/ProjectDetailPage.tsx
apps/web/src/features/projects/components/ProjectsList.tsx
apps/web/src/features/projects/components/ProjectTaskCard.tsx
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

If the database reports that `projects`, `project_milestones`,
`project_tasks`, or `project_subtasks` does not exist, the action message should
tell the developer to run:

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
- replaced old plan and numeric-progress UI with project, milestone, task, and
  subtask fields
- added Project/Milestone/Subtask schema in `0005_create_projects.sql`
- added project action error mapping for missing project migrations
- removed the obsolete task prototype code
