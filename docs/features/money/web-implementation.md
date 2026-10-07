# Money Web Implementation

Feature-local types, validation/formatting, authenticated actions, SQL repository,
hook, page, and dialogs live in `apps/web/src/features/money`. Money preferences
use feature-owned tables rather than extending global theme/language settings.
No third-party finance service is called.

Run the focused Node tests, `./scripts/verify-web.sh`, and
`bash scripts/check-personal-tools-schema.sh`. The schema check uses disposable
PostgreSQL and never contacts the configured application database. Migration
0037 must be approved/applied to the intended database before persisted use.
