# Money Data Model

Migration 0037 adds owner-scoped categories, preferences, quick-category slots,
and expenses. Composite owner/category foreign keys prevent cross-account links.
Supported currencies are AUD, CNY, USD, JPY, EUR. JPY uses whole units; others
use two decimal places. Decimal input becomes integer minor units without floats;
individual amounts range from one minor unit through 999999999999. Totals use
BigInt and exact localized formatting. Recorded dates are real local dates from
1900 through today in the account timezone, independent of browser timezone.

Each new expense/category uses a stable UUID, retained on retry. Replayed inserts
return the original active record without changing content or reviving archived
records. Notes are optional, trimmed, and limited to 500 Unicode characters.
Expense deletion and category archival are soft. Archived categories remain on
historical expenses but cannot be selected for new expenses. Account removal
cascades through the feature's owned data.

Seven built-in category identifiers initialize idempotently. Migration 0039
restores archived built-ins without changing expense references; prior names stay
stored but display uses fixed localized names. Built-ins cannot be renamed,
archived, or reordered. Repository commands refuse these changes, and a database
trigger protects their fields. Health remains available under Other for legacy
records; the six-choice grid order is Food, Transport, Shopping, Housing, Bills, Other.
Category reference checks are deferred to transaction commit so account-owned
cascades can finish in any order; deleting a referenced category alone still fails.

Custom categories have persisted positions, initially alphabetical. Create,
archive, and reorder serialize on the settings row. Reordering requires exactly
all active owned custom ids, with no duplicates or built-ins. Archival retains
expense references. Currency order remains account-owned; legacy quick-category
settings remain stored but do not control the new entry grid.
