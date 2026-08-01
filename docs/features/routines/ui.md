# Routines UI

This document describes user-visible Routine UI behavior. Product rules and
table attributes are documented in [overview.md](overview.md) and
[data-model.md](data-model.md).

## Today Panel

Today shows a compact `Routines` panel.

The panel shows routine instances for the current local day. It should not show
every routine definition.

Each routine row should show:

- completion checkbox on the left
- title
- scheduled time, if present
- description, clamped at two lines

Today routine rows should not expand or collapse. Do not show `Busy`, `Skip`,
`Later`, or `Move to tomorrow` buttons in the current Today UI.

Click behavior:

- Checking the left checkbox marks the instance completed.
- Unchecking the left checkbox reopens the instance as pending.
- Checkbox changes should optimistically update the visible routine status. If
  the backend later rejects the command, restore the previous visible state and
  show the backend message in the shared notification component.
- The checkbox must remain enabled while the backend request is pending so the
  user can immediately undo the optimistic state. Do not disable the clicked
  checkbox, other routine checkboxes, or the row navigation action for this
  lightweight Today command.
- Successful checkbox responses should stay silent and must not apply a full
  Today data refresh to checkbox rows while another lightweight checkbox
  request may still be in progress. Failed requests should roll back only the
  affected routine row when that failed request is still the latest request for
  that row.
- `Busy`, `Skip`, `Later`, and `Move to tomorrow` are deferred
  reminder-response actions, not Today controls in the current UI.

The UI may show a temporary reminder delivery state, but the persisted Core
instance statuses are only `pending`, `completed`, and `skipped`.

## Routines Page

The sidebar `Routines` item opens the full routine management page.

The first Routines page should allow the user to:

- view routine definitions
- filter routine definitions by group
- view generated routine instances
- filter routine instances by `All`, `Recent`, `Future`, or `Past`
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

- left side: Routine Definitions panel and Routine Instances panel
- right side: instance Filter panel and Groups panel

The Routine Definitions panel lists active routine definitions. Rows show title,
description, group, recurrence summary, preferred time, and estimated duration.
The row action opens the Edit Routine dialog. When there are more than eight
visible definitions, the panel uses the shared paged-list control so only one
definition page renders at a time.

The Routine Instances panel lists generated routine instances. Rows show title,
description, scheduled date, scheduled time, and status. Pending rows can be
completed from this panel. Completed or skipped rows can be reopened. When
there are more than six visible instances, the panel uses the shared paged-list
control so only one instance page renders at a time.

The instance filter uses:

- `All`: every loaded routine instance
- `Recent`: yesterday through three days after the current board date
- `Future`: four or more days after the current board date
- `Past`: two or more days before the current board date

The group filter affects routine definitions and routine instances. Routine
instances are filtered by their parent routine definition.

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
- changing the group filter resets both routine list pagers to their first
  page.

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
- start date
- end date
- preferred time
- repeat rule
- recurrence preview

The repeat rule control should use the shared dropdown/select component, not a
button group. Each option should have a short title and a description so labels
such as monthly or custom day intervals are easy to understand. Avoid a dense
cron expression UI.

The routine editor should keep recurrence choices ordered by likely usefulness:

- `Once`: show only on the start date. This is the default for a new
  routine.
- `Daily`: every day from the start date.
- `Weekly`: every 7 days from the start date. Do not show a weekday
  multi-select.
- `Monthly`: every month on the day implied by the start date. This is
  typical for bills and renewal checks.
- `Yearly`: every year on the date implied by the start date.
- `Every 14 days`: every 14 days from the start date.
- `Every 30 days`: every 30 days from the start date.
- `Fixed interval`: repeat after an explicit number of days. While editing this
  field, keep the fixed-interval choice stable even if the current value equals
  a preset such as 30.

The start date and end date should be enough for most schedules. Keep the
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
when the start date is valid. The preview should show the first three
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
- Template, in the header action menu

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

## Routine Template

The Add Routine and Edit Routine dialogs expose `Template` from the header
action menu. The normal editor remains the primary form; the template dialog is
for creating or editing one or more routine definitions from Markdown.

Template behavior:

- use the shared `TemplateEditorDialog`
- show Template and Preview tabs instead of showing input and preview together
- keep the input and preview bodies fixed-height and internally scrollable
- copy the Markdown template from the Template tab
- parse from the primary `Preview` button or by clicking the Preview tab
- show `Save` only on the Preview tab after the current input has been parsed
- close the template dialog and routine editor only after a successful save
- keep both dialogs open after validation or persistence failure and show the
  shared notification

Template rows use one `## Routine` section per routine. Fields are ordered as
`id`, `op`, then the routine editor field order: `title`, `description`,
`group_id`, `start_date`, `end_date`, `preferred_time`,
`estimated_duration_minutes`, `recurrence`, `fixed_interval_days`, and
`timezone`.

In Add Routine mode, every row must use `op: create` and leave `id` empty. In
Edit Routine mode, the current routine row must keep the matching `id`, and
additional create rows may leave `id` empty. Existing update rows whose
editable values match the stored routine render as `Preserve`.

Routine templates may assign only existing routine groups. Blank `group_id`
means Default/no group. The generated template lists available `group_id`
values as `id: name` lines, tells the LLM not to invent group ids, and does not
support creating, editing, or deleting groups inside the routine template.

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
