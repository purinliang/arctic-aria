# Routines Web Implementation

This document records the current user-detectable Routines web behavior.
Product rules are defined in [overview.md](overview.md), data rules are defined in
[data-model.md](data-model.md), and visible UI behavior is defined in
[ui.md](ui.md).

## Current Scope

The current web implementation supports database-backed routine testing:

- load routine definitions from Neon
- load routine groups from Neon
- load today's routine instances from Neon
- load generated routine instances from Neon
- add, edit, and delete routine definitions
- add, edit, delete, and filter by routine groups
- parse and save routine templates from the add/edit dialog header menu
- choose start-date anchored recurrence rules
- choose a preferred time, start date, and optional end date
- show today's routine instances on Today
- mark a Today routine instance completed
- reopen a completed Today routine instance
- send due routine reminders when the Cloudflare cron worker invokes the
  web-hosted scheduled Discord cron route and Discord notification service
- store routine reminder state on routine instances with `remind_at` and
  `reminded_at`
- write routine completion history to `routine_completion_events`

The current Today UI does not show `Busy`, `Skip`, `Later`, or
`Move to tomorrow` buttons. Those are future reminder-response actions.

## Current User Flow

The user opens the Routines page from the sidebar.

The page should show:

- routine definition list
- right-side routine group filter panel
- `New` action in the panel header
- `Manage` action in the Groups panel header
- edit action on each routine row
- add/edit routine dialog
- routine template dialog
- group manager dialog
- delete confirmation dialog when deleting an existing routine

`New` opens routine creation UI.

Routine `Edit` opens routine editing UI.

Successful save or delete refreshes Today routine instances and routine
definitions from the backend response. It also refreshes the loaded routine
instance list.

Routine group save/delete also refreshes routine definitions, routine groups,
today's routine instances, and loaded routine instances from the backend
response.

The routine group filter is local UI state. It is not persisted and does not
call the backend.

The Routine Instances panel uses local date filters:

- `All`
- `Recent`: yesterday through three days after the current board date
- `Future`: four or more days after the current board date
- `Past`: two or more days before the current board date

Routine page, Today, and reminder loads lazily ensure up to the next three
instances per active routine. Saving a routine removes future pending
uncustomized instances for that routine and regenerates the next three.

## Today Panel

The Today `Routines` panel is feature-owned and rendered by `RoutinesPanel`.

Each routine row shows:

- completion checkbox on the left
- title
- description
- scheduled time beside the title

Checkbox behavior:

- checking the box marks the instance completed
- unchecking the box reopens the instance
- Today should treat this as a lightweight command
- future refactors should keep pending state per routine row and use the shared
  notification stack for backend failures

## Editor Dialog

The routine editor uses a modal dialog over the Routines page.

Fields:

- title
- optional description
- group
- fixed day interval only when the fixed-days option is selected
- start date
- end date
- preferred time
- repeat rule
- recurrence preview

The save flow is blocking:

- keep the dialog open while saving
- close only after the backend confirms success
- keep the dialog open when validation or persistence fails

Description placeholders are chosen from localized default routine copy when the
dialog opens and should not change while the user types. Missing saved
descriptions render localized fallback copy in routine rows without storing that
fallback in the database.

Delete is also blocking and requires confirmation before the backend command is
sent.

## Routine Template

`RoutineTemplateEditorDialog` reuses the shared `TemplateEditorDialog` used by
Project Template. Routine-specific code supplies the Markdown serializer,
server parse/save actions, and flat preview rows. The preview list uses shared
list rows, fixed-height `ScrollArea`, truncated titles, and full-word operation
badges for `Create`, `Update`, `Delete`, and `Preserve`.

Routine template parsing lives in feature-owned pure modules so Node tests can
exercise it without rendering the app shell:

```text
apps/web/src/features/template-parser.ts
apps/web/src/features/routines/routine-template-serializer.ts
apps/web/src/features/routines/routine-template-normalizer.ts
apps/web/src/features/routines/routine-template-draft.ts
apps/web/src/features/routines/routine-template-types.ts
```

The server actions `parseRoutineTemplate` and `applyRoutineTemplate` are normal
authenticated user actions, not developer-only routes. They load the signed-in
user's current routines, routine groups, and resolved timezone before
normalizing the template.

Template save behavior:

- create rows insert routines
- update rows save the matched routine
- delete rows soft-delete the matched routine
- preserve rows are skipped
- unknown routine ids return `routine_not_found`
- unknown non-empty `group_id` values return `routine_group_not_found`
- blank `group_id` saves the routine without a group

The generated template lists available routine group ids and names. Group
creation is intentionally not part of routine templates; users should create
groups from the existing Manage Groups dialog before assigning them by id.

## Code Locations

Routine web UI:

```text
apps/web/src/features/routines/components/RoutinesPage.tsx
apps/web/src/features/routines/components/RoutinesList.tsx
apps/web/src/features/routines/components/RoutineEditorDialog.tsx
apps/web/src/features/routines/components/RoutineFiltersPanel.tsx
apps/web/src/features/routines/components/RoutineTemplateEditorDialog.tsx
apps/web/src/features/routines/components/RoutineGroupManagerDialog.tsx
apps/web/src/features/routines/components/RoutineGroupsPanel.tsx
apps/web/src/features/routines/components/RoutineInstancesList.tsx
apps/web/src/features/routines/components/RoutineRecurrenceFields.tsx
apps/web/src/features/routines/components/RoutinesPanel.tsx
apps/web/src/features/routines/components/routine-page-helpers.ts
apps/web/src/features/routines/routine-recurrence.ts
apps/web/src/features/instance-date-filters.ts
```

Routine server actions:

```text
apps/web/src/features/routines/actions.ts
apps/web/src/features/routines/routine-template-actions.ts
apps/web/src/features/routines/routine-instance-actions.ts
```

Routine backend:

```text
apps/web/src/features/routines/server/
apps/web/src/features/routines/server/routine-reminder-schedule.ts
```

Scheduled Discord notification route and Cloudflare caller:

```text
apps/cron/src/index.js
apps/web/src/app/api/cron/discord-notifications/route.ts
apps/web/src/app/api/cron/routine-reminders/route.ts
```

Database migration:

```text
apps/database/migrations/0003_create_routines.sql
apps/database/migrations/0022_add_routine_reminder_state.sql
apps/database/migrations/0026_create_routine_groups.sql
apps/database/migrations/0033_split_completion_events.sql
```

Focused tests:

```text
apps/web/src/features/routines/__tests__/postgres-routine-repository.test.ts
apps/web/src/features/routines/__tests__/routine-recurrence.test.ts
apps/web/src/features/routines/__tests__/routine-reminder-service.test.ts
apps/web/src/features/routines/__tests__/routine-service.test.ts
apps/web/src/features/routines/__tests__/routine-template.test.ts
apps/web/src/features/__tests__/instance-date-filters.test.ts
```

## Verification

Run from `apps/web`:

```text
pnpm test
pnpm lint
pnpm build
```
