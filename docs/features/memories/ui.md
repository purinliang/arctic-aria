# Memories UI

This document describes user-visible Memories UI behavior. Product rules,
tables, and recommendation behavior are documented in [overview.md](overview.md)
and [data-model.md](data-model.md).

## Today Panel

Today shows a compact `Pinned Memories` panel. Its icon should match the
Memories item in the hamburger menu. Use the Lucide `Album` icon.

The panel shows pinned memories only.

Today can show pinned memories from any category. Do not hard-code the panel to
Cuisine and Sightseeing, and do not apply a per-category count limit in the UI
or backend selection logic.

For each pinned memory, show:

- experienced checkbox on the left
- title
- short description
- category metadata
- underlined title that opens the Memories page

Pinned memory rows should not expand or collapse. Do not show a `View` button.
Do not show a single-row refresh or replace button on Today pinned memories.
Do not show internal rotation state such as `visible_until`, cleanup timing, or
visible-window status in the row metadata.

If the user checks the experienced checkbox, optimistically show the experienced
state.
If the user unchecks it before cleanup, cancel the experience mark. If the
backend later rejects the command, restore the previous visible state and show
the backend message in the shared notification component.

The checkbox must remain enabled while the backend request is pending so the
user can immediately undo the optimistic state. Do not disable the clicked
checkbox, other pinned-memory checkboxes, or the row navigation action for this
lightweight Today command.

Successful checkbox responses should stay silent and must not apply a full
Today data refresh to checkbox rows while another lightweight checkbox
request may still be in progress. Failed requests should roll back only the
affected pinned-memory row when that failed request is still the latest request
for that row.

On Today load or reload:

- apply the rules in Pinned Memory Behavior
- preserve the order of still-active pinned memories
- do not show cleanup, expiry, or visible-window metadata in the row

## Memories Page

The Memories page is the full management page for this feature. It can be opened
from the hamburger menu. Its icon should match the `Pinned Memories` dashboard
section; use the Lucide `Album` icon.

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

Use the shared split layout:

- left side: Memories list panel
- right side: Categories panel, then Suggestions panel

The bottom padding can be increased slightly. Keep dashboard and Memories page
spacing consistent through the same reusable panel design.

## Memories Panel

The Memories panel is the main content in the Memories page.

### Title Section

The title section is at the top of the Memories page.

Layout:

- Left side: Lucide `Album` icon, title, and description.
- Right side: `New` button with a plus icon, using secondary styling.
- The title text is `Memories`.
- The description text is `Saved experiences to revisit when the day needs a gentle option.`

Do not put category chips in this section.

### Categories Panel

The categories panel appears in the right-side column above Suggestions.

Layout:

- Use the Lucide `Album` icon.
- Title: `Categories`.
- Description: short text explaining that categories filter memories.
- Header action: `Manage` with a settings icon.
- Show filter buttons starting with `All`.
- Always show `Cuisine`, `Sightseeing`, and user-created categories, even when
  they have no memories yet.
- Hide other empty built-in categories, such as `Movie`, `Anime`, `Book`,
  `Music`, `Game`, and `Shopping`, until they have at least one memory.
- Sort category filters as `Cuisine`, `Sightseeing`, user-created categories,
  then other built-in categories. Sort user-created categories and other
  built-ins alphabetically by English display name within their groups.
- The `All` filter should show a neutral memory icon.
- Category filter buttons should show the category icon when one is available.
- If there are too many categories, the filter buttons should wrap onto multiple
  lines.

Click behavior:

- Clicking a category filter button filters the memory list.
- Clicking `All` removes the category filter.
- Clicking `Manage` opens category management.
- Category filtering is local UI state and should not call the backend.
- Category filters should use the shared single-choice group style. Selected
  state is shown by color and border only; do not add a check icon to selected
  choices.
- The memory editor category section should use the same grouped treatment:
  category choices followed by a `Manage` choice-action item in the same row.

Current built-in category icon mapping:

- Cuisine uses `utensils`.
- Sightseeing uses `trees`.
- Movie uses `film`.
- Anime uses `wand-sparkles`.
- Book uses `book-open-text`.
- Music uses `music`.
- Game uses `gamepad-2`.
- Shopping uses `shopping-cart`.

### Memory List Section

The memory list is vertical.

Each memory list item should show:

- title
- description
- supporting metadata as one line, such as
  `category · pinned · last experienced time · experienced count`
- if a memory was never experienced, show `Never experienced` without a
  duplicate `Experienced 0 times` count
- some built-in categories may use category-specific experience verbs in both
  English and Chinese instead of generic `experienced` wording
- user-created categories and unknown categories fall back to
  `experienced` / `体验`
- if the saved description is missing, show localized default memory copy derived
  from the memory title; the fallback is render-only and is not persisted

Memory item behavior:

- Memory list items do not expand or collapse.
- The edit action is always visible on the right side, where an expand icon
  would otherwise appear.
- The edit action uses a pencil icon and opens the edit-memory dialog.
- Clicking `Edit` opens the dialog without changing persisted data.
- When there are more than eight visible memories, use the shared compact
  paged-list control below the rows.
- Changing the category filter resets the memory list pager to the first page.

## Suggestions Panel

Suggested memories are part of the Memories page and are shown in the
Suggestions panel.

### Title Section

Use a separate suggested-memory panel.

Layout:

- Use the Lucide `Lightbulb` icon.
- The title text can be `Suggestions`.
- The description should explain the panel, for example:
  `To reexperience soon.`
- Show a `Refresh` button in the panel title section.

### List Section

The suggestion list is vertical.

Each suggestion item should show:

- title
- description
- supporting metadata as one line, such as
  `category · last experienced time · experienced count`
- if a suggestion was never experienced, show `Never experienced` without a
  duplicate `Experienced 0 times` count
- use the same category-specific experience wording as the Memories panel
- if the saved description is missing, show the same localized default memory copy
  used by the Memories panel
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

- Opening the Memories page may show cached suggestions without recording
  ignored events or creating suggestion-history rows.
- Clicking `Refresh` loads a new suggestion list. While processing, show a
  loading icon inside the button and disable it.
- When `Refresh` is clicked, visible suggestions that were not pinned are
  counted as ignored suggestion signals.
- Only unpinned visible suggestions should be counted as ignored.
- Refreshing suggestions should not affect pinned suggestions except by keeping
  them out of the new suggestion list.
- If refresh fails, keep the page open and show the backend message through the
  shared notification stack.

## Memory Management

Memory management is part of the Memories page.

The user must be able to:

- add a memory
- edit a memory
- delete a memory
- pin or unpin a memory from the memory row
- add a memory category
- edit a memory category
- delete a memory category when it is not used by memories

Built-in categories should remain visible in Manage Categories with their icon,
name, and description only. Do not show built-in/user-created supportive
metadata in the list. Do not show an edit action for built-in categories.
Manage Categories uses the shared dialog `ManagerList`, not a page/panel list.
The custom category section aligns the right-side `New` action with row-level
`Edit` actions. Custom category rows show at most six rows per page, with the
compact icon pager below the rows when needed.

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
- Clicking outside the dialog should not dismiss the dialog. Only explicit
  controls, such as the close icon or form buttons, should close it.
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
memory title and optional description. The title placeholder should stay simple,
such as `Memory title`. The description placeholder should be chosen from
localized default memory copy when the dialog opens and should not change while
the user types.

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
show scoring controls in the edit list. Category scoring is no longer exposed in
the current UI.

Manage Categories dialog layout:

- use the same shared dialog shell and surrounding content padding as add/edit
  dialogs
- top row: `Manage Categories` title on the left and close icon button on the
  right
- show user-created categories first in a separate `Custom Categories` section
- show built-in categories below in a separate `Default Categories` section
- place the `New` button with `Plus` in the `Custom Categories` section header,
  not in the dialog title row
- section headers should use existing shared title/action components where
  possible instead of local alignment classes
- category list rows use the shared `ListItem`
- each category row shows title and `DescriptionText`
- built-in category rows show icon, localized name, and localized description
  only; do not show an edit action
- custom category rows have an `Edit` button with `Edit3` and text `Edit`
- category rows do not show a delete button

### Add a New Category

Clicking `New` should open an add-category dialog. Use the same style
as the Add Memory dialog.

Use a clear label: `Category name`.

Use the shared field-label and text-input components for the category name. Use
the shared multiline text-area component for optional category description.
The category name placeholder should stay simple, such as `Category name`.
The category description placeholder should be chosen from localized default
category copy when the dialog opens and should not change while the user types.

Do not show a suggestion period, weekly/monthly selector, or category weight
control.

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
