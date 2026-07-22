# Memories

This document defines the Memories feature for Arctic Aria. Memory persistence,
backend validation, and database constraints are documented in
[data-model.md](data-model.md).

Memories are repeatable personal experiences that the user considers worth
revisiting. They are not tasks, routines, or long-term dreams. A memory can be a
restaurant, cafe, park, museum, anime, game, book, shop, or other experience
that the user may want to enjoy again.

The goal is to help the user rediscover good experiences from their own life,
especially when they do not know what they want to do today.
Leisure planning and entertainment recommendation ideas belong here as future
Memories suggestion behavior, not as a separate roadmap.

Memories are soft candidates for enjoyment, revisiting, and casual planning.
They are not commitments. Not doing a memory today should not create overdue
pressure and should not automatically carry it forward like a task.

## Boundary

Memories are Core product data because the user directly creates, manages, pins,
completes, and deletes them.

Memories are different from aspirations. Large future goals such as traveling to
Kyoto or seeing the aurora should belong to a separate aspirations or dreams
feature because they need planning, budgeting, milestones, and long-term review.

## Scope

The implemented Memories feature includes:

- creating memories
- editing and deleting memories
- creating, editing, and deleting lightweight custom categories
- manually refreshing suggested memories on the Memories page
- pinning suggested memories into `Pinned Memories`
- recording ignored suggestion signals when the user refreshes suggestions
- pinning and unpinning memories from the Memories page
- unpinning pinned memories from Today
- marking pinned memories as experienced
- canceling a mistaken experience action before cleanup
- showing pinned memories from any category on Today

The Memories feature should not include:

- automatic background suggestion refresh
- location search or map integration
- a memory detail page
- recommendations for places the user has never saved
- aspirations or dreams
- vector search

## Core Concepts

### Memory

A memory is an item in the user's personal experience library.

Examples:

- handmade Shin Ramyun
- a restaurant the user liked
- a cafe worth revisiting
- a park
- an anime worth continuing or rewatching

A memory can be experienced multiple times. Experience history should be stored
as events, not as an array on the memory row.

The current UI edits memories through modal dialogs from the Memories page.
There is no separate memory detail page. Event history is stored in the
database, but the first UI does not show an event-history view.

### Memory Category

A memory category groups related memories and provides filtering, icons, and
default localized labels for built-in experience types.

Built-in default categories:

- Cuisine
- Sightseeing
- Movie
- Anime
- Book
- Music
- Game
- Shopping

Built-in categories should have:

- a stable built-in key, such as `cuisine` or `sightseeing`
- a fixed default icon
- default translations in every supported language

The name, icon, and built-in identity of default categories should not be
editable or deletable by the user. The current implementation creates real
per-user category rows in the database, and this should remain the simple model
for now because each memory needs a concrete `category_id`. Later migration or
initialization code can backfill missing built-in category rows for existing
users.

User-created categories should allow:

- a user-authored name in any language
- an optional user-authored description
- one icon selected from a small memory icon set, roughly 12 choices

User-created category names are not automatically translated in the current
product direction. They should display exactly as the user entered them. This
avoids inconsistent UI where built-in categories are translated but custom
category names are machine-translated unexpectedly.

Built-in categories can have default translations and icons. They are still
normal per-user categories in storage so memories can reference them
consistently.

Today can show pinned memories from any category. Category add and edit actions
belong on the Memories page, not on Today.

### Suggested Memories

Suggested memories are temporary choices generated from the memory library.

The system recommends a small number of memories from the memory library. The
current web implementation asks for four suggestions.

When the user opens the Memories page, the UI may load the most recent
suggestion page from a browser cache, backend cache, or database-backed cache.
Normal page view should not record ignored suggestion events and should not
insert new suggestion-history rows.

The user can:

- pin a suggestion
- manually refresh suggestions

Pin actions should be recorded as events. When the user manually refreshes
suggestions or explicitly passes a suggestion, currently visible suggestions
that were not pinned should be treated as ignored signals and recorded as
`ignored` events for future recommendation improvements.

### Pinned Memories

Pinned memories are memories that the user has explicitly marked as something
they may want to do soon. They are not tasks and should not become overdue.
Pinned memories are closer to a soft shortlist or temporary favorites list.

The Today page should use the title `Pinned Memories`.

Today's primary responsibility is to show the user's pinned memories. Pinned
memories from custom categories can appear on Today. Do not filter pinned
memories by display name, built-in key, dashboard metadata, or per-category
count.

The user can:

- mark a pinned memory as experienced
- cancel an experience mark if it was a misclick
- unpin a memory

Pinned memory Today rows do not expand or collapse in the current UI.
Today should not expose a single-row refresh or replace button for pinned
memories. Detailed pin and unpin management belongs on the Memories page.

### Optional Later Tables

The first version can generate suggestions on demand and record only pin,
refresh-derived ignore, complete, cancel, replace, and delete events. If the
suggestion screen later needs exact replay or analytics, add:

- `memory_suggestion_runs`
- `memory_suggestion_items`

Do not add these tables until the UI or algorithm needs them.

## Suggestion Behavior

The first implementation should use a simple weighted random model.

The score should prefer memories that:

- have not been experienced for a long time
- have never been experienced after creation
- have been experienced or pinned multiple times historically

The score should not be too aggressive. A frequently experienced memory should
be more likely to appear, but it should not dominate every refresh forever.

Suggested first scoring model:

```text
days_score = log(1 + days_since_last_experienced)
count_score = 1 + log(1 + experience_count)

score = days_score * count_score
```

For a new memory that has never been experienced:

```text
days_score = log(1 + days_since_created)
count_score = 3
```

Use weighted random selection instead of always taking the highest-scoring
items.

Rules:

- Suggestions should appear on the Memories page, not directly on Today.
- Opening the Memories page may load a cached suggestion page without recording
  ignored events.
- Suggestions refresh with ignored-event recording only when the user clicks
  refresh or explicitly passes a suggestion.
- The first web implementation can show suggestions in a right-side panel on
  the Memories page instead of a separate suggestion page.
- Pinning a suggestion changes pin state but does not refresh the whole
  suggestion list automatically.
- There is no explicit ignore button in the first UI.
- When the user clicks refresh, memories that are currently visible as
  suggestions and have not been pinned should be counted as ignored suggestion
  signals.
- Ignoring a suggestion signal records an event but does not delete the memory.
- Already showing pinned memories should not appear again in suggestions.
- Ignored memories may reappear in later refreshes, but recent ignores should
  reduce priority when possible.

## Pinned Memory Behavior

Pinned memories do not need the normal suggestion score. Pinning is already a
strong manual signal.

Today behavior:

- Today should show pinned memories from any category.
- Today should not apply a per-category count limit.
- Today should not support adding or editing memory categories.
- Pinned memory order should remain stable across refreshes and Today loads.
- Marking a pinned memory as experienced records an internal `completed` event,
  updates memory summary fields, sets `completed_at`, and sets
  `completed_cleanup_at` to about 2 hours later.
- If the experience mark was a misclick, the user can cancel it before cleanup.
- The current visible Today UI does not expose cleanup or expiry metadata.
- Automatic cleanup and replacement of expired or completed pins is not
  performed during the current Today list load path.

Visibility timing:

- When a pinned memory appears, set `visible_until` to a random duration after
  `last_shown_at`.
- Allowed durations are 24, 30, 36, 42, and 48 hours.
- Marking a pinned memory as experienced should set `completed_cleanup_at`.
- Visibility timing is separate from the 2-hour experience cleanup timing.

## UI

Memory UI behavior is documented in [ui.md](ui.md). Keep this
file focused on product rules and data behavior.
