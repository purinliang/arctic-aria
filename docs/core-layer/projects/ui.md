# Projects UI

This document describes user-visible UI behavior for Projects, Milestones,
Tasks, and Subtasks. Product data rules are documented in [data-model.md](data-model.md).

## Sidebar

The sidebar `Projects` item opens the Projects page.

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

## Projects Page

The Projects page is the project management entry point.

Top section:

- title: `Projects`
- description: `Track long-running goals and the tasks that move them forward.`
- primary action: `Add project`

Main content:

- active project list
- archived or completed projects hidden by default
- compact project cards

Each project card should show:

- project title
- objective
- importance reason, truncated when long
- start date
- deadline or expected duration
- current milestone
- derived progress
- status

Clicking a project card opens a Project detail page. It should not open an edit
dialog.

## Add Project Flow

Use a dialog or dedicated creation page. A dialog is acceptable for the first
implementation if it stays simple.

Fields:

- title
- target or objective
- reason or importance
- start date
- deadline date
- expected duration

Deadline and expected duration:

- allow a hard deadline
- allow expected duration when there is no hard deadline
- allow open-ended projects only when the user explicitly leaves both blank

Milestone hint:

- if the expected duration or deadline range is longer than about one month,
  show a non-blocking hint suggesting milestones
- do not require milestones during first project creation
- create a default milestone named `Project completion` if the user skips
  milestone setup

## Project Detail Page

Clicking a project opens a detail page.

The project detail page should show:

- project title
- objective
- importance reason
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
