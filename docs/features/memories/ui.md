# Memories UI

This document describes user-visible Memories UI behavior. Product rules,
tables, and recommendation behavior are documented in [design.md](design.md).

## Dashboard

The home dashboard should show a compact `Pinned Memories` panel. Its icon
should match the Memories item in the hamburger menu. Use the Lucide
`ClipboardList` icon.

The dashboard's required first behavior is to show pinned memories only.

The first dashboard should show pinned memories from supported dashboard
categories only:

- up to 3 Cuisine memories
- up to 3 Sightseeing memories

Do not show dashboard pinned memories from custom categories until a later UI
feature designs that behavior.

For each pinned memory, show:

- done checkbox on the left
- title
- short description
- category and status metadata
- right-side icon-only `Replace` button with `RefreshCw`

Pinned memory dashboard rows should not expand or collapse. Do not show a
dashboard `View` button.

If the user checks the done checkbox, optimistically show the completed state.
If the user unchecks it before cleanup, cancel the completion. If the backend
later rejects the command, restore the previous visible state and show the
backend message in the shared notification component.

If the user clicks `Replace`, replace only that one item and keep other
positions unchanged after the backend returns the replacement data.

On dashboard load or reload:

- apply the rules in Pinned Memory Behavior
- preserve the order of still-active pinned memories
- fill empty slots by appending new pinned memories at the end of the category
  list when candidates exist
- remove or replace completed pins whose cleanup time has passed
- remove or replace active pins whose visible window has expired

## Memories Page

The Memories page is the full management page for this feature. It can be opened
from the hamburger menu. Its icon should match the `Pinned Memories` dashboard
section; use the Lucide `ClipboardList` icon.

The page should allow the user to:

- view all memories
- filter by category
- add a memory
- edit or delete a memory
- manage categories
- refresh suggested memories

Panels may have different heights, but their styling should stay consistent
with the dashboard panels. Shared dashboard and Memories page panel styles
should be implemented in one reusable place.

The bottom padding can be increased slightly. Keep dashboard and Memories page
spacing consistent through the same reusable panel design.

## Memories Panel

The Memories panel is the main content in the Memories page.

### Title Section

The title section is at the top of the Memories page.

Layout:

- Left side: Lucide `ClipboardList` icon, title, and description.
- Right side: `New` button with a plus icon, using secondary styling.
- The title text is `Memories`.
- The description text is `Saved experiences to revisit when the day needs a gentle option.`

Do not put category chips in this section.

### Categories Section

The categories section appears below the title section and above the memory
list.

Layout:

- Show the text `Categories:` using shared `LabelText`.
- Show filter buttons starting with `All`, followed by user categories such as
  `Cuisine`.
- If there are too many categories, the filter buttons should wrap onto multiple
  lines.
- Show a Lucide `Settings2` button with text `Manage`.
- The `Manage` button should use the same style as filter items and be listed
  with the filter buttons.
- The categories strip should use the same horizontal separator line as list
  rows, but it is not itself a list item.

Click behavior:

- Clicking a category filter button filters the memory list.
- Clicking `All` removes the category filter.
- Clicking `Manage` opens category management.

### Memory List Section

The memory list is vertical.

Each memory list item should show:

- title
- description
- supporting metadata as one line, such as
  `category · pinned · last done time · done count`

Memory item behavior:

- Memory list items do not expand or collapse.
- The edit action is always visible on the right side, where an expand icon
  would otherwise appear.
- The edit action uses a pencil icon and opens the edit-memory dialog.

## Suggestions Panel

Suggested memories are part of the Memories page and are shown in the
Suggestions panel.

### Title Section

Use a separate suggested-memory panel.

Layout:

- Use the Lucide `Lightbulb` icon.
- The title text can be `Suggestions`.
- The description should explain the panel, for example:
  `To reexperience in a few days.`
- Show a `Refresh` button in the panel title section.

### List Section

The suggestion list is vertical.

Each suggestion item should show:

- title
- description
- supporting metadata as one line, such as
  `category · last done time · done count`
- a circular outline button on the right side, with only the Lucide `Pin` icon
  and no text

Click behavior:

- Clicking `Pin` pins that suggestion. While processing, show a loading icon
  inside only that suggestion's button and disable only that suggestion's
  action.
- After the backend succeeds, remove the pinned suggestion from the visible
  suggestion list and refresh database-backed memory summaries. If the backend
  rejects the command, keep the suggestion visible and show the backend message
  in the shared notification component.
- Clicking `Cancel` should undo that pending pin state when supported by the
  implementation. While processing, show a loading icon inside only that
  suggestion's button and disable only that suggestion's action. If the backend
  rejects the command, restore the previous icon state and show the backend
  message in the shared notification component.
- Do not show a separate `Ignore` button.

Refresh behavior:

- Clicking `Refresh` loads a new suggestion list. While processing, show a
  loading icon inside the button and disable it.
- When `Refresh` is clicked, visible suggestions that were not pinned are
  counted as ignored suggestion signals.
- Only unpinned visible suggestions should be counted as ignored.
- Refreshing suggestions should not affect pinned suggestions except by keeping
  them out of the new suggestion list.

## Memory Management

Memory management is part of the Memories page.

The user must be able to:

- add a memory
- edit a memory
- delete a memory
- add a memory category
- edit a memory category
- delete a memory category when it is not used by memories

The add and edit controls should not appear as inline panels inside the memory
list. Inline panels are hard to distinguish from page content and make it
unclear whether a save action succeeded.

Use one of these navigation patterns:

- separate add/edit pages or subpages
- modal dialogs above the current page

For the current web implementation, prefer modal dialogs because they keep the
user on the Memories page while testing data entry.

Modal behavior:

- Opening `Add` should show an add-memory dialog.
- Opening `Edit` on a memory should show an edit-memory dialog.
- Opening `Manage` should show a category-management dialog.
- The page behind the dialog should be covered by a semi-transparent black
  overlay.
- Clicking outside the dialog or pressing a visible close button should dismiss
  the dialog without saving.
- The dialog should not be nested inside a page panel or list item.
- The dialog should fit on mobile and scroll internally when content is taller
  than the viewport.

Save/delete behavior:

- After a successful save or delete, close the active dialog.
- Refresh the Memories page data immediately after the backend action succeeds.
- Keep the dialog open and show validation or database update failures through
  the shared notification component. Do not add inline error boxes inside the
  memory/category dialogs for submit failures.
- Disable action buttons while the backend action is pending so duplicate
  submits are avoided.
- Category delete can fail when the category is still used by memories; show the
  backend message in the shared notification component and keep the dialog open.

### Add Memory Dialog

#### Title Section

Title: `Add a new memory`.

Close button: cross icon button without an outline.

#### Content Section

List fields vertically.

Use the shared field-label, text-input, and multiline text-area components for
memory title and description.

Category selection should not be a dropdown list. Use the shared single-choice
component with the same visual language as app selection buttons. Nothing should
be selected by default. Include the `Manage` button beside the selection group.

#### Confirm Button

Text: `Save`, with a save icon.

### Edit Memory Dialog

#### Title Section

Title: `Edit a memory`.

Close button: cross icon button without an outline.

#### Content Section

Use the same layout as the Add Memory dialog.

#### Confirm Button

Text: `Save`, with a save icon.

#### Delete Button

Text: `Delete`, with a delete icon.

When clicked, show a confirmation dialog with two buttons.

Error messages should disappear after the next successful action or when the
dialog closes.

Because the app will use many dialogs, including title-description-confirm-cancel
dialogs and add/edit/delete dialogs, the main design should stay consistent.
Componentize the shared dialog patterns for reuse.

## Category Management

Clicking the `Manage` button should show a Manage Categories dialog. Keep the
current dialog direction, but document and implement the details below. Do not
show weights in the edit list because they are internal.

Manage Categories dialog layout:

- top row: `Manage Categories` title on the left
- top row right side: `New` button with `Plus`, then close icon button
- category list rows use the shared `ListItem`
- each category row shows title, `DescriptionText`, and one `SupportingText`
  line for the suggestion period
- each category row has an `Edit` button with `Edit3` and text `Edit`
- category rows do not show a delete button

### Add a New Category

Clicking `New` should open an add-category dialog. Use the same style
as the Add Memory dialog.

Use a clear label: `Category name`.

Use the shared field-label and text-input components for the category name. Use
the shared multiline text-area component for optional category description.

Suggestion period should be selected with the shared single-choice component:
`Weekly` and `Monthly`. Sightseeing defaults to monthly; Cuisine defaults to
weekly. The selection should automatically translate into the internal weight.

Always keep the same design as the Add Memory dialog for consistency.

### Edit or Delete a Category

When clicking the edit button, open a new edit dialog with the same UI as the
Add Category dialog.

The Manage Categories dialog should not turn into an inline edit form when the
user clicks edit.

The category delete action lives inside the edit category dialog, below the
`Save` button. Clicking `Delete` shows a confirmation dialog with two buttons.
If the category is still used by memories, show the backend error in the shared
notification component and keep the edit dialog open.
