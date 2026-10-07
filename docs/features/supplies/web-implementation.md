# Supplies Web Implementation

Feature-owned components, hooks, validation, types, authenticated actions, and
repository live in `apps/web/src/features/supplies`. Forecasting is a pure helper.
Shared QuantityControl/QuantityProgress own compact stepping and stock indicators. Domain data is loaded only
when the page mounts and is not mixed into the dashboard cache.

An account-scoped localStorage snapshot shows stock and travel purchases while
refreshing in the background. Only confirmed backend data is cached: pending
quantity changes and purchase toggles never enter storage. Successful
quantity commands update the UI and confirmed snapshot immediately after backend
confirmation; wishlist toggles retain their optimistic interaction. CRUD commands
invalidate it before fetching the refreshed list. Refresh failure keeps visible
data and reports through shared notifications. Pending and newer-version rows
are protected from stale refreshes. Quantities are formatted for the current
language, not cached as display text. Forecasting is not rendered or used for restocking.

Pending commands are keyed per item. Confirmed stock and optimistic wishlist updates preserve
unrelated pending rows during refresh. Command keys survive failed quantity requests;
the server receipt prevents a lost-response retry from changing stock twice.
Metadata and wishlist edits use version comparison; failures leave dialogs open.

Run focused tests and `./scripts/verify-web.sh`. The repeatable schema check,
`bash scripts/check-personal-tools-schema.sh`, uses disposable PostgreSQL and
includes legacy backfill, built-in category protection, custom ordering, exact
fractional steps and simultaneous quantity/replacement requests. Browser checks use mocked actions
against a matching production build: `node apps/web/scripts/check-personal-tools.mjs`.
They cover both languages/themes and desktop/mobile, capture, retry/rollback,
cached reloads during failed refreshes, confirmed-only stock and purchase caches,
fractional quantity changes, thresholds, excess stock, capture and wishlist isolation. Screenshots live in
`/tmp/arctic-aria-personal-tools`; BASE_URL/SCREENSHOT_DIR override the defaults.

Migrations 0038 and 0040 must be approved/applied to the intended database before persisted
use. Neither check above writes to the configured app database. For an explicitly
selected development database and a local server, run from `apps/web`:

```bash
node --env-file=.env.local scripts/check-personal-tools-live.mjs --confirm-development
```

This check uses real server actions, creates an isolated temporary account, and
removes only its fixture records in `finally`. Never target production. It covers
expense persistence, fractional quantity steps, excess stock, and reload.
The quantity workflow is also covered by the schema and mocked browser checks. Expiry
tracking and outbound reminders are deliberately deferred.
