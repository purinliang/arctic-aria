# Roadmap

This roadmap records future work. It should not repeat released implementation
details; released behavior belongs in `docs/releases/` and stable rules belong
in the owning feature, web, or infrastructure docs.

Current released version: `v0.7.1`.

## Next Work

The next work should harden the current prototype before another large
user-facing feature starts.

- Review Redis usage without implementing it prematurely. Redis should support
  latency reduction, short-lived coordination, rate limiting, idempotency, or
  queue-like behavior only when the database remains the source of truth.
- Review Discord reminder behavior before implementation, including reminder
  messages, button interactions, message update strategy, daily review prompts,
  retry behavior, and quiet/noise rules.
- Review Discord deployment and operations now that Discord interactions are
  hosted by the web app.
- Add or improve automated tests around existing backend behavior where
  hardening work finds risk.
- Keep the existing web prototype stable while doing hardening work.
- Improve memory pin/unpin management inside Memories instead of managing
  single pinned-memory replacement from Today.
- Review repeated edit actions in project and memory lists and choose a cleaner
  interaction pattern if the current UI feels noisy.
- Extract the custom sidebar scrollbar behavior into a shared configurable web
  scrollbar utility or component. Sidebar usage should auto-hide the scrollbar;
  dropdown/list/dialog/page usage can keep the scrollbar visible when that is
  clearer. Naming is open and should be chosen after inspecting the current UI
  code.
- Review whether pages and dialogs should use the shared scrollbar behavior
  where overflow is visible to the user.
- Review the global `110vh` minimum-height behavior on mobile. Mobile browsers
  do not reserve desktop scrollbar width in the same way, so mobile pages may
  not need the forced extra height.

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

Future work should be chosen after using the current prototype and writing more
concrete feature details.

Likely future items:

- Add Ideas web capture and triage controls after the workflow is clearer. The
  current Discord command can already create untriaged Ideas.
- Add daily review as a first-class feature after the expected review workflow
  is clearer.
- Improve project task planning after enough manual project/task usage exists.
- Improve dashboard selection rules only after the user workflow feels stable.
- Add stronger settings, including default theme and personal day-boundary time.
- Improve Memories suggestions after the memory data model and dashboard
  behavior are stable.
- Add Discord reminders after routine and daily review behavior are stable.
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
