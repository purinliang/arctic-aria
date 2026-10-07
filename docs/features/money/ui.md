# Money UI

Quick capture uses shared ActionCards with icons and names, no counters. Initially
Food, Transport, Housing, Bills, and Shopping are pinned. New opens an expense
editor with category, decimal amount, preferred currencies, date, and note.
Capture cards keep their selected category fixed and show it in the dialog title;
New and existing-record editors retain the category picker. Currency choice
labels use shared centered compact controls.
More currencies reveals other supported currencies. Currency settings use shared
choice controls and ReorderList: drag handles on desktop and move arrows for
keyboard/mobile. The first preferred currency is the default; an empty preferred
list cannot be saved. Existing records are unaffected by preference changes.

The category manager uses ManagerDialogSection and six-row ManagerList. New aligns
with edit actions; pin controls select up to five capture cards. Archival requires
confirmation. Editing a category opens the shared CRUD dialog.

History defaults to Day/today. Shared Tabs switch Day/Month; the calendar selects
the reference date (Month uses that date's entire month). A category selector
filters both totals and six paged expense cards. Cards use two columns on larger
screens and one on mobile, with notes limited to two lines and full text kept in
the editor. Tabs fit their labels rather than stretching the entire section.
Totals remain separate
by currency and cover every filtered record, not just the visible page.

CRUD saves/deletes block only their dialog and close after backend confirmation.
Failures retain the draft and use shared notifications. Read requests ignore
stale responses after period switches. Loading hides outdated list/totals.
English and Chinese share responsive layouts, palette, text, and spacing tokens.

Cached period views keep capture, totals, and records visible during background
refresh. Account, timezone, and period scopes prevent showing unrelated snapshots.
Refresh failures retain visible cached content; confirmed writes invalidate old
period snapshots before refresh. No cached data changes on failed writes.
