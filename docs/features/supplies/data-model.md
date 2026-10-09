# Supplies Data Model

Migration 0038 creates owner-scoped supply items, legacy observations, command
receipts and travel wishes. Migration 0040 extends items with numeric(12,3)
quantity, unit, increment, target_quantity and low_stock_threshold. Composite owner
foreign keys continue to protect observations, receipts and wishlist links.

Backfill preserves each old level as a neutral quantity with unit `unit`, increment
1, target 5 and threshold 1. It does not infer packs/bottles or add unopened spares.
Old levels, spares, cycles and observations remain unchanged and queryable. They
do not drive forecasts or current restocking decisions.

Quantities range from 0 to 999999.999, with at most three decimal places. Increments
and targets are positive; thresholds range from zero to target. Current quantity
can exceed target. Units contain 1-40 trimmed characters; name and note retain
their existing 100/500-character limits. Backend validation and SQL constraints
enforce these rules. Required user identity comes from the authenticated action,
never the form.

`save_supply_stock` creates/configures one item atomically, retaining stable-id
insert replay semantics. Updates require the expected version and increment it;
stale editors cannot overwrite a quantity change. `adjust_supply_quantity` locks
the owned active row, verifies version, applies direction times the stored step,
clamps subtraction at zero, and commits its receipt and versioned change together.
Owner/request-key replay returns without a second change. Archived items cannot
be revived. Simultaneous commands with the same version produce one success and
one stale response. Targets are preferences, not hard caps.

Wishlist fields, optional owned links, URL validation, versioning and
planned/purchased semantics remain unchanged. Purchased toggles do not alter stock
or create Money expenses. Archived links and historical observations remain
queryable. Item/wishlist removal is soft archival with confirmation; deleting an
account cascades through its owned data. There is no automatic consumption,
purchase prediction, or quantity-to-expense conversion.

## Simplified Stock Levels

The current UI creates approximate levels, not physical units: quantity 0–5,
neutral unit `unit`, increment 1, target 5 and threshold 1. Initial stock defaults
to 5. The editor does not expose this configuration. The existing version-checked
`save_supply_stock` command persists absolute levels without changing SQL functions,
schema, spare counts, old level observations, or cycles. No new migration is needed.

Existing neutral integer quantities in this configuration remain editable. All
other configurations, fractional quantities and values above five retain their
actual quantity/unit and are read-only in the stock list. Metadata edits pass their
complete existing configuration unchanged; no scale conversion, clamping, or
physical-unit inference occurs. Old adjustment/history APIs remain available.
