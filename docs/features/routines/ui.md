# Routines UI

This document describes user-visible Routine UI behavior. Product rules and
table attributes are documented in [routines.md](routines.md).

## Dashboard

The home dashboard should continue showing a compact `Routines` section.

The dashboard shows routine instances for the current personal day. It should
not show every routine definition.

Each routine card should show:

- completion checkbox on the left
- title
- scheduled time, if present
- status
- short metadata such as streak or due text when available

Clicking or focusing a routine card should expand it. Clicking it again should
collapse it.

Expanded state should show secondary actions:

- `Busy`
- `Skip`

Click behavior:

- Checking the left checkbox marks the instance completed.
- Unchecking the left checkbox reopens the instance as pending.
- `Skip` marks the instance skipped.
- `Busy` snoozes reminder delivery when reminder jobs exist. It should not set
  the routine instance status to busy.
- After checkbox changes, `Skip`, or `Busy`, collapse the routine card
  immediately.
- Checkbox changes and `Skip` should optimistically update the visible routine
  status. If the backend later rejects the command, restore the previous
  visible state and show the backend message in the shared notification
  component.
- `Busy` shows a temporary reminder message and does not wait for backend
  persistence until reminder jobs exist.

The UI may show a temporary reminder delivery state, but the persisted Core
instance statuses are only `pending`, `completed`, and `skipped`.

## Routines Page

The sidebar `Routines` item should eventually open a full management page.

The first Routines page should allow the user to:

- view routine definitions
- view recent or upcoming instances
- create a routine from a `New` header button
- edit a routine
- delete a routine
- choose a recurrence rule
- choose a preferred reminder time

The `Routines` page header action should be a secondary `New` button with a
plus icon. Do not label this button `Add` or `New routine`, because the card
title already says `Routines`.

Use the same modal direction as the Memories add/edit dialogs and category
add/edit dialogs so routine management feels consistent with existing
management pages.

The first Routines page does not need:

- Discord delivery controls
- AI coaching
- analytics charts

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

## Edit Routine Dialog

Use the same layout as the Add Routine dialog.

Title: `Edit routine`.

The dialog should include actions for:

- Save
- Delete

Successful save closes the dialog and refreshes visible routine data. Failed
save keeps the dialog open and shows the backend message.

Clicking `Delete` should show a confirmation dialog. Successful delete closes
the dialog and removes the routine from normal views.

## Status Text

Use user-facing text that matches the action:

- Checkbox checked: `completed`
- Persisted instance status: `completed`
- Button text: `Skip`
- Persisted instance status: `skipped`
- Button text: `Busy`
- Later reminder state: snoozed or rescheduled

Do not expose `reminding` as a Core routine status. It can appear only as a
delivery or UI state.
