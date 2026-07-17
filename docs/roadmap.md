# Roadmap

This roadmap records what should happen next and what should remain future
work. It is no longer organized as numbered phases.

## Current Baseline

Current released version: `v0.5.1`.

The web dashboard baseline in the latest release is mostly complete for the
current prototype:

- auth, sessions, and sign out
- dashboard app shell and sidebar
- project list and project detail pages
- project tasks on the dashboard
- routines page and dashboard routine panel
- memories page, categories, suggestions, and pinned memories
- shared web UI components and consistent list/card/dialog/form patterns
- Neon PostgreSQL migrations and migration checksum tracking
- app/database version metadata

Current unreleased `develop` work also includes the first Discord prototype:

- Discord HTTP Interactions app under `apps/discord-bot`
- user-facing Discord binding from Settings through `/bind code:<code>`
- Discord `/idea text:<raw text>` capture into untriaged Ideas
- internal outbound Discord message API
- Settings -> Discord -> `Send Test` for manual message-push verification

## Next: v0.6.0

Goal: harden the current prototype and prepare the next feature cycle without
turning one release into a broad schema audit.

No large new user-facing feature development is planned for `v0.6.0`. Bug
fixes, documentation, tests, Redis/cache design, Discord bot hardening, and
small UI consistency work are in scope.

Planned v0.6.0 work:

- Design Redis usage without implementing it prematurely. Redis should support
  latency reduction, short-lived coordination, rate limiting, idempotency, or
  queue-like behavior only when the database remains the source of truth.
- Review the implemented Discord bot prototype, including account binding,
  `/idea` quick capture, outbound message push, local ngrok runbook, command
  registration and reinstall steps, secrets, failure messages, and deployment
  direction.
- Design future Discord reminder behavior without implementing it yet,
  including reminder messages, button interactions, message update strategy,
  daily review prompts, retry behavior, and quiet/noise rules.
- Update architecture, database, Redis, Discord bot, and feature data-model
  docs to reflect the review decisions.
- Add or improve automated tests around existing backend behavior where the
  hardening work finds risk.
- Keep the existing web prototype stable while doing this hardening work.
- Fix deferred UI consistency bugs that are intentionally excluded from the
  `v0.5.1` hotfix, including Memories-page pinned/unpinned management and
  removing the dashboard pinned-memory single-item replace/refresh action.
- Review dashboard memory category scope. The current dashboard only supports
  Cuisine and Sightseeing; v0.6.0 should decide whether dashboard categories
  become user-configurable or default to all eligible memory categories.
  Memory categories can keep defaults such as Cuisine and Sightseeing, but the
  dashboard should not rely on hard-coded category names long term.
- Review category UI affordances and choose distinct icons where useful instead
  of relying only on text labels.
- Review repeated edit actions in project and memory lists. There may be too
  many visible `Edit` buttons, so v0.6.0 should consider a cleaner interaction
  pattern.

## Ongoing Feature Review

Database and concurrency review should happen during later feature development,
not as one large standalone version. More detail from real feature work should
make the data model decisions clearer.

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

The remaining v0.6.0 work should not include:

- web add/edit/triage controls for Ideas
- daily review implementation
- automatic project scheduling
- AI-generated task recommendations
- memory suggestion logic beyond the current manual refresh prototype
- Discord reminder implementation
- sharing cards

## Future Work

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
- Improve memory suggestion logic after the memory data model and dashboard
  behavior are stable.
- Add Discord reminders after routine and daily review behavior are stable.
- Add optional sharing and deployment hardening when the core private workflow
  is reliable.
- Add backup, sync, and account lifecycle strategy when the data model is more
  stable.
- Add multilingual support later, especially Chinese, after the core private
  workflow and settings model are stable.

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
