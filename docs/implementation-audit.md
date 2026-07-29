# Implementation Audit

This file records documentation-only findings from repository inspection. Code,
schema, tests, and configuration remain the source of truth. Items here are not
implemented fixes.

## Confirmed Limitations

### Discord Binding Has No Server-Pushed Web Update

Evidence:

- `apps/web/src/features/settings/components/DiscordBindingSection.tsx`
- `apps/web/src/features/discord/server/account-binding.ts`
- `apps/web/src/features/discord/server/interactions.ts`

The Settings page can create and cancel binding codes, and Discord `/bind`
consumes a valid code. The open Settings page does not receive a server-pushed
event after `/bind` succeeds in Discord. The user-visible result is that the web
page may keep showing the pending-code state until a later reload or explicit
status refresh path checks the database again.

Safer future behavior: add a small authenticated app event channel or
server-notification mechanism so Settings can refresh binding state after the
Discord interaction completes.

### Routine Reminder Has Two Web Cron Entry Points

Evidence:

- `apps/web/src/app/api/cron/discord-notifications/route.ts`
- `apps/web/src/app/api/cron/routine-reminders/route.ts`
- `apps/cron/src/index.js`

The Cloudflare worker calls `/api/cron/discord-notifications`, which runs both
routine reminders and Daily Review. The older `/api/cron/routine-reminders`
route still exists for manual routine-reminder checks.

User-visible consequence is unlikely during normal deployment because only the
combined route is scheduled. If both routes are scheduled externally at the same
time, routine reminder work can be invoked twice. `discord_message_deliveries`
and `reminded_at` reduce duplicate delivery risk, but concurrent runs before
`reminded_at` is updated should be treated as a possible race until tested.

Safer future behavior: either keep the routine-only route documented as manual
only, remove it after confidence grows, or add stronger transactional duplicate
protection around reminder selection and delivery recording.

### Memory Events Are Not Permanent After Memory Delete

Evidence:

- `apps/database/schema.md`
- `apps/web/src/features/memories/server/postgres-memory-core-queries.ts`
- `docs/features/memories/data-model.md`

Memory delete is a hard delete. Linked `memory_events` rows are removed by
foreign-key cascade. The `deleted` memory event type is allowed by the schema,
but it is not durable after the memory row is deleted.

User-visible consequence is low because the current UI does not expose memory
event history. If future review, audit, or recommendation behavior depends on
deleted-memory history, memories should move to soft delete before relying on
`memory_events` as permanent history.

### Pinned Memory Expiry Fields Are Not Applied On Today Load

Evidence:

- `apps/web/src/features/memories/server/memory-service.ts`
- `apps/web/src/features/memories/server/postgres-pinned-memory-queries.ts`
- `apps/web/src/features/memories/components/PinnedMemoriesPanel.tsx`

Pinned memory rows store `visible_until` and `completed_cleanup_at`, and the
backend still has a `replacePinnedMemory` helper. The current Today load path
lists pinned memories and maps completion state; it does not automatically
remove or replace rows whose visible window or completed cleanup time has
passed.

User-visible consequence: a completed or expired pinned memory can remain in
the Today list until the user manually changes pin state or another feature
path replaces it.

Safer future behavior: either implement the cleanup/replacement rule during
Today load with focused tests, or remove the unused timing/replacement concept
from the current data model and UI expectations.

## Possible Risks

### Today Selection And Reminder Rules Depend On Stored Resolved Timezone

Evidence:

- `apps/web/src/features/settings/time-zones.ts`
- `apps/web/src/features/projects/server/postgres-project-dashboard-queries.ts`
- `apps/web/src/features/routines/server/routine-reminder-service.ts`
- `apps/web/src/features/dashboard/server/today-review-service.ts`

Today task selection, routine instances, routine reminders, and Daily Review
resolve local dates through the user's stored timezone settings. When the user
preference is `system`, the server needs `user_settings.resolved_timezone`,
which is last synced from the browser.

User-visible consequence: if no concrete resolved timezone exists, scheduled
server-side work may skip Daily Review or use a fallback path for other
scheduling logic. This is expected current behavior, but it makes timezone sync
an important login/settings side effect.

Safer future behavior: keep timezone sync covered by tests and record a visible
diagnostic if scheduled work is skipped because no concrete timezone is known.
