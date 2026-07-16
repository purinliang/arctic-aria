# Roadmap

This roadmap records what should happen next and what should remain future
work. It is no longer organized as numbered phases.

## Current Baseline

Current released version: `v0.5.0`.

The web dashboard baseline is mostly complete for the current prototype:

- auth, sessions, and sign out
- dashboard app shell and sidebar
- project list and project detail pages
- project tasks on the dashboard
- routines page and dashboard routine panel
- memories page, categories, suggestions, and pinned memories
- shared web UI components and consistent list/card/dialog/form patterns
- Neon PostgreSQL migrations and migration checksum tracking
- app/database version metadata

## Next: v0.6.0

Goal: review and stabilize the technical foundation before adding more product
features.

No new user-facing feature development is planned for `v0.6.0`. Bug fixes,
documentation, tests, database review, concurrency review, Redis/cache design,
and Discord bot design are in scope.

Planned v0.6.0 work:

- Review the current database schema for auth, projects, routines, memories,
  pinned dashboard state, migration metadata, and version metadata.
- Review database constraints, ownership checks, nullable fields, foreign keys,
  delete/archive behavior, unique constraints, date ranges, and indexes.
- Review migration history and confirm which design decisions should be kept,
  simplified, or corrected before more tables are added.
- Review concurrency behavior for lightweight commands, save/edit dialogs,
  duplicate writes, simultaneous dashboard actions, optimistic rollback, and
  database transaction boundaries.
- Decide where idempotency keys, request deduplication, or stronger transaction
  boundaries are needed.
- Design Redis usage without implementing it prematurely. Redis should support
  latency reduction, short-lived coordination, rate limiting, idempotency, or
  queue-like behavior only when the database remains the source of truth.
- Review Discord bot architecture before implementation, including account
  linking, quick capture, reminder messages, button interactions, message
  update strategy, daily review prompts, and failure behavior.
- Update architecture, database, Redis, Discord bot, and feature data-model
  docs to reflect the review decisions.
- Add or improve automated tests around existing backend behavior where the
  review finds risk.
- Keep the existing web prototype stable while doing this review.

The v0.6.0 work should not include:

- idea capture implementation
- daily review implementation
- automatic project scheduling
- AI-generated task recommendations
- memory suggestion logic beyond the current manual refresh prototype
- reward logic
- English coach logic
- Discord bot implementation
- sharing cards

## Future Work

Future work should be chosen after using the v0.6.0 prototype.

Likely future items:

- Add idea capture as a first-class lightweight feature after the v0.6.0
  technical review.
- Add daily review as a first-class feature after the v0.6.0 technical review.
- Improve project task planning after enough manual project/task usage exists.
- Improve dashboard selection rules only after the user workflow feels stable.
- Add stronger settings, including default theme and personal day-boundary time.
- Improve memory suggestion logic after the memory data model and dashboard
  behavior are stable.
- Add Discord quick capture when the web idea-capture flow is proven useful.
- Add Discord reminders after routine and daily review behavior are stable.
- Add optional sharing and deployment hardening when the core private workflow
  is reliable.
- Add backup, sync, and account lifecycle strategy when the data model is more
  stable.

## Removed From Active Roadmap

The old reward-plugin and English-coach roadmap phases are removed from the
active plan. Do not restore them as numbered phases.

If either idea becomes useful later, write a new feature or plugin proposal from
the current product shape instead of reusing the old phase plan.

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
