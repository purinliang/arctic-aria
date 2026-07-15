# Routines UI

This document describes user-visible Routine UI behavior. Product rules and
table attributes are documented in [overview.md](overview.md) and
[data-model.md](data-model.md).

## Dashboard

The home dashboard should continue showing a compact `Routines` panel.

The dashboard shows routine instances for the current personal day. It should
not show every routine definition.

Each routine row should show:

- completion checkbox on the left
- title
- scheduled time, if present
- status
- short metadata such as streak or due text when available

Dashboard routine rows should not expand or collapse. Do not show `Busy` or
`Skip` buttons in the current dashboard UI.

Click behavior:

- Checking the left checkbox marks the instance completed.
- Unchecking the left checkbox reopens the instance as pending.
- Checkbox changes should optimistically update the visible routine status. If
  the backend later rejects the command, restore the previous visible state and
  show the backend message in the shared notification component.
- `Busy` and `Skip` are deferred reminder-response actions, not dashboard
  controls in the current UI.

The UI may show a temporary reminder delivery state, but the persisted Core
instance statuses are only `pending`, `completed`, and `skipped`.

## Routines Page

The sidebar `Routines` item opens the full routine management page.

The first Routines page should allow the user to:

- view routine definitions
- view recent or upcoming instances
- create a routine from a `New` header button
- edit a routine
- delete a routine
- choose a recurrence rule
- choose a preferred reminder time

The `Routines` page header action should be a secondary `New` button with a
plus icon. Do not label this button `Add` or `New routine`, because the panel
title already says `Routines`.

Use the same modal direction as the Memories add/edit dialogs and category
add/edit dialogs so routine management feels consistent with existing
management pages.

The first Routines page does not need:

- Discord delivery controls
- AI coaching
- analytics charts

Page interaction behavior:

- Clicking `New` opens the Add Routine dialog without calling the backend.
- Clicking a routine row's `Edit` action opens the Edit Routine dialog with the
  current routine values.
- Opening or closing a dialog should not change persisted data.
- Management save/delete actions are blocking, not optimistic.

## Add Routine Dialog

Use a modal dialog over the Routines page.

Title: `Add routine`.

Fields:

- title
- description
- recurrence rule
- preferred time
- first start date
- optional end date

The recurrence rule control should use simple option buttons or segmented
controls first. Avoid a dense cron expression UI.

Save behavior:

- Clicking `Save` validates the current draft and sends it to the backend.
- While saving, show loading state on the save button and prevent duplicate
  submit.
- On success, close the dialog and refresh visible routine data from the
  backend response.
- On validation or persistence failure, keep the dialog open and show the
  backend message through the shared notification stack.

## Edit Routine Dialog

Use the same layout as the Add Routine dialog.

Title: `Edit routine`.

The dialog should include actions for:

- Save
- Delete

Successful save closes the dialog and refreshes visible routine data
immediately from the backend response; do not require a manual reload. Failed
save keeps the dialog open and shows the backend message through the shared
notification stack.

Delete behavior:

- Clicking `Delete` should show a confirmation dialog.
- Canceling the confirmation returns to the edit dialog without changing data.
- Confirming delete is blocking.
- Successful delete closes the confirmation and edit dialogs and removes the
  routine from normal views.
- Failed delete keeps the edit dialog open and shows the backend message
  through the shared notification stack.

## Status Text

Use user-facing text that matches the action:

- Checkbox checked: `completed`
- Persisted instance status: `completed`
- Future button text: `Skip`
- Persisted instance status: `skipped`
- Future button text: `Busy`
- Later reminder state: snoozed or rescheduled

Do not expose `reminding` as a Core routine status. It can appear only as a
delivery or UI state.
