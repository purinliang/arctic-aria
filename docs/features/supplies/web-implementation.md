# Supplies Web Implementation

Feature-owned components, hooks, validation, types, authenticated actions, and
repository live in `apps/web/src/features/supplies`. Forecasting is a pure helper.
Shared StockLevelControl owns the reusable six-step UI. Domain data is loaded only
when the page mounts and is not mixed into the dashboard cache.

An account-scoped localStorage snapshot shows stock and travel purchases while
refreshing in the background. Only confirmed backend data is cached: pending
levels, replacement cycles, and purchase toggles never enter storage. Successful
lightweight commands update the confirmed snapshot immediately. CRUD commands
invalidate it before fetching the refreshed list. Refresh failure keeps visible
data and reports through shared notifications. Pending and newer-version rows
are protected from stale refreshes. Estimates are still computed for the current
time and formatted for the current timezone/language, not cached as display text.

Pending commands are keyed per item. Optimistic stock/wishlist updates preserve
unrelated pending rows during refresh. Command keys survive failed stock requests;
the server receipt prevents a lost-response retry from consuming an extra spare.
Metadata and wishlist edits use version comparison; failures leave dialogs open.

Run focused tests and `./scripts/verify-web.sh`. The repeatable schema check,
`bash scripts/check-personal-tools-schema.sh`, uses disposable PostgreSQL and
includes simultaneous replacement requests. Browser checks use mocked actions
against a matching production build: `node apps/web/scripts/check-personal-tools.mjs`.
They cover both languages/themes and desktop/mobile, capture, retry/rollback,
cached reloads during failed refreshes, confirmed-only stock and purchase caches,
pagination, stock replacement/history, and wishlist isolation. Screenshots live in
`/tmp/arctic-aria-personal-tools`; BASE_URL/SCREENSHOT_DIR override the defaults.

Migration 0038 must be approved/applied to the intended database before persisted
use. Neither check above writes to the configured app database. For an explicitly
selected development database and a local server, run from `apps/web`:

```bash
node --env-file=.env.local scripts/check-personal-tools-live.mjs --confirm-development
```

This check uses real server actions, creates an isolated temporary account, and
removes only its fixture records in `finally`. Never target production. It covers
expense persistence, stock observation/replacement/history, and reload.
History remains read-only
in v1; expiry tracking and outbound reminders are deliberately deferred.
