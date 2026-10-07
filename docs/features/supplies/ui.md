# Supplies UI

Shared Tabs switch Food, Household, and Travel Shopping. Each tab uses a six-row
PagedList, New action, and shared editor dialogs. Tabs and row actions wrap on
narrow screens without changing spacing/color/text families. Food and Household
rows stack text above controls on mobile, keeping all six level choices visible.

Stock rows show title, +N unopened spares (omit zero), optional note, estimated
depletion/status metadata, and shared StockLevelControl. Six ghost icon controls
select 0–5; filled circles represent remaining levels. Titles, notes, and supporting
metadata use shared typography, with single-line supporting-text truncation.

Stock observation changes are optimistic, pending per item, and roll back with a
shared error notification on failure. Other rows remain usable. A higher level
requires explicit replacement. Replace opens a confirmation-style editor, defaults
to consuming a spare when available, and closes only after backend confirmation.
It resets to full and starts a fresh estimation cycle. History opens a read-only
six-row manager list with localized timestamps and current/previous cycle labels.

All/Needs attention filtering includes empty/low items and estimated depletion
within seven days. Empty active stock with spares says Replace; without spares,
Buy. Low stock without spares says Buy soon; with spares, Spare available. Flat
or insufficient history says Not enough history, not an invented run-out date.

The stock editor sets title, kind, spare count, and note; initial level is editable
only during creation. Existing levels change through the row controls. CRUD saves
and confirmed archives are blocking, retain drafts on failure, and use shared
notifications. Stale writes refresh the list and require reopening the editor.

Travel rows show purchase notes, country/shop/status metadata, and optional linked
stock level/spares/estimate. Purchased toggles are optimistic and independent per
row. Open link uses a new browser tab with noopener/noreferrer. The shared editor
sets optional link and destination fields without requiring a particular country.
Purchasing does not generate inventory or expense records. All copy is localized.
