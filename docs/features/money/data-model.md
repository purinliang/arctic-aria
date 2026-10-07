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

Seven built-in categories initialize idempotently. User renaming overrides their
localized default names. Currency order and up to five quick categories persist
per account. Preference writes and category archival serialize on the settings
row, so archival cannot leave a newly pinned archived category. Settings are
last-write-wins snapshots, not merged field by field.
