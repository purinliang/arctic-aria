# Money Web Implementation

Feature-local types, validation/formatting, authenticated actions, SQL repository,
hook, page, and dialogs live in `apps/web/src/features/money`. Money preferences
use feature-owned tables rather than extending global theme/language settings.
No third-party finance service is called.

The page uses an account/timezone-scoped localStorage cache of the four most
recently refreshed monthly views. The cache still accepts day views for compatibility;
the page fetches a single monthly view and filters day history locally. This keeps
summary and history consistent and avoids duplicate requests. Cached categories, currency preferences, totals, and
expenses stay visible while revalidating. A different uncached period loads
without showing the previous period's data. Refresh failures retain cached data
and use shared notifications; blocked/corrupt storage falls back to live reads.
Confirmed writes invalidate all period snapshots, then refresh the active view.
If that refresh fails, the old visible view is not written back to storage.
The personal-tools browser check covers cached reloads during failed refreshes
across both languages/themes and desktop/mobile viewports.

Run the focused Node tests, `./scripts/verify-web.sh`, and
`bash scripts/check-personal-tools-schema.sh`. The schema check uses disposable
PostgreSQL and never contacts the configured application database. Migration
0037 and 0039 must be approved/applied to the intended database before persisted use.
