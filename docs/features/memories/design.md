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

The Memories feature should include:

- creating memories
- editing and deleting memories
- creating and editing lightweight categories
- manually refreshing suggested memories on the Memories page
- pinning suggested memories into `Pinned Memories`
- recording ignored suggestion signals when the user refreshes suggestions
- unpinning pinned memories
- marking pinned memories as done
- canceling a mistaken done action before cleanup
- showing pinned cuisine and sightseeing memories on the home dashboard
- opening a memory detail page from suggested memories, pinned memories, the
  Memories page, or any other place a memory appears

The Memories feature should not include:

- automatic background suggestion refresh
- location search or map integration
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

A memory can be completed multiple times. Completion history should be stored as
events, not as an array on the memory row.

A memory should eventually support a detail page with an edit action. The detail
page can show title, description, category, current pin state, done count, and
last done time. Event history should be stored in the database, but the first UI
does not need to show an event-history view.

### Memory Category

A memory category groups related memories and controls how often that category
appears in suggestions.

Default categories:

- Cuisine
- Sightseeing

Cuisine can have a higher default base weight because food-related experiences
can be repeated more often. Sightseeing can have a lower default base weight
because sightseeing places are usually not revisited as frequently.

Later categories can include:

- Anime
- Games
- Books
- Shopping

The first dashboard supports Cuisine and Sightseeing only. Category add and edit
actions belong on the Memories page, not on the dashboard.

### Suggested Memories

Suggested memories are temporary choices generated from the memory library when
the user manually clicks refresh on the Memories page. They are not refreshed
automatically in the background.

The system should recommend a small number of memories per category, usually
three to five items.

The user can:

- pin a suggestion
- manually refresh suggestions
- open the memory detail page

Pin actions should be recorded as events. When the user refreshes suggestions,
currently visible suggestions that were not pinned should be treated as ignored
signals and recorded as `ignored` events for future recommendation improvements.

### Pinned Memories

Pinned memories are memories that the user has explicitly marked as something
they may want to do soon. They are not tasks and should not become overdue.
Pinned memories are closer to a soft shortlist or temporary favorites list.

The dashboard should use the title `Pinned Memories`.

The dashboard's primary responsibility is to show the user's pinned memories.
The first dashboard only supports default dashboard categories:

- Cuisine
- Sightseeing

Custom categories can exist in the Memories page, but they should not appear in
the dashboard pinned-memory list until dashboard support for more categories is
explicitly designed.

The user can:

- mark a pinned memory as done
- cancel done if it was a misclick
- replace a pinned memory with another memory from the same category
- unpin a memory

Pinned memory dashboard rows do not expand or collapse in the current UI.

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

- have not been done for a long time
- have never been done after creation
- have been done or pinned multiple times historically
- belong to a category with a higher base weight

The score should not be too aggressive. A frequently done memory should be more
likely to appear, but it should not dominate every refresh forever.

Suggested first scoring model:

```text
days_score = log(1 + days_since_last_done)
count_score = 1 + log(1 + done_count)

score = category_base_weight * days_score * count_score
```

For a new memory that has never been done:

```text
days_score = log(1 + days_since_created)
count_score = 3
```

Use weighted random selection instead of always taking the highest-scoring
items.

Rules:

- Suggestions should appear on the Memories page, not directly on the
  dashboard.
- Suggestions refresh only when the user clicks refresh.
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

Dashboard behavior:

- The first dashboard should show up to 3 Cuisine memories and up to 3
  Sightseeing memories.
- The first dashboard should not show pinned memories from custom categories.
- The first dashboard should not support adding or editing memory categories.
- Pinned memory order should remain stable across refreshes and dashboard loads.
- Marking a pinned memory as done records a `completed` event, updates memory
  summary fields, sets `completed_at`, and sets `completed_cleanup_at` to about
  2 hours later.
- If done was a misclick, the user can cancel done before cleanup.
- On dashboard load, completed pinned records whose cleanup time has passed
  should be deleted and replaced with another memory if one is available.
- On dashboard load, active pinned records whose `visible_until` time has passed
  should also be deleted and replaced with another memory from the same category
  if one is available.
- Cleanup and expiry should run before the dashboard response is returned so the
  user sees the final active pinned-memory list after reload.
- Cleanup and expiry replacement must preserve category limits. The final
  dashboard list should still contain at most 3 Cuisine memories and at most 3
  Sightseeing memories.
- Replacing a pinned memory selects a new memory from the same category and
  position. The replacement should not already be showing and should not already
  be completed.
- The replacement should update only the clicked row position.

Visibility timing:

- When a pinned memory appears, set `visible_until` to a random duration after
  `last_shown_at`.
- Allowed durations are 24, 30, 36, 42, and 48 hours.
- Replacing a pinned memory should refresh `visible_until`.
- Completing a pinned memory should set `completed_cleanup_at`.
- Visibility timing is separate from the 2-hour completed cleanup timing.

## UI

Memory UI behavior is documented in [ui.md](ui.md). Keep this
file focused on product rules and data behavior.
