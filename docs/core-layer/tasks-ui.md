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

The home dashboard should continue showing a compact `Today's Tasks` section.

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

Clicking or focusing a task card should expand it. Clicking it again should
collapse it.

Expanded state should show:

- description when present
- child tasks as checklist rows
- child task weight circles
- compact actions for `Done`, `Block`, `Skip`, and `Edit`

Child task behavior:

- clicking a child checkbox marks that child task done or reopens it
- child task commands should not collapse the parent card because the user may
  be completing several child tasks in one session
- child task rows should show their title, optional description, and weight
  circles
- if a child task is complete, all of its weight circles are green

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

The Tasks page is the full management page for this feature.

The first Tasks page should allow the user to:

- view normal tasks
- filter by status
- filter by plan
- add a task
- edit a task
- archive a task
- delete a task
- add and edit child tasks
- complete, partially complete, skip, block, and reopen tasks

The first Tasks page does not need:

- kanban board columns
- calendar drag-and-drop
- dependency graph editing
- AI-generated task breakdown
- review summary charts
- reward previews

## Page Layout

Use a dense management layout similar to the Memories and Routines pages.

Top section:

- left side: `ListTodo` icon, title `Tasks`, and description
- right side: `Add` button with a plus icon

Suggested description:

`Plan concrete work, subtasks, deadlines, and progress.`

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

Expanded item should append details below the header without pushing the
expand/collapse indicator left.

Expanded details should show:

- description
- child task list
- progress text such as `2 / 5 weight done`
- actions: `Done`, `Progress`, `Block`, `Skip`, `Edit`

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
- weight
- completed weight
- deadline
- scheduled date
- child tasks

Required fields:

- title
- weight

Default values:

- priority: `medium`
- status: `todo`
- weight: `1`
- completed weight: `0`

The child task editor should start simple:

- show an `Add subtask` action
- each child row has title and weight
- do not support deep nesting in the first UI
- do not show a separate page for child creation in the first UI

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

## Progress Dialog

Partial completion should use a focused dialog opened from `Progress`.

Title: `Update progress`.

Fields:

- total weight
- completed weight

Rules:

- completed weight cannot be less than `0`
- completed weight cannot be greater than total weight
- total weight must be greater than `0`
- setting completed weight equal to total weight marks the task done

Successful save closes the dialog and refreshes visible task data. Failed save
keeps the dialog open and shows the backend message.

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

`No tasks yet. Add a task to start planning concrete work.`

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
- progress dialog
- validation errors
- failed command notification behavior
- no overlapping text in task cards, dialogs, or filter tags
