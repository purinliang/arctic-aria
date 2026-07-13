# Tasks UI

This document describes user-visible Task UI behavior. Product rules, table
attributes, commands, and event behavior are documented in [tasks.md](tasks.md).

## Shared UI Rules

Task UI must use the shared web components under
`apps/web/src/components/ui/`. Do not create one-off buttons, panels, inputs,
dialogs, cards, lists, tags, or notifications inside the task feature.

Use the existing dashboard command behavior:

- lightweight card commands can optimistically update and collapse the active
  surface
- add/edit dialogs close only after successful backend confirmation
- failed backend writes keep dialogs open or restore optimistic card state and
  show the shared notification component

## Sidebar

The sidebar `Tasks` item should open a full Tasks page after the task feature is
implemented. Until then, it may remain a placeholder notification.

The Tasks page icon should use the Lucide `ListTodo` icon to match the current
sidebar item.

## Dashboard

The home dashboard should continue showing a compact task section.

Title:

`Today's tasks to fulfill your plans`

After the backend task feature is implemented, the dashboard should load task
candidates from the database instead of `dummy-data.ts`.

Normal signed-in users should use database-backed task data. Do not reintroduce
dashboard dummy task data into the signed-in dashboard path.

Each dashboard task card should show:

- title
- plan label when present
- priority tag
- status tag
- deadline or scheduled date
- one green circular progress indicator

Prefer showing the deadline when a task has one. Use scheduled date only when a
task has no deadline.

Do not show:

- a large task checkbox on the collapsed card
- a horizontal progress bar
- duplicate progress visuals
- a full edit form inside the dashboard card
- numeric `Weight` or `Completed weight` fields

Clicking or focusing a task card should expand it. Clicking it again should
collapse it.

Expanded state should show:

- description when present
- child tasks as checklist rows
- compact actions for `Done`, `Block`, `Skip`, and `Edit`

Child task behavior:

- clicking a child checkbox marks that child task done or reopens it
- child task commands should not collapse the parent card because the user may
  be completing several child tasks in one session
- child task rows should show their title, optional description, and done state

Dashboard command behavior:

- `Done` collapses the task card immediately and optimistically marks the task
  done
- `Skip` collapses the task card immediately and optimistically marks the task
  skipped
- `Block` collapses the task card immediately and optimistically marks the task
  blocked
- if the backend rejects an optimistic command, restore the previous visible
  state and show the backend message in the shared notification component
- `Edit` opens the edit task dialog and should not optimistically change state

## Tasks Page

The Tasks page is the full plan and task management page for this feature.

The first Tasks page should allow the user to:

- view plans
- add, edit, pause, complete, archive, and delete plans
- view normal tasks
- filter by status
- filter by plan
- add a task
- edit a task
- archive a task
- delete a task
- add and edit child tasks
- set prerequisite tasks
- complete, skip, block, and reopen tasks

The first Tasks page does not need:

- kanban board columns
- calendar drag-and-drop
- dependency graph editing
- AI-generated task breakdown
- review summary charts
- reward previews
- numeric weight editing

## Page Layout

Use a dense management layout similar to the Memories and Routines pages.

Top section:

- left side: `ListTodo` icon, title `Plans and Tasks`, and description
- right side: `Add plan` and `Add task` buttons with plus icons

Suggested description:

`Track bigger plans and the concrete tasks that move them forward.`

Plans section:

- show before the task list
- use the title `Plans`
- show active plans as compact plan cards
- each plan card should show title, deadline, status, priority, and derived
  progress from tasks
- clicking a plan filters or focuses the task list for that plan
- an empty Plans section should say `No plans yet. Add a plan for a larger goal.`

Filter section:

- status filter tags: `All`, `Todo`, `Doing`, `Blocked`, `Skipped`, `Done`
- plan filter tags when plans exist
- filters wrap onto multiple lines on narrow screens

Main list:

- vertical task list
- top-level tasks only by default
- child tasks appear inside their parent expanded state

On desktop, a later version may add a right-side detail or planning panel. The
first version should keep one clear list before adding more layout complexity.

## Task List Item

Each list item should use the shared list item/card pattern.

Collapsed item should show:

- title
- plan tag when present
- priority tag
- status tag
- deadline or scheduled date
- progress indicator
- dependency-ready or blocked-by-prerequisite text when relevant

Expanded item should append details below the header without pushing the
expand/collapse indicator left.

Expanded details should show:

- description
- child task list
- dependency or prerequisite text
- actions: `Done`, `Block`, `Skip`, `Edit`

The expanded area should share the same background color as the expanded list
item. Hover color should not create a mismatched block between the collapsed
header and appended details.

## Add Task Dialog

Use a modal dialog over the Tasks page.

Title: `Add task`.

Fields:

- title
- description
- plan
- priority
- status
- deadline
- scheduled date
- child tasks
- prerequisite tasks

Required fields:

- title

Default values:

- priority: `medium`
- status: `todo`

The child task editor should start simple:

- show an `Add subtask` action
- each child row has title and optional description
- do not support deep nesting in the first UI
- do not show a separate page for child creation in the first UI

Do not show numeric `Weight` or `Completed weight` fields in the add task
dialog. If the implementation still needs internal defaults temporarily, keep
them hidden from the user.

Successful save closes the dialog and refreshes visible task data. Failed save
keeps the dialog open and shows the backend message.

## Edit Task Dialog

Use the same layout as the Add Task dialog.

Title: `Edit task`.

The dialog should include actions for:

- Save
- Archive
- Delete

`Archive` hides the task from normal views. `Delete` removes it. If both are
available, make `Archive` the safer primary destructive option and put `Delete`
behind confirmation.

Successful save, archive, or delete closes the dialog and refreshes visible task
data. Failed actions keep the dialog open and show the backend message.

## Progress

Do not use a numeric progress dialog in the next implementation. Partial
progress should come from child task completion or future plan phases.

If a task has no child tasks, it is either open or done. If partial progress
feels necessary, the UI should encourage adding child tasks instead of editing a
number.

This also avoids browser-native localized validation popups from number inputs.

## Status Text

Use user-facing action text and persisted status text consistently:

- Button text: `Done`; persisted status: `done`
- Button text: `Skip`; persisted status: `skipped`
- Button text: `Block`; persisted status: `blocked`
- Button text: `Reopen`; persisted status usually returns to `todo` or `doing`

Do not expose internal event names such as `partially_completed` as primary
button text.

## Empty And Loading States

Loading text:

`Loading tasks...`

Empty dashboard text:

`No tasks selected for today.`

Empty Tasks page text:

`No tasks yet. Add a plan or task to start tracking concrete work.`

Validation errors should appear near the related field inside dialogs. Failed
optimistic dashboard commands should appear as shared notifications.

## Manual Review Checklist

Before implementation is accepted, inspect:

- desktop viewport around `1440x900`
- mobile viewport around `390x844`
- sidebar Tasks navigation
- dashboard task card expansion and collapse
- child task checkbox behavior
- add task dialog
- edit task dialog
- plan card section
- validation errors
- failed command notification behavior
- no overlapping text in task cards, dialogs, or filter tags
