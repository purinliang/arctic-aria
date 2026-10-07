# Supplies UI

The normal workspace header contains title, description and information hint.
A compact summary shows the restocking count and right-aligned New action. Below
it, All supplies and Need restock (count) are primary filters; a compact category
selector provides All, Food, Household and Travel shopping. The default view shows
both stock categories, with clear amber low-stock status and normal stock still visible.
Alphabetical order stays stable during adjustments so controls do not jump between
pages when a quantity crosses its threshold.
Changing category/filter resets six-row pagination.

Each stock row is a reusable RecordCard in a vertical list. Its first line has a
clickable name, quantity/target/unit (or a warning restock status), and edit icon.
The next line is a full-width quantity bar. Small integral step counts use segments;
fractional or large targets use continuous fill. Fill is capped at the target,
but the displayed quantity is not. Normal fill uses the existing blue accent;
low-stock fill uses amber. The last line shows remaining quantity and a compact
minus / current quantity / plus controller. Accessible labels identify the item
and operation without relying on colour.

Quantity changes use the configured step and permit stock above target. Subtraction
clamps at zero. Only that item's controls are disabled while its command is pending;
other items remain usable. Display/cache update after backend confirmation, before
background revalidation. Failures preserve the previous value, show a shared
notification, and refresh to resolve uncertain writes. Retry keys prevent duplicate
changes after lost responses. A quantity at or below its threshold needs restocking;
predictions and unopened spare counts do not affect this filter.

New and name/edit actions open the shared configuration dialog: name, Food/Household
category, unit, current quantity, target quantity, step, low-stock threshold and
optional note. Up to three decimal places are supported. Targets and steps must be
positive; thresholds range from zero to target. Configuration/archive uses expected
versions and closes only on success. Invalid or stale edits keep drafts open.

Travel shopping retains its six-row wishlist, linked supply, URL, optional country,
shop/note, edit and purchased toggle. Marking purchased changes neither quantities
nor expenses. Legacy levels, spare counts and observation history remain stored,
but replacement and depletion forecasting are not part of this simplified UI.

Account-scoped confirmed snapshots restore all categories while refreshing. No
pending quantity or wishlist change is saved as confirmed data. Cache schema v2
rejects invalid quantity configuration and removes obsolete v1 snapshots. Refresh
failures keep cached controls usable. Mobile preserves the same order with wrapped
filters and comfortably sized shared quantity buttons; no horizontal scrolling.
