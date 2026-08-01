# Events Web Implementation

This document records the current user-detectable Events web behavior. Product
rules are defined in [overview.md](overview.md), data rules are defined in
[data-model.md](data-model.md), and visible UI behavior is defined in
[ui.md](ui.md).

## Current Scope

The current web implementation supports database-backed Events:

- load non-deleted Event definitions
- load generated Event instances
- load today's Event instances for the current local board date
- add, edit, and soft-delete Events
- add, edit, delete, and filter by Event Groups
- choose `once`, `daily`, or `weekly` recurrence
- edit one Event instance's scheduled date, scheduled time, location override,
  and reschedule reason
- cancel one Event instance with an optional cancellation reason
- parse and save Event templates from the add/edit dialog header menu
- filter Event instances by `All`, `Recent`, `Future`, or `Past`
- show today's Events as display-only rows on Today
- include Events in scheduled Daily Review text and metadata

The current version does not send Discord Event reminders.

## Data Flow

`AppShell` owns authenticated app state and loads Events through
`useDashboardEvents`. The hook uses the shared dashboard browser cache with
stale-while-refresh behavior.

Successful definition, group, instance, or delete actions refresh cached Event
definitions, generated Event instances, Today Event rows, and Event Groups from
the backend response. Failed actions keep dialogs open and show a shared
notification.

Event page and Today loads lazily ensure up to the next three upcoming
instances per active Event definition from the user's current board date.
Saving an Event definition removes future uncustomized scheduled instances for
that definition and regenerates the next three instances.

## Event Template

`EventTemplateEditorDialog` reuses the shared `TemplateEditorDialog` used by
Project Template. Event-specific code supplies the Markdown serializer, server
parse/save actions, and flat preview rows. The preview list uses shared list
rows, fixed-height `ScrollArea`, truncated titles, and full-word operation
badges for `Create`, `Update`, `Delete`, and `Preserve`.

Event template parsing lives in feature-owned pure modules so Node tests can
exercise it without rendering the app shell:

```text
apps/web/src/features/template-parser.ts
apps/web/src/features/events/event-template-serializer.ts
apps/web/src/features/events/event-template-normalizer.ts
apps/web/src/features/events/event-template-types.ts
```

The server actions `parseEventTemplate` and `applyEventTemplate` are normal
authenticated user actions, not developer-only routes. They load the signed-in
user's current non-deleted Event definitions before normalizing the template.

Template save behavior:

- create rows insert Events
- update rows save the matched Event
- delete rows soft-delete the matched Event
- preserve rows are skipped
- unknown Event ids return `event_not_found`
- create rows use a `once` rule in the user's resolved timezone
- update rows preserve the matched Event's group, end date, recurrence rule,
  and timezone

## Code Locations

Event web UI:

```text
apps/web/src/features/events/components/EventsPage.tsx
apps/web/src/features/events/components/EventsList.tsx
apps/web/src/features/events/components/EventFiltersPanel.tsx
apps/web/src/features/events/components/EventEditorDialog.tsx
apps/web/src/features/events/components/EventGroupsPanel.tsx
apps/web/src/features/events/components/EventGroupManagerDialog.tsx
apps/web/src/features/events/components/EventInstanceEditorDialog.tsx
apps/web/src/features/events/components/EventInstancesList.tsx
apps/web/src/features/events/components/EventTemplateEditorDialog.tsx
apps/web/src/features/events/components/EventsPanel.tsx
apps/web/src/features/events/components/event-page-helpers.ts
```

Event server actions:

```text
apps/web/src/features/events/actions.ts
apps/web/src/features/events/event-action-helpers.ts
apps/web/src/features/events/event-template-normalizer.ts
```

Event backend:

```text
apps/web/src/features/events/server/
```

Database migration:

```text
apps/database/migrations/0030_create_events.sql
apps/database/migrations/0031_events_estimated_duration_hours.sql
apps/database/migrations/0032_drop_event_estimated_duration_minutes.sql
apps/database/migrations/0034_create_event_instances.sql
```

Focused tests:

```text
apps/web/src/features/events/__tests__/*.test.ts
```

## Verification

Run from the repository root:

```text
pnpm --dir apps/web exec node --test src/features/events/__tests__/*.test.ts
```
