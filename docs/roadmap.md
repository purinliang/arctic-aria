# Roadmap

This roadmap records future work. It should not repeat released implementation
details; released behavior belongs in `docs/releases/` and stable rules belong
in the owning feature, web, or infrastructure docs.

Current released version: `v0.10.1`.

## v0.11.0 Current Work

v0.11.0 makes Discord push messages the foundation for routine reminders and
Daily Review.

Implemented direction:

- Extract the current Settings `Send Test` behavior into a shared server-side
   Discord notification pipeline. Keep delivery inside the web app, reuse the
   existing Discord HTTP sender, and keep `discord_message_deliveries` as the
   delivery audit and idempotency record.
- Add automatic routine reminder sending through the shared Discord
   notification pipeline. The first reminder text should be concise and should
   not introduce Discord response buttons.
- Add Daily Review Discord messages generated from Today page items. The first
  version produces short plain text covering done and undone project tasks,
  done and undone routines, and pinned memories. Do not add a separate review
  table; the Discord delivery record is enough for now.
- Use the Cloudflare cron worker in `apps/cron` to invoke
  `/api/cron/discord-notifications` for both routine reminders and Daily
  Review.

v0.11.0 interaction hardening:

- Keep the auth and settings interaction race guards covered by tests:
  reject sign-out clicks for 5 seconds immediately after login/session creation
  with an operation-too-frequent notification, reject repeated changes to the
  same preference within 2 seconds with the same notification while allowing
  different preferences to change independently, merge preference saves against
  the latest optimistic local snapshot, and keep fresh browser preference cache
  from being overwritten by stale backend preference loads.

v0.11.0 should not require Redis or a separate event bus. Redis can remain a
future option for performance, idempotency, rate limiting, queue-like behavior,
or reminder coordination only after a concrete need appears.

## Next Work After v0.11.0

- Design v0.12.0 task and routine scheduling. Routine instances already exist
  and should remain the first stable schedule primitive. Project tasks do not
  yet have a durable daily schedule assignment; Today currently selects open
  tasks from project data. v0.12.0 should decide whether to add task schedule
  rows or daily task instances so a task chosen for Today remains visible on
  the Today board after completion until the personal day/review cleanup.
- Review Today schedule visibility for routines and project tasks together:
  scheduled-for-today items should not disappear only because they were marked
  done, while future selection logic should avoid showing every completed
  project task forever.
- Review Discord reminder interactions after the first plain reminder messages
  work, including message update strategy, retry behavior, quiet/noise rules,
  and whether response buttons are actually useful.
- Review Discord deployment and operations as the web-hosted interaction and
  notification paths grow.
- Add or improve automated tests around existing backend behavior where
  hardening work finds risk.
- Keep the existing web prototype stable while doing hardening work.
- Improve memory pin/unpin management inside Memories instead of managing
  single pinned-memory replacement from Today.
- Refine memory category management: separate built-in default categories from
  user-created custom categories, keep the dialog padding consistent with other
  add/edit dialogs, and place the `New` category action inside the custom
  categories section.
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
