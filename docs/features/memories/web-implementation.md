# Memories Web Implementation

This document records the current user-detectable Memories web behavior. Product
rules are defined in [overview.md](overview.md), data rules are defined in
[data-model.md](data-model.md), and visible UI behavior is defined in
[ui.md](ui.md).

## Current Scope

The current web implementation supports database-backed memory testing:

- load memory categories from Neon
- load memories from Neon
- add, edit, and delete memories
- add, edit, and delete categories
- show pinned memories on the dashboard from Neon
- mark pinned memories done
- cancel pinned memory done

Projects and Routines are database-backed.

## Current User Flow

The user opens the Memories page from the sidebar.

The page should show:

- memory list
- category filter buttons
- `New` action
- `Manage` action
- suggestions panel on the right side on desktop and below the list on mobile

`New` opens memory creation UI.

Memory `Edit` opens memory editing UI.

`Manage` opens category management UI.

## Suggestions Panel

The Suggestions panel is part of the Memories page.

Location and alignment:

- On desktop, the panel appears in the right column beside the memory list.
- On mobile and narrow screens, it appears below the memory list.
- The panel header aligns with the top of the memory list panel.
- The panel is a single bordered panel with the same radius as other
  dashboard panels.

Header:

- The left side shows the `Lightbulb` icon.
- The title text is `Suggestions`.
- Under the title, show short muted text:
  `To reexperience in a few days.`
- The right side shows a compact `Refresh` button.
- The `Refresh` button includes the `RefreshCw` icon and the text `Refresh`.

Suggestion list:

- The page may show cached suggestions when the user opens the Memories page.
- If no cached suggestions are available, show muted text:
  `Click Refresh to load suggestions.`
- While loading, show muted text:
  `Loading suggestions...`
- If there are no eligible memories, show muted text:
  `No suggestions available. Add more memories or unpin existing ones.`
- Each suggestion appears as a simple row, not a nested card.
- Each row shows:
  - title
  - short description
  - supporting metadata as `category · last-done text · done count`
  - `Pin` button

Button behavior:

- `Refresh` calls the backend suggestion service.
- Suggestions may be loaded from cache when the page loads, but page load should
  not record ignored suggestion events.
- `Pin` pins only that suggestion and removes it from the current suggestion
  list after the backend succeeds.
- There is no visible `Ignore` button.
- When `Refresh` is clicked, currently visible suggestions that were not pinned
  are recorded as ignored suggestion signals before the new list is loaded.
- A failed `Pin` keeps the suggestion visible and shows the backend message in
  the shared notification stack.
- A pending pin disables only that suggestion's action. `Refresh` is disabled
  while suggestions are loading or while any suggestion action is pending.
- `Pin` should refresh the database-backed memory list and dashboard pinned
  state after success.
- `Refresh` should refresh memory list summary fields after recording ignored
  suggestion signals.

What should not happen:

- Suggestions should not appear on the home dashboard.
- Refreshing suggestions should not create database rows except event rows
  caused by explicit user actions such as `Refresh` or `Pin`.
- Viewing cached suggestions should not create database rows.
- Pinning a suggestion should not close memory/category dialogs.
- Pinning one suggestion should not automatically refresh the whole suggestion
  list.

## Required Editor Behavior

The editor UI should use modal dialogs over the current Memories page.

The visible behavior should be deterministic:

- The background is covered by a semi-transparent black overlay.
- The dialog is centered on desktop and usable on mobile.
- Closing the dialog without saving preserves persisted data.
- Successful save closes the dialog.
- Successful delete closes the dialog.
- Failed save/delete keeps the dialog open and shows the backend message through
  the shared notification stack.
- After success, the memory list and category filters refresh from the database.
- Buttons are disabled while the action is pending.
- Full-width save buttons cycle through `Saving.`, `Saving..`, and `Saving...`
  while saving. Compact delete confirmation buttons use static `Deleting...`
  while deleting. Keep the visible icon and current text naturally centered
  together, and do not show loading icons in memory/category dialog action rows.
- Memory and category editor dialogs use the shared dialog shell, shared field
  labels, shared text inputs/text areas, and the shared list primitive for
  category rows.
- Category records include optional descriptions. Manage Categories shows `New`
  in the header row, category rows as `ListItem` title/description, and
  `Delete` only inside the edit category dialog.

## Code Locations

Memory web UI:

```text
apps/web/src/features/memories/components/MemoriesPage.tsx
apps/web/src/features/memories/components/MemoriesPanel.tsx
apps/web/src/features/memories/components/SuggestionsPanel.tsx
apps/web/src/features/memories/components/PinnedMemoriesPanel.tsx
apps/web/src/app-shell/AppShell.tsx
```

Memory page backend and load failures should use the shared notification stack,
not a page-local inline message row.

Memory server actions:

```text
apps/web/src/features/memories/actions.ts
```

Memory backend:

```text
apps/web/src/features/memories/server/
```

Database migration:

```text
apps/infrastructure/database/migrations/0002_create_memories.sql
apps/infrastructure/database/migrations/0007_add_memory_category_description.sql
```

## Verification

Run from `apps/web`:

```text
pnpm lint
pnpm test
pnpm build
```
