# Routines Web Implementation

This document records the current user-detectable Routines web behavior.
Product rules are defined in [overview.md](overview.md), data rules are defined in
[data-model.md](data-model.md), and visible UI behavior is defined in
[ui.md](ui.md).

## Current Scope

The current web implementation supports database-backed routine testing:

- load routine definitions from Neon
- load today's routine instances from Neon
- add, edit, and delete routine definitions
- choose start-date anchored recurrence rules
- choose a preferred time, first start date, and optional end date
- show today's routine instances on the dashboard
- mark a dashboard routine instance completed
- reopen a completed dashboard routine instance

The current dashboard UI does not show `Busy` or `Skip` buttons. Those are
future reminder-response actions.

## Current User Flow

The user opens the Routines page from the sidebar.

The page should show:

- routine definition list
- `New` action in the panel header
- edit action on each routine row
- add/edit routine dialog
- delete confirmation dialog when deleting an existing routine

`New` opens routine creation UI.

Routine `Edit` opens routine editing UI.

Successful save or delete refreshes dashboard routine instances and routine
definitions from the backend response.

## Dashboard Panel

The dashboard `Routines` panel is feature-owned and rendered by
`RoutinesPanel`.

Each routine row shows:

- completion checkbox on the left
- title
- description
- supporting metadata as `scheduled time · due/answered text`

Checkbox behavior:

- checking the box marks the instance completed
- unchecking the box reopens the instance
- the dashboard should treat this as a lightweight command
- future refactors should keep pending state per routine row and use the shared
  notification stack for backend failures

## Editor Dialog

The routine editor uses a modal dialog over the Routines page.

Fields:

- title
- description
- recurrence rule
- recurrence preview
- fixed day interval only when the fixed-days option is selected
- preferred time
- first start date
- optional inclusive end date

The save flow is blocking:

- keep the dialog open while saving
- close only after the backend confirms success
- keep the dialog open when validation or persistence fails

Delete is also blocking and requires confirmation before the backend command is
sent.

## Code Locations

Routine web UI:

```text
apps/web/src/features/routines/components/RoutinesPage.tsx
apps/web/src/features/routines/components/RoutinesList.tsx
apps/web/src/features/routines/components/RoutineEditorDialog.tsx
apps/web/src/features/routines/components/RoutinesPanel.tsx
apps/web/src/features/routines/components/routine-page-helpers.ts
```

Routine server actions:

```text
apps/web/src/features/routines/actions.ts
```

Routine backend:

```text
apps/web/src/features/routines/server/
```

Database migration:

```text
apps/web/database/migrations/0003_create_routines.sql
```

Focused tests:

```text
apps/web/src/features/routines/__tests__/postgres-routine-repository.test.ts
apps/web/src/features/routines/__tests__/routine-service.test.ts
```

## Verification

Run from `apps/web`:

```text
pnpm test
pnpm lint
pnpm build
```
