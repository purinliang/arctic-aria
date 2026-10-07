# Money UI

The shared workspace header provides the title, short description and information
hint. An unframed monthly summary shows month/year, compact previous/next arrows,
prominent totals separated by currency, and the complete date range. Future month
navigation is disabled. Totals cover all monthly records, independently of list
pagination, day selection, or category filtering.

New expense (primary) and Categories (secondary) share a compact action row.
History uses compact Day/Month tabs, a date picker, a secondary category selector,
and six vertical records per page. Each record shows category, optional note,
date, a right-aligned amount and an edit icon. Day history filters the already
loaded monthly data without a new request. A month change loads its own snapshot.

The compact expense dialog starts with a three-column icon grid: Food, Transport,
Shopping / Housing, Bills, Other. Other reveals the ordered custom-category picker,
plus the retained Health and Other categories. Categories can be managed from
inside the dialog without losing its amount/date/note. Built-ins have fixed names
and no edit/delete/reorder controls. Custom categories support create, rename,
confirmed archival and ordering through drag handles or up/down buttons. Ordering
never moves built-ins or rewrites expense references.

Amount, optional note, date and existing currency choice controls remain in the
same dialog. Preferred currency order is managed through its secondary Currencies
header icon; the first currency is the default. Category management is also available
through a named/tooltip header icon. Unsupported currencies and conversions
remain unavailable. Nested managers use explicit dialog layers and preserve drafts.

CRUD saves/deletes close only after confirmation from the backend. Failures retain
drafts and use shared notifications. Cached account/timezone/month snapshots stay
usable during background refresh and remain visible on refresh failure. Confirmed
writes invalidate every period snapshot before refreshing the currently active
month; stale responses cannot restore an old cache. Responsive controls wrap
without horizontal overflow, using the same text, spacing and palette tokens as
Progress and Supplies.
