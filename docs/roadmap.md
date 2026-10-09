# Roadmap

## Floating Chat

- Implemented a compact workspace Aria Chat opener, per-user Gemini
  conversation, seven-day history, browser cache and retention cleanup.
- History search backend is retained, but panel search UI is intentionally
  hidden per developer review. Do not restore it without human confirmation.
- Pending human confirmation: review live-key chat quality and compact
  desktop/mobile interaction. Chat has no task or other product mutation tools.

This roadmap records future work. It should not repeat released implementation
details; released behavior belongs in `docs/releases/` and stable rules belong
in the owning feature, web, or infrastructure docs.

Current released version: `v0.17.0`.

Next hotfix target: `v0.17.1`.

2026-10-10: `feature/gemini-api-environment` is integrated into `develop`.
The developer requested release preparation, including the accumulated Money
and Supplies refinements. See `docs/releases/v0.17.0.md`. The `v0.16.1`
demo-entry hotfix is integrated, and the production-only AI credential-encryption
secret is configured in Vercel. The existing `pnpm deploy` build command applies
migrations through `0045` before promotion. No deployment is performed by release
preparation. Deferred feature visibility remains unchanged.

## Development-Only Tracking

- **Pending human confirmation:** Restore and review the Progress page. Hidden
  on all branches, including production and hotfix builds; implementation, data
  and APIs remain intact. Do not re-enable during unrelated work.
- **Pending human confirmation:** Restore and review Travel Shopping in Supplies.
  Temporarily hide the UI only; retain code, records and supporting commands.
  Do not re-enable during unrelated work.

As of 2026-10-08, Progress, Money, and Supplies from `feature/daily-life-log`
are approved for integration into `develop` only. They remain in progress and
need further UI and workflow review. Do not release them to `main` or deploy
them to production without a separate developer approval.

Follow-up on `feature/personal-tracking-cache` adds account-scoped Money period
and Supplies stock/wishlist snapshots, with background refresh and confirmed-write
invalidation. This successor branch is also development-only.

2026-10-08 redesign on the same branch: Progress totals and duration presets,
Money monthly summaries with fixed/custom category capture, and Supplies fractional
quantities with restocking thresholds. Migrations 0039/0040 preserve category
references and legacy supply records. Production release remains on hold.

2026-10-09 Supplies simplification on the same branch uses fixed 0–5 levels for
new items, optimistic interactive stock bars, priority sorting and a minimal
editor. Existing physical quantities stay intact and read-only; no new migration.
Travel shopping remains available in a collapsed secondary section.

2026-10-09 compact Supplies follow-up: responsive 3/2/1-column grid, first-cell
creation tile and continuously interactive bars. Per-item serial queues coalesce
rapid selections and reuse server versions; no schema change. Travel Shopping
is now hidden pending the explicit human review above.

2026-10-09 Money refinement on the same branch: monthly navigation and category
tabs, filtered per-currency totals, compact expense entry with inline custom
creation and history-ranked note suggestions. Migration 0041 adds immutable
Subscription without changing historical associations. Currency/category
administration is hidden. Development-only; production release remains on hold.

2026-10-09 integration: the developer approved merging
`feature/personal-tracking-cache` into `develop`, including caches, compact stock
updates, monthly expense entry, shared dialog action menus and dashed empty
states. Further product review and production-release approval remain pending.
Progress and Travel Shopping must stay hidden until human confirmation.

## Pending Hotfix

- `v0.16.1`: prevent the sign-in form flashing during `?demo=true` entry.
  Implemented on `hotfix/v0.16.1-demo-entry-flash`; production release and
  integration back into `develop` remain pending.

## Next Work After v0.12.0

- Gemini API environment is prepared on `feature/gemini-api-environment`
  (2026-10-09): server-only adapter, explicit smoke commands, and account-scoped
  AI Provider settings with encrypted user-owned keys and rate-limited tests.
  Live access requires each user's API key and Google model eligibility.
  Production release requires a stable credential-encryption deployment secret.
  Pending human confirmation: verify API key saves no longer trigger Chrome's
  native account-password update prompt in an existing browser profile. The key
  now uses a CSS-masked text field with its own identity and autocomplete disabled,
  with a native masked fallback only in browsers without CSS masking support.
  Implemented 2026-10-10: account-owned Model row, currently showing only 3.5
  Flash-Lite per developer confirmation. Options use hard-coded ascending version
  order (Lite before Flash at the same version) when expanded. Migrations
  `0043` and `0044` add model storage and move existing settings to 3.5 Flash-Lite.
  Model-only saves retain
  ciphertext, and tests use the selected model. Live model access still needs
  human confirmation; do not silently fall back or treat every 404 as proof of
  an invalid key.
  Local development now emits credential-free Gemini failure diagnostics
  (model, HTTP status, application code). Root cause of the developer's reported
  404 remains unconfirmed; compare the same key and API request before changing
  the model. Do not enable raw provider or Server Function argument logging.
  The neutral Settings test can also print Google's redacted error message in
  development only; credential-bearing headers and response metadata stay omitted.
  Settings now exposes only Save for a new key: validate first, persist only on
  success. Saved keys expose Delete only, with backend and atomic database guards
  against replacement. Native Chrome behaviour and real-key access remain human
  review items; automated persistence checks use a fake provider.
  AI/chat integration, data-sharing consent and command confirmations remain pending human review.
  Do not automatically restore Progress or chat as part of this setup.

- Continue explicit schedule actions for Today items. Routine `Later` and
  `Tomorrow`, and project task `Tomorrow`, are implemented on
  `feature/routine-schedule-actions`. A separate remove-from-Today action
  remains open. Completed scheduled tasks and routines stay visible on Today
  for the current local day.
- Review Discord reminder interactions after the first plain reminder messages
  work, including message update strategy, retry behavior, quiet/noise rules,
  and whether response buttons are actually useful.
- Review Discord deployment and operations as the web-hosted interaction and
  notification paths grow.
- Add or improve automated tests around existing backend behavior where
  hardening work finds risk.
- Keep the existing web app stable while doing hardening work.
- Review whether the current Memories-page pin/unpin row actions need clearer
  placement, bulk management, or stronger visual hierarchy after more use.
- Review repeated edit actions in project and memory lists and choose a cleaner
  interaction pattern if the current UI feels noisy.
- Govern error notifications across features. Infrastructure failures should
  map to a small shared set of notification types: database connection failed,
  database update failed, parameter missing, parameter invalid, target not
  found, and unknown server internal error. Feature actions should avoid saving
  many near-duplicate notification strings for the same failure class. Keep
  clear field-level or component-level validation messages for user-fixable
  cases such as empty title, invalid date format, or title too long.
- Review broader shared-scroll behavior for pages, dialogs, and popovers where
  overflow is visible to the user.

## Feature Review Discipline

Database and concurrency review should happen during feature development, not
as one large standalone audit. More detail from real feature work should make
data model decisions clearer.

For each feature branch that adds or changes persisted behavior, review:

- current database schema for the affected feature and related shared state
- database constraints, ownership checks, nullable fields, foreign keys,
  delete/archive behavior, unique constraints, date ranges, and indexes
- migration history for the affected tables, including decisions that should be
  kept, simplified, or corrected before more tables are added
- concurrency behavior for lightweight commands, save/edit dialogs, duplicate
  writes, simultaneous dashboard actions, optimistic rollback, and database
  transaction boundaries
- where idempotency keys, request deduplication, or stronger transaction
  boundaries are needed

## Future Product Work

- Money expense recording is implemented on `feature/daily-life-log`, pending
  review. Migration 0037 is applied to the local-development database. Income,
  accounts, debt, budgets, refunds, and charts
  remain deferred. Supplies stock/history and linked travel shopping are also
  implemented, pending review; migration 0038 is applied locally. Expiry tracking, outbound
  reminders, and automatic inventory/expense integration remain deferred.

- Progress / 进步 duration logging is implemented on
  `feature/daily-life-log` (2026-10-07), pending review; migrations 0035–0036 are
  applied locally. As of 2026-10-08, all three tracking pages use compact record
  cards and simplified capture. Progress also has user/day/timezone-scoped browser
  caching with background refresh and mutation updates.
  Work, Study, and Exercise replace occurrence capture; a seven-day chart shows
  daily totals and opens each day's records. Legacy occurrences remain stored.
  Chat history infrastructure is retained, but its frontend is hidden for now.
  Future chat integration should use existing authenticated feature commands,
  with explicit confirmation before destructive or schedule-changing actions.

Future work should be chosen after using the current app and writing more
concrete feature details.

Likely future items:

- Add Ideas web capture and triage controls after the workflow is clearer. The
  current Discord command can already create untriaged Ideas.
- Add daily review as a first-class feature after the expected review workflow
  is clearer.
- Improve project task planning after enough manual project/task usage exists.
- Estimate each task's expected time and add a schedule algorithm, such as
  network flow or an equivalent planner, so the generated Today plan stays
  within available time and does not require overtime.
- Improve dashboard selection rules only after the user workflow feels stable.
- Add stronger settings, including default theme and personal day-boundary time.
- Improve Memories suggestions after the memory data model and dashboard
  behavior are stable.
- Improve Discord reminder actions after routine reminder and Daily Review
  delivery behavior are stable.
- Add optional sharing and deployment hardening when the core private workflow
  is reliable.
- Add backup, sync, and account lifecycle strategy when the data model is more
  stable.
- Improve multilingual support later, especially Chinese coverage and copy
  quality, after the core private workflow and settings model are stable.
- Add OAuth login, password reset, account deletion, and server-side session
  revocation after the private MVP workflow is stable.

## Future Infrastructure

- Keep Neon PostgreSQL as the only implemented infrastructure service for now.
- Consider Redis later as a cache, short-lived coordination store, or queue
  helper only after a concrete performance or reminder-delivery need exists.
  Planned Redis rules are documented in
  [infrastructure/redis.md](infrastructure/redis.md).
- Design event/dataflow infrastructure later; do not reference a concrete event
  bus implementation until there is a real module and document for it.

## Post-v1.0.0 Security Review

- Rotate any database URLs, Neon credentials, auth secrets, API keys, and
  deployment tokens that were pasted into chat, logs, local notes, or other
  non-secret storage during development.
- Confirm production uses explicit secrets such as `AUTH_SESSION_SECRET`
  instead of development fallbacks.
- Review ignored local files, deployment environment variables, Vercel project
  links, and database access settings before treating the release as stable.
