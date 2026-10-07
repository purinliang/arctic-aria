# Supplies Web Implementation

Feature-owned components, hooks, validation, types, authenticated actions, and
repository live in `apps/web/src/features/supplies`. Forecasting is a pure helper.
Shared StockLevelControl owns the reusable six-step UI. Domain data is loaded only
when the page mounts and is not mixed into the dashboard cache.

Pending commands are keyed per item. Optimistic stock/wishlist updates preserve
unrelated pending rows during refresh. Command keys survive failed stock requests;
the server receipt prevents a lost-response retry from consuming an extra spare.
Metadata and wishlist edits use version comparison; failures leave dialogs open.

Run focused tests and `./scripts/verify-web.sh`. The repeatable schema check,
`bash scripts/check-personal-tools-schema.sh`, uses disposable PostgreSQL and
includes simultaneous replacement requests. Browser checks use mocked actions
against a matching production build: `node apps/web/scripts/check-personal-tools.mjs`.
They cover both languages/themes and desktop/mobile, capture, retry/rollback,
pagination, stock replacement/history, and wishlist isolation. Screenshots live in
`/tmp/arctic-aria-personal-tools`; BASE_URL/SCREENSHOT_DIR override the defaults.

Migration 0038 must be approved/applied to the intended database before persisted
use. Neither check writes to the configured app database. History remains read-only
in v1; expiry tracking and outbound reminders are deliberately deferred.
