# Money UI

The shared workspace header provides the title, description and information hint.
The unframed page has three rows:

1. Compact previous/month/next navigation on the left, shared segmented category
   tabs on the right. All is selected initially. On mobile the tabs move below
   navigation and scroll horizontally without widening the page.
2. Prominent selected-category monthly totals on the left, primary New expense
   on the right. Each currency has its own total; no conversion or date range.
3. Newest-first transaction cards, six per page, showing category, optional note,
   date, right-aligned amount/currency and an edit icon. No extra history heading,
   daily picker, Day/Month switch or category administration controls.

An empty selected month/category shows a full-width shared dashed empty-state
frame reading No expenses yet (localized). Its transparent background, standard
card radius, card-body padding and muted text keep it compact. The frame is
informational and has no click action. Month/category navigation, zero totals
and the New expense action remain unchanged. Loading does not show an empty
frame; adding a matching expense replaces the frame with transaction cards.

The entry dialog starts with Food, Transport, Shopping / Housing, Bills, More in
the existing three-column icon tile grid. More is an expansion button, not a
category. It reveals Health, Subscription, active custom categories and an icon
plus tile. The plus tile opens inline name/Create/Cancel controls, retaining the
expense draft. Built-ins cannot be renamed or deleted. There is no manual category
ordering or management dialog. Legacy Other and archived categories remain visible
when editing their own historical records; custom associations are preserved.

Below categories are Amount, all five currencies in AUD/CNY/USD/JPY/EUR order,
Note with suggestions, Date, and the full-width Save action. New records default
to AUD regardless of retained backend currency preferences. Edits keep their currency.
Note suggestions combine localized presets with all active historical notes in
the selected category, ranked by frequency. Case and surrounding whitespace are
deduplicated. Ties follow preset order, then alphabetical custom notes. Unused
presets remain available. The first six suggestions show initially, with More
when needed. Clicking fills the freely editable note; category changes never
overwrite it. Saved edits and deletions update derived counts on refresh.

Confirmed saves/deletes close the dialog; failures retain drafts and use shared
notifications. Inline category creation disables expense submission while saving.
Account/timezone/month cache snapshots remain usable during background refresh
and on refresh failure. Confirmed writes invalidate every monthly snapshot before
reloading the active month; stale responses cannot restore invalidated caches.
