# Projects UI

This document describes user-visible UI behavior for Projects, Milestones, and
Tasks. Product data rules are documented in [data-model.md](data-model.md).

## Sidebar

The sidebar `Projects` item opens the Projects list page. If the user is
already viewing a Project detail page, clicking sidebar `Projects` must return
to the Projects list page instead of keeping the current Project detail page
selected.

## Dashboard

The dashboard should not manage the full project tree. It should show the
selected work for today.

Section title:

`Today's tasks to move projects forward`

Dashboard task cards should show:

- task title
- project title
- milestone title
- done checkbox
- deadline

Dashboard task cards should not show:

- editable numeric progress fields
- standalone progress visualization
- full project tree
- project edit forms

The atomic scheduled unit is the task. A task can last a few days.

### Dashboard Task Card Layout

The dashboard project area is the main left dashboard panel. Routines and
pinned memories stay in the right-side dashboard column.

Panel header:

- icon: `Check`
- title: `Today's tasks to move projects forward`
- meta: number of recommended tasks

Collapsed task card layout:

- parent surface: one full-width task card row
- row direction: horizontal, with task text on the left and expand chevron on
  the right
- left text group direction: vertical
- first text line: task title
- second text line: task description, always visible
- third text line: supporting metadata as `project · milestone · deadline`
- right icon: `ChevronDown`, rotated when expanded

Expanded task card layout:

- expanded content appends under the collapsed row
- expanded content should share the same card surface and color as the collapsed
  row
- footer action row direction: horizontal with wrapping on small screens
- actions: `Edit` with `Edit3`
- do not show `Block`, `Skip`, or a multi-status selector in the first UI

## Projects Page

The Projects page is the project management entry point.

Top section:

- title: `Projects`
- description: `Track long-running goals and the tasks that move them forward.`
- header action: `New` with `Plus`, using secondary button styling

Main content:

- active project list
- archived or completed projects hidden by default
- project cards without milestone or task details

Each project card should show:

- project title
- description, truncated when long
- start date
- deadline or expected duration
- derived progress
- no colored status, priority, or category-like tags in the current UI

The project list page should not show milestone rows or task rows. Clicking a
project card opens a Project detail page. It should not open an edit dialog.

### Projects Page Layout

The Projects page is a list-first page. It should not use a permanent
side-by-side list/detail layout.

Page layout:

- parent surface: one shared `Panel`
- direction: vertical
- top header: title and description on the left, `New` on the right
- project list: vertical list of project cards
- project creation: `New` opens the project editor dialog

Project list layout:

- parent section direction: vertical
- header direction: horizontal with wrapping
- header left group: `Projects` title, then description below it
- header right group: `New` button with `Plus`, not primary
- list direction: vertical
- project item first line: title only
- project item second line: truncated description
- project item third line: timeline and progress text
- do not show milestone preview rows
- click target: the whole project list item opens the project detail page
- do not add a separate `View` button or footer band inside project list items

## Add Project Flow

Use a dialog or dedicated creation page. A dialog is acceptable for the first
implementation if it stays simple.

Fields:

- title
- description
- start date
- timeline type: deadline or duration
- deadline date, when timeline type is deadline
- duration range, when timeline type is duration

Deadline and expected duration:

- allow either a hard deadline or an expected duration range, not both
- show a single selection for the timeline type
- use a duration dropdown instead of free numeric duration input
- first duration options: `1-3 months`, `3-6 months`, `6-12 months`,
  `1-3 years`

Description prompt:

- label: `Description`
- placeholder should guide the user to write both the goal and life reason,
  using concise product copy such as
  `Describe the goal, context, and why it matters.`

Milestone hint:

- if the expected duration or deadline range is longer than about one month,
  show a non-blocking hint suggesting milestones
- do not require milestones during first project creation
- create a default milestone named `Completion` if the user skips
  milestone setup

Project dialog layout:

- overlay: semi-transparent backdrop over the current page
- frame direction: vertical
- top row: dialog title and close button
- optional message appears below the title row
- field direction: vertical
- fields in order: title, description, timeline, dates or duration
- timeline selector direction: horizontal with wrapping
- timeline options: `Deadline`, `Duration`
- date fields direction: two columns on desktop, stacked on mobile
- footer action row: full-width primary `Save` button with `Save`; loading state uses
  `LoaderCircle`

## Project Detail Page

Clicking a project opens a detail page.

The project detail page should show:

- project title
- description
- start date
- deadline or expected duration
- derived progress
- project actions
- task list and milestone management

Project actions:

- edit project
- pause or resume project
- complete project
- archive project

Use a page, not a dialog, because project detail needs space for the milestone
tree and progress context.

Breadcrumb behavior:

- the page title bar, not the detail panel, shows `Projects / project name`
- `Projects` in the page title bar returns to the project list page
- clicking or focusing the project name opens a menu-style project switcher
- breadcrumb hover/focus effects should use non-layout effects, such as an
  outer shadow halo, and must not add visible padding that shifts alignment
  against normal page titles
- switching projects should keep the user on the detail page
- the breadcrumb should not force the user to return to the list page before
  opening another project

Project title switcher:

- use a button plus dropdown menu, not an input-like select field
- the button text is the current project name
- show a `ChevronDown` icon to hint that it opens a menu
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
- desktop split: flexible left panel and fixed `24rem` right panel
- if available width cannot keep the left panel at least 20% wider than the
  right panel, stack the panels vertically instead
- use the shared `aa-split-*` classes so the two-column layout activates only
  when the detail container is at least `53rem` wide
- left and right panels keep independent content-driven heights
- left panel: flat task list
- right panel: project overview and milestone management
- left card: `Tasks` card with icon, supporting text, and `New`
- title action: `Edit3` icon plus `Edit`, placed to the right of
  `Projects / project_name`
- right top card: `Overview`
- right bottom card: `Milestones` with `New`
- overview metadata group: description, start date, and timeline
- overview description row label: `Description`
- overview start date should display in English date format, not raw
  `YYYY-MM-DD`
- do not repeat project title inside the Overview card; the title is already in
  the page title
- do not show current milestone or progress in the metadata card
- milestone card list direction: vertical
- milestone row left group: title, then objective or progress text
- milestone row right group: `Edit` with `Edit3`
- milestone rows do not show task details
- task rows appear as a flat list in the `Tasks` card
- task create action appears in the `Tasks` card header as `New` with `Plus`
- task row layout: `Done` checkbox on the left, then title, description,
  milestone/deadline metadata, then `Edit` on the right
- project detail task rows do not show project name in metadata because the
  page title already identifies the project
- task sort order: not-done tasks before done tasks, then deadline from nearest
  to farthest, then start date from oldest to newest
- tasks without a deadline sort after tasks with a deadline
- completion checkbox changes must not re-sort the current visible list; sort
  only when entering or refreshing the page, or after adding or editing a task

## Structure

The data model remains:

```text
Milestone
  Task
```

The detail page should not render that full hierarchy as nested milestone
sections. It should flatten tasks in the main `Tasks` card and keep milestones
as a simple management list in the right panel.

## Milestones UI

Milestones are phase boundaries. Keep them lightweight.

Milestone row should show:

- title
- objective, when present
- deadline or expected duration, when present
- derived progress

Actions:

- add milestone
- edit milestone
- complete milestone
- archive milestone

Default milestone:

- title: `Completion`
- created automatically when a project has no explicit milestone
- user can rename it

The current or first active milestone should be visually emphasized because the
user should usually focus on near-term work instead of planning the whole
project in detail.

## Tasks UI

Tasks belong under milestones.

New task fields:

- title
- description
- milestone selector, defaulting to `Completion`
- start date
- deadline date
- prerequisite tasks

Do not show:

- priority selector or priority tag
- task status tag or multi-status selector
- block/skip task actions
- done/not-done selector inside add/edit dialogs
- scheduled date field
- editable numeric progress fields
- colored tag chips

Task actions:

- done / not done
- edit
- archive
- delete

## Progress UI

Do not use standalone progress visualization on the dashboard for tasks.

Progress should be displayed as simple text or compact bars only where useful:

- project progress from milestones/tasks
- milestone progress from tasks

For first implementation, text is enough:

- `2 of 5 tasks done`

## Empty States

Projects page:

`No projects yet. Add a project for a larger goal.`

Project detail page without tasks:

`No tasks yet. Add the next concrete task.`

Dashboard without tasks:

`No tasks selected for today.`
