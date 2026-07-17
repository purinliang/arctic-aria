# Roadmap

This roadmap records what should happen next and what should remain future
work. It is no longer organized as numbered phases.

## Current Baseline

Current released version: `v0.5.1`.
Current development target: `v0.6.0`.

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

Current unreleased `develop` work includes the first Discord prototype:

- Discord HTTP Interactions app under `apps/discord-bot`
- user-facing Discord binding from Settings through `/bind code:<code>`
- Discord `/idea text:<raw text>` capture into untriaged Ideas
- internal outbound Discord message API
- Settings -> Discord -> `Send Test` for manual message-push verification

Current unreleased `develop` work also includes web and data-model polish:

- built-in memory categories for Cuisine, Sightseeing, Movie, Anime, Book,
  Music, Game, and Shopping, with fixed icons, localized built-in display text,
  and backfill for existing accounts
- shared localized brand logo text: `ArcticAria` in English and `北极阿莉雅` in
  Simplified Chinese
- hidden future auth actions for Google sign-in and forgot-password/reset, kept
  behind a disabled flag until the real flows exist
- collapsed database-version metadata in login and Settings/About, still
  inspectable through browser developer tools
- Settings `About` card for visible app-version information

## Next: v0.6.0

Goal: harden the current prototype and prepare the next feature cycle without
turning one release into a broad schema audit.

For the remaining `v0.6.0` work, do not start another large user-facing feature
until hardening and documentation catch up. Bug fixes, documentation, tests,
Redis/cache design, Discord bot hardening, and small UI consistency work are in
scope.

Remaining v0.6.0 work:

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
- Review category UI affordances and choose distinct icons where useful instead
  of relying only on text labels.
- Review repeated edit actions in project and memory lists. There may be too
  many visible `Edit` buttons, so v0.6.0 should consider a cleaner interaction
  pattern.

### Memory Category Direction

Status: mostly implemented on `develop`.

The current built-in set is Cuisine, Sightseeing, Movie, Anime, Book, Music,
Game, and Shopping.

Implemented direction:

- Keep real per-user `memory_categories` rows. This is the simplest model
  because every memory still needs a concrete `category_id`.
- Use stable built-in category metadata, including a built-in key and icon
  name. The existing `shown_on_dashboard` column can remain as legacy metadata
  until a later schema cleanup, but dashboard pinned memories should not be
  filtered by it.
- Backfill built-in category rows for existing users through migrations.
  Backfill should apply to all existing users, not a hard-coded developer
  account.
- Treat Cuisine, Sightseeing, Movie, Anime, Book, Music, Game, and Shopping as
  built-in categories. Their built-in identity, default name, description, icon,
  and default translations should not be editable or deletable by the user.
- Stop filtering dashboard pinned memories by hard-coded display names,
  built-in keys, dashboard metadata, or per-category count limits.

Current built-in category/template state:

- Current built-in templates include Movie (`film`), Anime (`wand-sparkles`),
  Book (`book-open-text`), Music (`music`), Game (`gamepad-2`), and Shopping
  (`shopping-cart`).
- Built-in templates have default icons and default translations in every
  supported language.
- Built-in templates are normal per-user category rows with stable built-in
  metadata.
- Existing accounts receive built-in category rows through migrations, and
  the default-category initialization path remains a safety net for future users
  and partially initialized accounts.
- User-created categories should allow names in any language and a selected
  icon from a small memory icon set, roughly 12 choices.
- User-created category names should display exactly as written. Do not
  auto-translate user-created category names unless a later feature explicitly
  designs per-category translations.

Remaining category UI cleanup:

- The memory category `All` filter should have its own neutral icon.
- Single-choice and multi-choice groups can use normal button height when they
  behave like filter/action buttons. Use input height only when they replace a
  form input.
- Choice groups should not show a check icon; selected color and border are
  enough.
- The Memories page can load cached suggestion pages when opened, but a normal
  view should not insert suggestion-history rows or record ignore events.
- Suggestion ignore events should be recorded only when the user explicitly
  refreshes or passes a suggestion.
- The dashboard `Pinned Memories` panel should not expose a single-row refresh
  action. Detailed pin/unpin management belongs on the Memories page.

### Version Metadata UI

Status: implemented on `develop`; future admin/debug display remains undecided.

The login page and Settings page should keep database-version metadata available
for debugging without showing it in normal use. For normal signed-out and
normal signed-in users, the database-version line should be visually gone or
collapsed, not removed from the rendered page entirely. It should remain
inspectable through browser developer tools when the developer needs to debug
deployment or migration state.

Do not add developer-account-specific display rules for version metadata.
Production behavior should be role- or environment-based only after a real
admin/user-role design exists.

The version-metadata check should also explain ahead/behind states clearly. If
production says the database is `ahead`, inspect whether the deployed app,
expected schema hash, migration history, or database metadata is older/newer
than expected before changing the display text.

## Sidebar Refinement

Status: in progress on `develop`; several sidebar behavior rules are specified
but not fully finished. Remaining sidebar bugs should be handled as focused UI
fix branches.

Established sidebar direction:

- The sidebar uses a compact brand block: first row Sparkles icon plus small
  localized brand text, then a larger page/workspace label such as `Workspace`
  in the normal app font. In English the brand text is `ArcticAria` without a
  space; in Simplified Chinese it is `北极阿莉雅`.
- The workspace label should remain visually larger than the brand text, and
  short translations such as `工作区` can render larger than the English label.

Remaining sidebar cleanup:

- Make the light-mode and sign-out rows visually follow the same menu-item
  pattern as the preceding sidebar navigation items. Do not place them in a
  separate visual container or give them a different row style unless the
  sidebar design is revised explicitly.
- Keep the mobile sidebar close button borderless.
- Finish pinned project shortcut alignment with invisible icon spacers while
  preserving the indented hierarchy. The spacer icons should use the same size
  and gap as visible menu icons. Pinned project names should stay on one line
  and truncate automatically.
- Sidebar list items should handle rounded corners consistently, especially at
  the start and end of adjacent item groups.
- Adjacent sidebar menu items should not show unwanted gaps between rows,
  including hover and active states.
- Separator lines should be reviewed and removed where they make item groups
  feel visually broken.
- Sidebar menu-item spacing, active state, and hover details should be refined
  as a separate sidebar polish task.

## Auth UI Cleanup

Status: implemented on `develop`; real Google OAuth and password reset remain
future auth features.

Placeholder auth actions should stay hidden until they work end to end. Hide the
Google OAuth action, its `or` separator, and the forgot-password/reset action
until those flows are implemented.

The code may keep hidden future-action UI behind an explicit disabled flag so
the existing Google/reset placeholder work can be reused later without showing
non-working controls to users.

Auth page spacing is now documented in [auth/ui.md](features/auth/ui.md). Keep
the registration panel inside the auth page's `110vh` minimum height, with
enough top and bottom space for scrolling.

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
- Improve multilingual support later, especially Chinese coverage and copy
  quality, after the core private workflow and settings model are stable.

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
