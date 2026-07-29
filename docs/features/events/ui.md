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

Delete behavior:

- clicking `Delete` shows a confirmation dialog
- canceling the confirmation returns to the edit dialog without changing data
- confirming delete is blocking
- successful delete closes the confirmation and edit dialogs
- failed delete keeps the edit dialog open and shows the shared notification

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
