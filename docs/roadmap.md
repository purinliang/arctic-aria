# Roadmap

This roadmap records future work. It should not repeat released implementation
details; released behavior belongs in `docs/releases/` and stable rules belong
in the owning feature, web, or infrastructure docs.

Current released version: `v0.15.1`.

Current development version on `develop`: `v0.16.0-dev`.

## Development-Only Tracking

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

## Next Work After v0.12.0

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
