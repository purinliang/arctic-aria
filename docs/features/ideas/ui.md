# Ideas UI

Ideas UI is a lightweight capture and management surface for thoughts before
they become structured work.

The current web app includes list, add, edit, and delete behavior. Triage and
conversion are not implemented in the UI yet.

## Sidebar And Page

The sidebar should show `Ideas` as a normal navigation item between Projects and
Routines. Use a lightbulb icon.

The page title should be `Ideas`.

## Ideas Page

The first page should use one full-width panel:

- panel title: `Ideas`
- panel icon: lightbulb
- panel description: short text explaining that these are captured thoughts
  waiting for review
- right header action: secondary `New` button with plus icon

Rows should use the standard list item style:

- first line: raw captured text
- second line: supporting metadata in one line, such as
  `Discord · Untriaged · Jul 17, 2026 Fri`
- right action: `Pencil icon Edit`

When persisted ideas exist, show real ideas. When no persisted ideas exist, the
page should show the normal empty state. Do not show prototype rows on the
implemented page.

## Interactions

Current interactions:

- clicking `New` opens an add dialog
- clicking `Edit` opens an edit dialog for that idea
- clicking a row should not open a detail page
- saving waits for the backend result, closes the dialog on success, updates the
  list immediately, and shows a notification on failure
- deleting from the edit dialog opens a confirmation dialog above the edit
  dialog
- confirming delete waits for the backend result, archives the idea on success,
  removes it from the list immediately, and shows a notification on failure
- canceling delete should close only the confirmation dialog and return to the
  edit dialog

There is no triage or conversion action yet.

Future interactions should be specified here before implementation.
