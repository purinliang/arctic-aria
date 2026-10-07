# Supplies Data Model

Migration 0038 adds stock items, observations, retry receipts, and travel wishes.
All are owner-scoped. Composite owner/item foreign keys protect observations,
receipts, and optional wishlist links from cross-account references.

Stock items store Food/Household kind, a required title (1–100 characters), optional
note (500), current level (0–5), spares (0–999), version, and active cycle UUID.
Creation is retry-safe using a stable item UUID and creates one initial observation.
Metadata saves and archives use expected-version comparison; stale editors cannot
overwrite newer stock levels or spare counts. Metadata edits do not rewrite usage.

Stock commands lock the item row, check ownership/version, and retain an owner/key
retry receipt. Observation records a non-increasing level. Replacement starts a
new full item with a new cycle and optionally consumes exactly one spare. All
changes and their observation commit atomically in one PostgreSQL function call.
Replayed commands return current stock without applying consumption twice.
Archived items cannot be revived by replay. Two simultaneous replacements with
the same version produce one change; the other returns a stale-version failure.

Forecasting uses the latest three observations in the active cycle, or two when
only two exist. Rate is endpoint level decrease divided by elapsed time; estimated
depletion is latest observation time plus current level divided by rate. Equal-time,
flat, insufficient, or increasing records yield no prediction. Spares do not extend
the active item's estimate. Dates are explicitly estimated; a past estimate requests
an update and never changes stock to empty automatically.

Wishlist records store title, optional country (100), shop (200), HTTP/HTTPS link
(1000), note (500), optional owned supply link, planned/purchased status, and
version. URL protocol is validated and normalized before storage; links are not
fetched by the backend. Changes use version checks. Marking purchased never changes
stock or Money. Existing links survive supply archival and display as archived.

Stock and wishlist removal is soft archival with confirmation. Observations and
retry receipts remain stored, and an owner can still query archived usage history.
Account removal cascades through all feature-owned records.
