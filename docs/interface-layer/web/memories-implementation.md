# Memories Web Implementation

This document records the current user-detectable Memories web behavior. Product
rules are defined in [memories.md](../../core-layer/memories.md).

## Current Scope

The current web implementation supports database-backed memory testing:

- load memory categories from Neon
- load memories from Neon
- add, edit, and delete memories
- add, edit, and delete categories
- show pinned memories on the dashboard from Neon
- mark pinned memories done
- cancel pinned memory done
- replace a pinned memory with another same-category memory when available

Tasks remain dummy dashboard data until the task feature replaces them.
Routines are database-backed.

## Current User Flow

The user opens the Memories page from the sidebar.

The page should show:

- memory list
- category filter chips
- `Add` action
- `Categories` action
- suggestions panel on the right side on desktop and below the list on mobile

`Add` opens memory creation UI.

Memory `Edit` opens memory editing UI.

`Categories` opens category management UI.

## Suggestions Panel

The Suggestions panel is part of the Memories page.

Location and alignment:

- On desktop, the panel appears in the right column beside the memory list.
- On mobile and narrow screens, it appears below the memory list.
- The panel header aligns with the top of the memory list panel.
- The panel is a single card with a border and the same radius as other
  dashboard panels.

Header:

- The left side shows the `RefreshCw` icon.
- The title text is `Suggestions`.
- Under the title, show short muted text:
  `Refresh saved memories when you want an option.`
- The right side shows a compact `Refresh` button.
- The `Refresh` button includes the `RefreshCw` icon and the text `Refresh`.

Suggestion list:

- Before the user clicks `Refresh`, show muted text:
  `Click Refresh to load suggestions.`
- While loading, show muted text:
  `Loading suggestions...`
- If there are no eligible memories, show muted text:
  `No suggestions available. Add more memories or unpin existing ones.`
- Each suggestion appears as a simple row, not a nested card.
- Each row shows:
  - title
  - category chip
  - short description
  - last-done text and done count
  - `Pin` button

Button behavior:

- `Refresh` calls the backend suggestion service.
- Suggestions should not refresh automatically when the page loads.
- `Pin` pins only that suggestion and removes it from the current suggestion
  list after the backend succeeds.
- There is no visible `Ignore` button.
- When `Refresh` is clicked, currently visible suggestions that were not pinned
  are recorded as ignored suggestion signals before the new list is loaded.
- A failed `Pin` keeps the suggestion visible and shows the backend message in
  the panel.
- Buttons are disabled while a suggestion action is pending.
- `Pin` should refresh the database-backed memory list and dashboard pinned
  state after success.
- `Refresh` should refresh memory list summary fields after recording ignored
  suggestion signals.

What should not happen:

- Suggestions should not appear on the home dashboard.
- Refreshing suggestions should not create database rows except event rows
  caused by explicit user actions such as `Refresh` or `Pin`.
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
- Failed save/delete keeps the dialog open and shows the error message.
- After success, the memory list and category filters refresh from the database.
- Buttons are disabled while the action is pending.

## Code Locations

Memory web UI:

```text
apps/web/src/features/dashboard/components/MemoriesPage.tsx
apps/web/src/features/dashboard/components/Dashboard.tsx
```

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
apps/web/database/migrations/0002_create_memories.sql
```

## Verification

Run from `apps/web`:

```text
pnpm lint
pnpm test
pnpm build
```
