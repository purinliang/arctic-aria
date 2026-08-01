# Projects UI

This document describes user-visible UI behavior for Projects, Milestones, and
Tasks. Product data rules are documented in [data-model.md](data-model.md).

## Sidebar

The sidebar `Projects` item opens the Projects list page. If the user is
already viewing a Project detail page, clicking sidebar `Projects` must return
to the Projects list page instead of keeping the current Project detail page
selected.

Pinned projects:

- users can pin up to three non-deleted projects as sidebar shortcuts
- pinned shortcuts appear directly below the main `Projects` item
- clicking a pinned shortcut opens that project detail page directly
- the main `Projects` item remains visible and always returns to the Projects
  list page
- pinned shortcut labels truncate when long
- deleted projects must disappear from the pinned shortcut list

## Today Panel

Today should not manage the full project tree. It should show the selected work
for today.

Section title:

`Tasks`

Today task rows should show:

- task title
- project title
- milestone title, only when the task has one
- done checkbox
- deadline

Today task rows should not show:

- editable numeric progress fields
- standalone progress visualization
- full project tree
- project edit forms

The atomic scheduled unit is the task. A task can last a few days.

### Today Task Panel Layout

The Today project task area appears in the left column. Routines and pinned
memories stay in the right column.

Panel header:

- icon: `Check`
- title: `Tasks`
- description: short encouragement to choose a steady project step for today
- no header count metadata

Task row layout:

- parent surface: one full-width task row
- row direction: horizontal, with checkbox on the left and task text on the
  right
- left text group direction: vertical
- first text line: task title
- second text line: task description, always visible
- third text line: supporting metadata as `project · milestone · deadline`,
  omitting the milestone segment when the task has no milestone
- no expand/collapse behavior
- no Today edit action
- do not show `Block`, `Skip`, or a multi-status selector in the first UI
- checkbox changes use optimistic UI and must not disable the clicked checkbox,
  other Today task checkboxes, or the row navigation action while the
  backend request is pending
- successful checkbox responses stay silent and must not apply a full Today
  data refresh to checkbox rows while another lightweight checkbox request may
  still be in progress; failed requests roll back only the affected task row
  when that failed request is still the latest request for that row

## Projects Page

The Projects page is the project management entry point.

Top section:

- title: `Projects`
- description: `Track long-running goals and the tasks that move them forward.`
- header action: `New` with `Plus`, using secondary button styling

Main content:

- active project list
- deleted projects hidden by default
- project list items without milestone or task details

Each project list item should show:

- project title
- description, truncated when long
- start date
- deadline or expected duration
- derived progress
- pin or unpin action
- no colored status, priority, or category-like tags in the current UI

The project list page should not show milestone rows or task rows. Clicking an
underlined project title opens the Project detail page. The whole row is not
clickable, and the row should not open an edit dialog.

### Projects Page Layout

The Projects page is a list-first page. It should not use a permanent
side-by-side list/detail layout.

Page layout:

- parent surface: one shared `Panel`
- direction: vertical
- top header: title and description on the left, `New` on the right
- project list: vertical list of project rows
- project creation: `New` opens the project editor dialog

Project list layout:

- parent section direction: vertical
- header direction: horizontal with wrapping
- header left group: `Projects` title, then description below it
- header right group: `New` button with `Plus`, not primary
- list direction: vertical
- project item first line: title only
- project item second line: truncated description
- project item third line: one-line timeline and progress text, truncated when
  needed on narrow screens
- project item right actions: icon-only outline `Pin` or `PinOff` button
- do not show milestone preview rows
- click target: underlined project title only
- the full-width Projects list must keep `min-w-0` shrink constraints on the
  page wrapper, panel, row, and text columns so mobile widths do not overflow
- do not add a text `View` button or footer band inside project list items
- when there are more than ten projects, use the shared compact paged-list
  control below the rows

## Add Project Flow

Use a dialog or dedicated creation page. A dialog is acceptable for the first
implementation if it stays simple.

Fields:

- title
- objective
- start date
- timeline type: deadline or no fixed deadline
- deadline date, when timeline type is deadline
- expected duration range, when timeline type is no fixed deadline

Deadline and expected duration:

- allow either a hard deadline or an expected duration range, not both
- show a single selection for the timeline type
- use an expected-duration dropdown instead of free numeric duration input
- first duration options: `1-3 months`, `3-6 months`, `6-12 months`,
  `1-3 years`

Objective prompt:

- label: `Objective`
- optional marker: shown through the shared `FieldLabel`
- placeholder: choose one localized default objective hint when the dialog
  opens; do not change the placeholder as the user types

Milestone hint:

- if the expected duration or deadline range is longer than about one month,
  show a non-blocking hint suggesting milestones
- do not require milestones during first project creation
- do not create a default milestone when a project is created

Project dialog layout:

- overlay: semi-transparent backdrop over the current page
- frame direction: vertical
- top row: dialog title and close button
- action failures use the shared notification stack, not an inline dialog
  message row
- field direction: vertical
- fields in order: title, objective, start date, timeline type, then the
  conditional end field
- timeline selector direction: horizontal with wrapping
- timeline options: `Deadline`, `No fixed deadline`
- start date is independent from the timeline type and always appears before
  the timeline selector
- if `Deadline` is selected, show the deadline date picker below the timeline
  selector
- if `No fixed deadline` is selected, show the expected-duration dropdown below
  the timeline selector
- footer action row: full-width primary `Save` button with `Save`; while
  saving, cycle through `Saving.`, `Saving..`, and `Saving...`, keep the
  full-width button stable, and use no loading icon

## Project Detail Page

Clicking an underlined project title opens a detail page.

The project detail page should show:

- project title
- objective
- start date
- deadline or expected duration
- project actions
- selected milestone task list
- milestone overview and milestone switching

Project actions:

- edit project
- pin or unpin project
- delete project

Use a page, not a dialog, because project detail needs space for the milestone
tree and progress context.

Breadcrumb behavior:

- selected project pages show the current project or milestone title as the
  main page title
- the metadata row below the title shows `Projects / project name` with the
  project switcher chevron
- `Projects` in the metadata row returns to the project list page
- clicking the project name in the metadata row returns to project-level detail
- only the chevron button opens the menu-style project switcher
- breadcrumb hover/focus effects should use non-layout effects, such as an
  outer shadow halo, and must not add visible padding that shifts alignment
  against normal page titles
- switching projects should keep the user on the detail page
- the breadcrumb should not force the user to return to the list page before
  opening another project

Project title switcher:

- use a button plus dropdown menu, not an input-like select field
- the button text is the current project name
- clicking the project name returns to project-level detail
- only the `ChevronDown` button opens the project switcher menu
- the chevron switcher is hidden whenever the page is in the compact stacked
  split-layout mode, using the same `53rem` container breakpoint as the detail
  panels
- when visible, the project switcher menu opens below the chevron button with
  its left edge aligned to the chevron
- the project switcher menu width is capped at `24rem` and the available
  viewport width
- the menu lists available projects as buttons
- the current project should be visually active
- long project names should truncate in the title button without changing title
  height
- long project names inside the opened menu should truncate instead of changing
  row height
- the opened menu should scroll vertically when the project count exceeds the
  available height

Detail page layout:

- parent layout: shared split layout
- direction: left-right on desktop, stacked on mobile
- desktop split: flexible left panel and fixed `20rem` right panel
- if available width cannot keep the left panel at least 20% wider than the
  right panel, stack the panels vertically instead
- use the shared `aa-split-*` classes so the two-column layout activates only
  when the detail container is at least `53rem` wide
- left and right panels keep independent content-driven heights
- opening a project from the project list, sidebar pinned shortcut, or title
  switcher enters project-level detail first
- project-level left panel: `Project Overview` card with project objective,
  project timeline line, project progress bar, and `Edit`
- project-level right panel: `Milestones` with `Manage`
- milestone-level title bar: selected milestone title becomes the main page
  title; `Projects / project name` remains the metadata row
- milestone-level left panel: `Tasks` card for the selected milestone group
- milestone-level right panel first card: `Milestone Overview`
- milestone-level right panel second card: `Milestones` with `Manage`
- title action: icon-only `Pin` or `PinOff`
- project overview card action: `Edit3` icon plus `Edit`
- milestone overview card action: `Edit3` icon plus `Edit`, opening the
  selected milestone editor
- milestone add/edit actions also live in a dedicated milestone manager dialog,
  opened from the `Milestones` panel `Manage` action
- project overview card shows objective text without an `Objective` label
- project overview card uses the same icon as the main `Projects` navigation
  item and includes a short description
- project overview card date line shows `start date - deadline` when the
  project has a deadline, otherwise `start date · expected duration` or
  `start date · open-ended`
- project overview card shows a thin progress bar below the date line; the
  primary fill shows completed tasks over total tasks, and the secondary fill
  shows elapsed calendar progress only for deadline projects
- project overview card shows compact project task completion text below the
  progress bar
- milestone overview card uses the milestone icon, shows the selected milestone
  objective, localized start/deadline or duration line, milestone task progress
  bar, and compact milestone task completion text
- if the saved objective is empty, show localized default objective copy derived
  from the project title; this fallback is render-only and is not persisted
- overview start dates should display in localized date format, not raw
  `YYYY-MM-DD`
- do not repeat project title inside the Project Overview card; the title is
  already in the page title
- milestone switcher list direction: vertical
- milestone switcher rows act as jump controls, not edit controls
- milestone switcher rows sort by deadline from earliest to latest, then start
  date and title; milestones without a deadline sort after milestones with a
  deadline
- if tasks exist without a milestone, show a final `No milestone` switch target
  after real milestones
- no-milestone tasks stay visible under the `No milestone` switch target
- milestone switcher rows show title and compact task progress such as `0/4`;
  omit progress when the milestone has no tasks instead of showing `0/0`
- milestone switcher rows do not show task details, description, or row-level
  edit actions
- task rows appear as a flat list in the `Tasks` card for the selected
  milestone group
- task create action appears in the `Tasks` card header as `New` with `Plus`
- new tasks default to the selected milestone when a real milestone is selected
- task row layout: `Done` checkbox on the left, then title, description,
  deadline metadata, then `Edit` on the right
- when there are more than eight tasks in the selected milestone group, use the
  shared compact paged-list control below the rows
- if saved milestone objectives or task descriptions are empty, render localized
  default copy derived from the milestone or task title; these fallbacks are not
  persisted
- project detail task rows do not show project or milestone names in metadata
  because the page title and selected milestone context already identify them
- task sort order: deadline from nearest to farthest, then start date from
  oldest to newest, then title
- completed state must not change task order; completed and unfinished tasks
  stay in the same deadline-first order
- tasks without a deadline sort after tasks with a deadline
- completion checkbox changes must not re-sort the current visible list; sort
  only when entering or refreshing the page, or after adding or editing a task
- completion checkbox changes must not disable the clicked checkbox, other task
  checkboxes, or row actions while the backend request is pending

## Structure

The data model remains:

```text
Project
  optional Milestone
  Task
```

The detail page should not render tasks as nested milestone sections. It should
use the selected milestone switch target to decide which task group the main
`Tasks` card renders. Real milestones and the optional `No milestone` group
live in the right-panel switcher.

## Milestones UI

Milestones are phase boundaries. Keep them lightweight.

Milestone detail should show:

- selected milestone title as the page title
- milestone objective and localized start/deadline or duration line inside the
  right-side `Milestone Overview` card
- milestone task progress inside the `Milestone Overview` card
- selected milestone edit action inside the `Milestone Overview` card

Milestone switcher rows should show title plus compact task progress.

Actions:

- manage milestones
- add milestone inside the manager dialog
- edit milestone inside the manager dialog
- delete milestone

Projects do not create a default milestone. The milestone list can be empty.

Milestone manager layout:

- use the shared dialog `ManagerList`, not a page/panel list
- align the section `New` action with row-level `Edit` actions on the right
- show at most six milestone rows per page, with the compact icon pager below
  the rows when needed

## Tasks UI

Tasks belong under a project and can optionally point to a milestone.

New task fields:

- title
- description
- milestone selector, defaulting to `No milestone`
- start date
- deadline date

Do not show:

- priority selector or priority tag
- task status tag or multi-status selector
- block/skip task actions
- done/not-done selector inside add/edit dialogs
- scheduled date field
- prerequisite/dependency selector in the current first UI
- editable numeric progress fields
- colored tag chips

Task actions:

- done / not done
- edit
- delete

Delete behavior:

- milestone and task edit dialogs should show a `Delete` action below the
  full-width `Save` button
- existing project edit dialogs should show `Delete` in the header ellipsis
  action menu beside `Template`, leaving `Save` as the only footer action
- clicking `Delete` opens a confirmation dialog before changing data
- the confirm button uses standard primary button styling and is labeled
  `Delete`
- while delete is pending, the confirmation button text cycles through
  to static `Deleting...`; do not animate dots in compact auto-width
  confirmation buttons
- canceling the confirmation returns to the edit dialog without changing data

## Progress UI

Do not use standalone progress visualization on the dashboard for tasks.

Progress should be displayed as simple text or compact bars only where useful:

- project progress from milestones/tasks
- milestone progress from tasks

For first implementation, text is enough:

- `2 of 5 tasks done`
- `No tasks yet` when the project or milestone has no tasks

## Empty States

Projects page:

`No projects yet. Add a project for a larger goal.`

Project detail page without tasks:

`No tasks yet. Add the next concrete task.`

Dashboard without tasks:

`A clear slate for today. Choose one project task when you are ready.`
