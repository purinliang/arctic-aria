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

Tasks and routines remain dummy dashboard data.

## Current User Flow

The user opens the Memories page from the sidebar.

The page should show:

- memory list
- category filter chips
- `Add` action
- `Categories` action
- suggestion placeholder

`Add` opens memory creation UI.

Memory `Edit` opens memory editing UI.

`Categories` opens category management UI.

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
