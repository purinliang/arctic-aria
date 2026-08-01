# Events UI

This document describes user-visible Event UI behavior. Product rules and table
attributes are documented in [overview.md](overview.md) and
[data-model.md](data-model.md).

## Events Page

The sidebar `Events` item opens the full Event management page.

The Events page allows the user to:

- view Event definitions
- filter Event definitions by group
- view generated Event instances
- filter Event instances by `All`, `Recent`, `Future`, or `Past`
- create an Event from a `New` header button
- edit an Event
- delete an Event
- create, edit, and delete Event Groups

The Events page header action is a secondary `New` button with a plus icon. Do
not label this button `Add` or `New event`, because the panel title already says
`Events`.

The page uses the shared split layout:

- left side: Event Definitions panel and Event Instances panel
- right side: instance Filter panel and Groups panel

The Event Definitions panel lists active definitions. Rows show title,
description, group, recurrence label, start date, scheduled time, estimated
duration, and default location. The row action opens the Edit Event dialog.
When there are more than eight visible definitions, the panel uses the shared
paged-list control.

The Event Instances panel lists generated instances. Rows show title,
description, scheduled date, scheduled time, effective location, and status.
The row action opens the Edit Event Instance dialog. When there are more than
six visible instances, the panel uses the shared paged-list control.

The instance filter uses:

- `All`: every loaded Event instance
- `Recent`: yesterday through three days after the current board date
- `Future`: four or more days after the current board date
- `Past`: two or more days before the current board date

The Groups panel filters Event definitions by `All`, `Default`, or a
user-created Event Group. It also filters Event instances by their parent Event
definition. `Manage` opens group management.

Paged Event lists use compact pagination controls in this order: first page,
previous page, `Page x / y`, next page, last page. Changing the group or
instance filter resets the affected list pager to the first page.

## Edit Event Instance Dialog

Use a modal dialog over the Events page.

Fields:

- date
- time
- optional location override
- optional reason

Save behavior:

- clicking `Save` validates the instance date, time, location override, and
  reason
- successful save updates only that Event instance and refreshes Event page
  data
- failed save keeps the dialog open and shows the shared notification

Cancel behavior:

- clicking `Cancel` asks for confirmation
- confirming cancel marks only that generated appointment canceled
- canceled Event instances disappear from normal Event instance lists and Today
- canceling does not delete or change the parent Event definition

## Add Event Dialog

Use a modal dialog over the Events page.

Fields:

- title
- optional description
- group
- date
- end date
- time
- repeat rule
- estimated duration, entered in hours and saved as a value rounded to two
  decimals after submit
- optional location

Save behavior:

- clicking `Save` validates the current draft and sends it to the backend
- while saving, prevent duplicate submit
- on success, close the dialog and refresh visible Event data
- on validation or persistence failure, keep the dialog open and show the
  backend message through the shared notification stack

## Edit Event Dialog

Use the same layout as the Add Event dialog.

The dialog includes actions for:

- Save
- Delete
- Template, in the header action menu

Delete behavior:

- clicking `Delete` shows a confirmation dialog
- canceling the confirmation returns to the edit dialog without changing data
- confirming delete is blocking
- successful delete closes the confirmation and edit dialogs
- failed delete keeps the edit dialog open and shows the shared notification

## Event Template

The Add Event and Edit Event dialogs expose `Template` from the header action
menu. The normal editor remains the primary form; the template dialog is for
creating or editing one or more Events from Markdown.

Template behavior:

- use the shared `TemplateEditorDialog`
- show Template and Preview tabs instead of showing input and preview together
- keep the input and preview bodies fixed-height and internally scrollable
- copy the Markdown template from the Template tab
- parse from the primary `Preview` button or by clicking the Preview tab
- show `Save` only on the Preview tab after the current input has been parsed
- close the template dialog and Event editor only after a successful save
- keep both dialogs open after validation or persistence failure and show the
  shared notification

Template rows use one `## Event` section per Event. Fields are ordered as `id`,
`op`, then the Event editor field order: `title`, `description`, `date`,
`time`, `estimated_duration_hours`, and `location`.

In Add Event mode, every row must use `op: create` and leave `id` empty. In
Edit Event mode, the current Event row must keep the matching `id`, and
additional create rows may leave `id` empty. Existing update rows whose
editable values match the stored Event render as `Preserve`.

The current Event template edits only the flat Event fields listed above. New
template-created Events use the normal default group and a `once` rule in the
user's resolved timezone. Template updates preserve the existing Event Group,
end date, recurrence rule, and timezone.

## Event Group Management

The group manager uses the same dialog direction as routine group management.

The first group manager supports user-created groups only. There are no
built-in Event Groups.

Group manager layout:

- dialog title: `Manage Groups`
- one section: `Event Groups`
- section header action: right-aligned `New`
- group rows show name, description, and `Edit`
- empty state says there are no groups yet
- use the shared dialog `ManagerList`, not a page/panel list
- show at most six group rows per page, with the compact icon pager below the
  rows when needed

Group form fields:

- group name
- optional description

Group save/delete behavior:

- save validates name length, description length, and duplicate names
- successful save closes the form and refreshes Events/groups/instances from
  the backend response
- failed save keeps the form open and shows the shared notification
- delete requires confirmation
- successful delete clears the group from Events and moves them to `Default`
- failed delete keeps the form open and shows the shared notification

## Today Events Panel

Today shows an `Events` panel in the right column after `Progress` and before
`Pinned Memories`. Today rows come from generated Event instances for the
current board date.

Event row layout:

- parent surface: shared list item
- title is underlined and opens the Events page
- right metadata is a direct child of the shared list item, separate from the
  title content
- time is shown at the top of that right metadata area and aligned right
- location, when present, is shown directly below the time and aligned right
- description is visible and clamps at two lines
- estimated duration is not shown on Today

Event rows should not show:

- completion checkbox
- done, undone, skipped, or moved state
- edit or delete actions
- move, later, busy, or skip controls

Events do not affect Today progress counts or progress bars.
