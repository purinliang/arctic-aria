# Memories

This document defines the Memories feature for Arctic Aria.

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
and completes them.

Memories are different from plugin memory:

- Memories are user-visible experiences such as restaurants, parks, shows, or
  books.
- Plugin memory is internal context used by plugins or agents, such as learning
  history, conversation summaries, retrieval context, or raw agent output.

Memories are also different from aspirations. Large future goals such as
traveling to Kyoto or seeing the aurora should belong to a separate aspirations
or dreams feature because they need planning, budgeting, milestones, and
long-term review.

## Scope

The first Memories feature should include:

- creating memories
- editing and archiving memories
- creating and editing lightweight categories
- manually refreshing suggested memories
- pinning suggested memories into `Pinned Memories`
- ignoring suggested memories
- unpinning pinned memories
- marking pinned memories as done
- showing pinned cuisine and sightseeing memories on the home dashboard
- opening a memory detail page from suggestions, pinned memories, or the
  Memories page

The first Memories feature should not include:

- automatic background suggestion refresh
- location search or map integration
- recommendations for places the user has never saved
- aspirations or dreams
- plugin-generated memory extraction from chat history
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

A memory should support a detail page with an edit action. The detail page can
show title, description, category, current pin state, done count, last done
time, and event history.

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

Only categories marked for the dashboard should appear on the home dashboard.
The first dashboard should show only Cuisine and Sightseeing.

### Suggested Memories

Suggested memories are temporary choices generated from the memory library when
the user manually clicks refresh. They are not refreshed automatically in the
background.

The system should recommend a small number of memories per category, usually
three to five items.

The user can:

- pin a suggestion
- ignore a suggestion
- manually refresh suggestions
- open the memory detail page

Pin and ignore actions should be recorded as events for future recommendation
improvements.

### Pinned Memories

Pinned memories are memories that the user has explicitly marked as something
they may want to do soon. They are not tasks and should not become overdue.
Pinned memories are closer to a soft shortlist or temporary favorites list.

The dashboard should use the title `Pinned Memories`.

Pinned memories should remain visible gently for a few days. They should not
disappear quickly just because the user does not complete them immediately.

The user can:

- open the memory detail page
- mark a pinned memory as done
- replace a pinned memory with another suggestion
- unpin a memory

## Suggested Table Design

Use normalized relational tables for the first implementation. Avoid storing
timestamp lists on the `memories` row because arrays are harder to query,
constrain, paginate, and update safely.

### `memory_categories`

Stores user-owned categories and dashboard behavior.

Recommended fields:

- `id`
- `user_id`
- `name`
- `icon`
- `base_weight`
- `dashboard_enabled`
- `dashboard_limit`
- `sort_order`
- `created_at`
- `updated_at`
- `archived_at`

Constraints:

- `user_id` references `users.id`.
- `name` should be unique per active user category.
- `base_weight` should be greater than `0`.
- `dashboard_limit` should be between `1` and `5`.

Suggested defaults:

- Cuisine: `base_weight = 1.2`, `dashboard_enabled = true`,
  `dashboard_limit = 3`
- Sightseeing: `base_weight = 0.8`, `dashboard_enabled = true`,
  `dashboard_limit = 3`

### `memories`

Stores the canonical memory record.

Recommended fields:

- `id`
- `user_id`
- `category_id`
- `title`
- `description`
- `status`
- `last_done_at`
- `done_count`
- `last_pinned_at`
- `last_ignored_at`
- `metadata`
- `created_at`
- `updated_at`
- `archived_at`

Field notes:

- `status` should start with `active` and `archived`.
- Delete actions in the first implementation should archive the memory instead
  of physically deleting it, so history remains intact.
- `metadata` can be `jsonb` for lightweight optional details that are not stable
  enough for first-class columns yet.
- `done_count`, `last_done_at`, `last_pinned_at`, and `last_ignored_at` are
  denormalized summary fields. The source of truth for history is
  `memory_events`.

Constraints:

- `user_id` references `users.id`.
- `category_id` references `memory_categories.id`.
- `title` is required.
- `done_count` should be greater than or equal to `0`.

### `memory_events`

Stores immutable history for recommendation signals and audits.

Recommended fields:

- `id`
- `user_id`
- `memory_id`
- `event_type`
- `occurred_at`
- `source`
- `context`

Allowed first event types:

- `pinned`
- `unpinned`
- `ignored`
- `completed`
- `replaced`

Field notes:

- `source` can be `web`, `discord`, `agent`, or `system`.
- `context` can be `jsonb` for details such as category id, suggestion score,
  previous pinned id, or replacement reason.

### `pinned_memories`

Stores the current soft shortlist shown on the dashboard.

Recommended fields:

- `id`
- `user_id`
- `memory_id`
- `category_id`
- `position`
- `status`
- `pinned_at`
- `expires_at`
- `completed_at`
- `removed_at`
- `created_at`
- `updated_at`

Allowed first statuses:

- `active`
- `completed`
- `unpinned`
- `replaced`
- `expired`

Field notes:

- `category_id` is denormalized from the memory category so category dashboard
  queries stay simple.
- `position` preserves dashboard order.
- `expires_at` should normally be seven days after `pinned_at`.
- A completed pinned memory can remain visible until the next dashboard load or
  until the user replaces it manually.

Constraints:

- `user_id` references `users.id`.
- `memory_id` references `memories.id`.
- `category_id` references `memory_categories.id`.
- There should be at most one active pin for the same `memory_id`.
- Active pins should be queryable by user, category, status, and position.

### Optional Later Tables

The first version can generate suggestions on demand and record only pin,
ignore, complete, and replace events. If the suggestion screen later needs exact
replay or analytics, add:

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

- Suggestions refresh only when the user clicks refresh.
- Pinning a suggestion changes pin state but does not refresh the whole
  suggestion list automatically.
- Ignoring a suggestion records an event but does not delete the memory.
- Already active pinned memories should not appear again in suggestions.

## Pinned Memory Behavior

Pinned memories do not need the normal suggestion score. Pinning is already a
strong manual signal.

Dashboard behavior:

- Each dashboard-enabled category should show up to its `dashboard_limit`.
- The first dashboard should show only Cuisine and Sightseeing.
- Pinned memory order should remain stable across refreshes and dashboard loads.
- Marking a pinned memory as done records a `completed` event, updates memory
  summary fields, and marks the pin as `completed`.
- Replacing a pinned memory marks the old pin as `replaced` and selects a new
  memory for the same category and position.
- Expired pins should be removed from active display on dashboard load.

Default pin duration:

```text
expires_at = pinned_at + 7 days
```

If a pinned memory is completed, it can remain in place until the user replaces
it manually or until the next dashboard load fills that slot.

## Dashboard

The home dashboard should show a compact `Pinned Memories` section.

For each pinned memory, show:

- title
- short description
- category
- done button
- replace button
- link or click target for the detail page

When a memory is focused or hovered, show icon buttons for done and replace. If
the user clicks done, keep focus and show the completed state. If the user
clicks replace, replace only that one item and keep other positions unchanged.

On dashboard load:

- hide completed, expired, unpinned, or replaced pins
- fill empty dashboard slots up to the category limit
- preserve the order of still-active pins

## Memories Page

The Memories page is the full management page for this feature.

It should allow the user to:

- view all memories
- filter by category
- open a memory detail page
- add a memory
- edit or archive a memory
- manage categories in a lightweight dialog
- open the suggestion page

The Memories page can be opened from the hamburger menu.
