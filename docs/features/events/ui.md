# Events UI

This document describes user-visible Event UI behavior. Product rules and table
attributes are documented in [overview.md](overview.md) and
[data-model.md](data-model.md).

## Events Page

The sidebar `Events` item opens the full Event management page.

The first Events page allows the user to:

- view upcoming Events
- view past Events
- create an Event from a `New` header button
- edit an Event
- delete an Event

The Events page header action is a secondary `New` button with a plus icon. Do
not label this button `Add` or `New event`, because the panel title already says
`Events`.

The page uses the split layout. The right panel filters the list by `All`,
`Upcoming`, or `Past`. `All` appears first in the control, while `Upcoming` is
selected by default. Section labels are shown only when `All` is selected,
because filtered lists already state their scope in the right panel. The page
does not have Event groups or categories.

## Add Event Dialog

Use a modal dialog over the Events page.

Fields:

- title
- optional description
- date
- time
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

## Today Events Panel

Today shows an `Events` panel in the right column after `Progress` and before
`Pinned Memories`.

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
