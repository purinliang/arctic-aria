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
- The checkbox must remain enabled while the backend request is pending so the
  user can immediately undo the optimistic state. Do not disable the clicked
  checkbox, other routine checkboxes, or the row navigation action for this
  lightweight dashboard command.
- Successful checkbox responses should stay silent and must not apply a full
  dashboard data refresh to checkbox rows while another lightweight checkbox
  request may still be in progress. Failed requests should roll back only the
  affected routine row when that failed request is still the latest request for
  that row.
- `Busy` and `Skip` are deferred reminder-response actions, not dashboard
  controls in the current UI.

The UI may show a temporary reminder delivery state, but the persisted Core
instance statuses are only `pending`, `completed`, and `skipped`.

## Routines Page

The sidebar `Routines` item opens the full routine management page.

The first Routines page should allow the user to:

- view routine definitions
- filter routine definitions by group
- view recent or upcoming instances
- create a routine from a `New` header button
- edit a routine
- delete a routine
- create, edit, and delete routine groups
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
- automatic schedule suggestions
- analytics charts

Page interaction behavior:

- Clicking `New` opens the Add Routine dialog without calling the backend.
- Clicking a routine row's `Edit` action opens the Edit Routine dialog with the
  current routine values.
- Clicking a routine group filter changes only local UI state and does not call
  the backend.
- Clicking `Manage` in the Groups panel opens group management.
- Opening or closing a dialog should not change persisted data.
- Management save/delete actions are blocking, not optimistic.

## Routines Page Groups Panel

Routine groups are optional unordered filters for related routines. They are
parallel buckets such as English learning, PTE practice, or housework.

Routine groups are not milestones. Project milestones are ordered project
phases and remain inside Projects.

The Routines page uses the shared split layout:

- left side: Routines list panel
- right side: Groups panel

Groups panel layout:

- title: `Groups`
- description: short text explaining that groups filter routines
- header action: `Manage` with a settings icon
- filter choices: `All`, `No group`, then user-created groups
- filter controls use the shared single-choice group style
- selected state uses color and border only

Click behavior:

- `All` shows every routine.
- `No group` shows routines without a group.
- a group button shows routines assigned to that group.
- `Manage` opens group management.

## Routine Group Management

The group manager uses the same dialog direction as memory category management.

The first group manager supports user-created groups only. There are no built-in
routine groups yet.

Group manager layout:

- dialog title: `Manage Groups`
- one section: `Routine Groups`
- section header action: `New`
- group rows show name, description, and `Edit`
- empty state says there are no groups yet

Group form fields:

- group name
- optional description

Group save/delete behavior:

- save validates name length, description length, and duplicate names
- successful save closes the form and refreshes routines/groups from the
  backend response
- failed save keeps the form open and shows the shared notification
- delete requires confirmation
- successful delete clears the group from routines and moves them to `No group`
- failed delete keeps the form open and shows the shared notification

## Add Routine Dialog

Use a modal dialog over the Routines page.

Title: `Add routine`.

Fields:

- title
- optional description
- group
- first start date
- end date
- preferred time
- repeat rule
- recurrence preview

The repeat rule control should use the shared dropdown/select component, not a
button group. Each option should have a short title and a description so labels
such as monthly or custom day intervals are easy to understand. Avoid a dense
cron expression UI.

The routine editor should keep recurrence choices ordered by likely usefulness:

- `Daily`: every day from the first start date.
- `Weekly`: every 7 days from the first start date. Do not show a weekday
  multi-select.
- `Monthly`: every month on the day implied by the first start date. This is
  typical for bills and renewal checks.
- `Every 14 days`: every 14 days from the first start date.
- `Every 30 days`: every 30 days from the first start date.
- `Fixed day interval`: repeat after an explicit number of days. Default this
  field to 90 days because 30 days already has a preset. This is typical for
  software memberships or subscription-like checks.

The first start date and end date should be enough for most schedules. Keep the
visible field labels short; do not append technical qualifiers such as
`optional` or `inclusive` to routine field labels.

Most routines use the browser/system timezone automatically. The
routine-specific timezone selector is hidden in the current UI because the
broader timezone workflow is not ready for release. When this feature is
re-enabled, it should support overseas meetings or routines coordinated with
people in another timezone and should use IANA timezone names from the platform
instead of a hand-translated timezone catalog. Routine dates remain plain dates
for now.

After the repeat-rule control, show a short preview of the next generated dates
when the first start date is valid. The preview should show the first three
occurrences that fit before the inclusive end date, with weekday names, for
example: `Jul 16, 2026 Thu`, `Jul 23, 2026 Thu`, `Jul 30, 2026 Thu`, `and so
on...`. If the end date stops the schedule before three dates, show only the
dates that exist.

Save behavior:

- Clicking `Save` validates the current draft and sends it to the backend.
- While saving, prevent duplicate submit. The save button text should cycle
  through `Saving.`, `Saving..`, and `Saving...` and avoid loading icons in
  the dialog action row. The full-width save button should not flash width
  while dots change.
- On success, close the dialog and refresh visible routine data from the
  backend response.
- On validation or persistence failure, keep the dialog open and show the
  backend message through the shared notification stack.
- If the saved description is missing, routine rows show localized default
  description copy derived from the routine title. This fallback is render-only
  and is not persisted.

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
- Confirming delete is blocking. The confirmation button text should cycle
  to static `Deleting...` and avoid loading icons. Do not animate dots in
  compact auto-width confirmation buttons.
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
