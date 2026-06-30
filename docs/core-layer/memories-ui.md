# Memories UI

This document describes user-visible Memories UI behavior. Product rules,
tables, and recommendation behavior are documented in [memories.md](memories.md).

## Dashboard

The home dashboard should show a compact `Pinned Memories` section. Its icon
should match the Memories item in the hamburger menu. Use the Lucide
`ClipboardList` icon.

For each pinned memory, show:

- title
- short description
- category

Clicking or focusing a pinned memory should expand it like the current routine
cards. Only the expanded state should show:

- `Done`
- `Replace`
- `View`

Clicking the pinned memory again should collapse it.

If the user clicks `Done`, keep the card expanded and show the completed state.
If the user clicks `Replace`, replace only that one item, keep other positions
unchanged, and keep the new item expanded.

On dashboard load or reload:

- apply the rules in Pinned Memory Behavior
- preserve the order of still-active pinned memories
- fill empty slots by appending new pinned memories at the end of the category
  list when candidates exist

## Memories Page

The Memories page is the full management page for this feature. It can be opened
from the hamburger menu. Its icon should match the `Pinned Memories` dashboard
section; use the Lucide `ClipboardList` icon.

The page should allow the user to:

- view all memories
- filter by category
- open a memory detail page
- add a memory
- edit or delete a memory
- manage categories
- refresh suggested memories

## Title Section

The title section is at the top of the Memories page.

Layout:

- Left side: Lucide `ClipboardList` icon, title, and description.
- Right side: `Add` button with a plus icon.
- The title text is `Memories`.
- The description text is `Saved experiences to revisit when the day needs a gentle option.`

Do not put category chips in this section.

## Categories Section

The categories section appears below the title section and above the memory
list.

Layout:

- Show the label `Categories:`.
- Show filter tags starting with `All`, followed by user categories such as
  `Cuisine`.
- If there are too many categories, the filter tags should wrap onto multiple
  lines.
- At the end of the category row, show a plus icon and text `Add a new category`.

Click behavior:

- Clicking a category tag filters the memory list.
- Clicking `All` removes the category filter.
- Clicking `Add a new category` opens category management.

## Memory List Section

The memory list is vertical.

Each memory list item should show:

- title
- category tag beside the title
- description
- meta-information such as last done time, done count, and pinned state

Memory item behavior:

- Clicking a memory item expands it.
- Clicking the expanded item again collapses it.
- The edit action is shown only in the expanded state.
- The edit action uses a pencil icon.
- Clicking the pencil icon opens the edit-memory dialog or detail page.

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
- Opening `Categories` should show a category-management dialog.
- The page behind the dialog should be covered by a semi-transparent black
  overlay.
- Clicking outside the dialog or pressing a visible close button should dismiss
  the dialog without saving.
- The dialog should not be nested inside a page card or list item.
- The dialog should fit on mobile and scroll internally when content is taller
  than the viewport.

Save/delete behavior:

- After a successful save or delete, close the active dialog.
- Refresh the Memories page data immediately after the backend action succeeds.
- Keep the dialog open and show a clear message if validation or database
  update fails.
- Disable action buttons while the backend action is pending so duplicate
  submits are avoided.
- Category delete can fail when the category is still used by memories; show the
  backend message and keep the dialog open.

## Suggested Memories

Suggested memories are part of the Memories page.

### Title Section

Use a separate suggested-memory panel.

Layout:

- Use the Lucide `Lightbulb` icon.
- The title text can be `Suggestions`.
- The description should explain the panel, for example:
  `Suggestions to reexperience today or in the next few days.`
- Show a `Refresh` button in the panel title section.

### List Section

The suggestion list is vertical.

Each suggestion item should show:

- title
- category tag beside the title
- description
- a Lucide `Pin` icon and `Pin` text

Click behavior:

- Clicking `Pin` pins that suggestion.
- After pin succeeds, the icon should change to an unpin/cancel state and the
  text should become `Cancel`.
- Clicking `Cancel` should undo that pending pin state when supported by the
  implementation.
- Do not show a separate `Ignore` button.

Refresh behavior:

- Clicking `Refresh` loads a new suggestion list.
- When `Refresh` is clicked, visible suggestions that were not pinned are
  counted as ignored suggestion signals.
- Only unpinned visible suggestions should be counted as ignored.
- Refreshing suggestions should not affect pinned suggestions except by keeping
  them out of the new suggestion list.
