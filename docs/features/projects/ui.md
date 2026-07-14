# Projects UI

This document describes user-visible UI behavior for Projects, Milestones,
Tasks, and Subtasks. Product data rules are documented in [data-model.md](data-model.md).

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
- status
- priority
- deadline or scheduled date
- short subtask summary, such as `2 of 5 subtasks done`

Dashboard task cards should not show:

- editable numeric progress fields
- standalone progress visualization
- full project tree
- project edit forms

The atomic scheduled unit is the task. A task can last a few days, but subtasks
should remain checklist details inside the task.

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
- first text line: task title, priority tag, status tag
- second text line: project title, milestone title, deadline, subtask summary
- right icon: `ChevronDown`, rotated when expanded

Expanded task card layout:

- expanded content appends under the collapsed row
- expanded content should share the same card surface and color as the collapsed
  row
- first line: task description
- middle section: subtask checklist rows
- each subtask row: checkbox on the left, title and description on the right
- footer action row direction: horizontal with wrapping on small screens
- actions in order: `Done` with `Check`, `Block` with `Ban`, `Skip` with
  `SkipForward`, `Edit` with `Edit3`

`Done` is an unfinished command while waiting for user input, so it should use
the normal command-button style. Do not make it green before the task is
completed.

## Projects Page

The Projects page is the project management entry point.

Top section:

- title: `Projects`
- description: `Track long-running goals and the tasks that move them forward.`
- primary action: `Add project`

Main content:

- active project list
- archived or completed projects hidden by default
- project cards with milestone summaries
- tasks and subtasks hidden by default

Each project card should show:

- project title
- description, truncated when long
- start date
- deadline or expected duration
- current milestone
- derived progress
- status
- milestone summaries

Each milestone summary should show:

- milestone title
- status
- derived progress

The project list page should not show task rows or subtask rows. Clicking a
project card or its `View` action opens a Project detail page. It should not
open an edit dialog.

### Projects Page Layout

The Projects page is a list-first page. It should not use a permanent
side-by-side list/detail layout.

Page layout:

- parent surface: one shared `Panel`
- direction: vertical
- top header: title and description on the left, `Add project` on the right
- project list: vertical list of project cards
- project creation: `Add project` opens the project editor dialog

Project list layout:

- parent section direction: vertical
- header direction: horizontal with wrapping
- header left group: `Projects` title, then description below it
- header right group: `Add project` button with `Plus`
- list direction: vertical
- project item first line: title, status tag, priority tag
- project item second line: truncated description
- project item third line: timeline, current milestone, progress text
- milestone preview appears below the project summary
- milestone preview direction: vertical
- milestone preview row: milestone title, status tag, progress text
- milestone preview rows should stay transparent, without their own outlined box
  or background fill
- footer action: `View` with a forward navigation icon

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
  such as `Objective: to ... How and why is it important to you?`

Milestone hint:

- if the expected duration or deadline range is longer than about one month,
  show a non-blocking hint suggesting milestones
- do not require milestones during first project creation
- create a default milestone named `Project completion` if the user skips
  milestone setup

Project dialog layout:

- overlay: semi-transparent backdrop over the current page
- frame direction: vertical
- top row: dialog title and close button
- optional message appears below the title row
- field direction: vertical
- fields in order: title, description, timeline, dates or duration, priority
- timeline selector direction: horizontal with wrapping
- timeline options: `Deadline`, `Duration`
- date fields direction: two columns on desktop, stacked on mobile
- priority selector direction: horizontal with wrapping
- footer action row: `Save` button with `Save`; loading state uses
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
- milestone/task/subtask tree

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

- parent surface: one shared `Panel`
- direction: left-right on desktop, stacked on mobile
- desktop split: flexible left panel and fixed `20rem` right panel
- if available width cannot keep the left panel at least 20% wider than the
  right panel, stack the panels vertically instead
- use the shared `aa-split-*` classes so the two-column layout activates only
  when the detail container is at least `44rem` wide
- left and right panels keep independent content-driven heights
- left panel: milestone/task/subtask tree
- right panel: project metadata and milestone overview
- left card: `Milestones` card with icon, supporting text, and `Add milestone`
- right cards: `Project metadata` with `Edit project`, then `Milestone overview`
- project metadata group: status, priority, start date, deadline or duration,
  and derived progress
- milestone overview list: each milestone title, status tag, and progress text
- milestone list direction: vertical
- milestone card header direction: horizontal with wrapping
- milestone header left group: title and status tag, then objective or progress
  text
- milestone header right group: `Edit` with `Edit3`, then `Add task` with
  `Plus`
- task rows appear vertically under their milestone
- task row left group: title, status tag, priority tag, then subtask summary and
  deadline
- task row right group: `Done` with `Check`, then `Edit`

## Tree Structure

The detail page should render:

```text
Milestone
  Task
    Subtask
```

Milestones should be expandable sections.

Tasks should be list rows under a milestone.

Subtasks should be checklist rows inside a task.

Subtasks cannot have nested subtasks.

## Milestones UI

Milestones are phase boundaries. Keep them lightweight.

Milestone row should show:

- title
- objective, when present
- status
- deadline or expected duration, when present
- derived progress

Actions:

- add milestone
- edit milestone
- complete milestone
- archive milestone
- add task under milestone

Default milestone:

- title: `Project completion`
- created automatically when a project has no explicit milestone
- user can rename it

The current or first active milestone should be visually emphasized because the
user should usually focus on near-term work instead of planning the whole
project in detail.

## Tasks UI

Tasks belong under milestones.

Add task fields:

- title
- description
- priority
- scheduled date
- start date
- deadline date
- prerequisite tasks
- subtasks

Do not show:

- editable numeric progress fields
- subtask scheduling fields

Task actions:

- done
- reopen
- block
- skip
- edit
- archive
- delete

## Subtasks UI

Subtasks are simple checklist items.

Subtask fields:

- title
- description
- done state

Subtask rules:

- no nested subtasks
- no independent schedule
- no priority
- no deadline
- no dependencies

Subtask checkboxes should update immediately in the task UI.

## Progress UI

Do not use standalone progress visualization on the dashboard for tasks.

Progress should be displayed as simple text or compact bars only where useful:

- project progress from milestones/tasks
- milestone progress from tasks
- task progress from subtasks

For first implementation, text is enough:

- `2 of 5 tasks done`
- `3 of 8 subtasks done`

## Empty States

Projects page:

`No projects yet. Add a project for a larger goal.`

Project detail page without tasks:

`No tasks in this milestone yet. Add the next concrete task.`

Dashboard without tasks:

`No tasks selected for today.`
