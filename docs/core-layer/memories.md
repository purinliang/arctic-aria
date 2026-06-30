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
- ignoring suggested memories
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

A memory should support a detail page with an edit action. The detail page can
show title, description, category, current pin state, done count, last done time,
and event history.

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

The user can:

- expand and collapse a pinned memory
- open the memory detail page
- mark a pinned memory as done
- cancel done if it was a misclick
- replace a pinned memory with another memory from the same category
- unpin a memory

## Suggested Table Design

Use normalized relational tables for the first implementation. Avoid storing
timestamp lists on the `memories` row because arrays are harder to query,
constrain, paginate, and update safely.

### `memory_categories`

Stores user-owned categories and suggestion weights.

Recommended fields:

- `id`
- `user_id`
- `name`
- `base_weight`
- `created_at`
- `updated_at`

Constraints:

- `user_id` references `users.id`.
- `name` should be unique per user.
- `base_weight` should be greater than `0`.

Suggested defaults:

- Cuisine: `base_weight = 1.2`
- Sightseeing: `base_weight = 0.8`

### `memories`

Stores the canonical memory record.

Recommended fields:

- `id`
- `user_id`
- `category_id`
- `title`
- `description`
- `last_done_at`
- `done_count`
- `last_pinned_at`
- `last_ignored_at`
- `created_at`
- `updated_at`

Field notes:

- Delete actions should physically delete the memory.
- Deleting a memory should also remove its current pinned record and related
  memory events.
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

Allowed first event types:

- `pinned`
- `unpinned`
- `ignored`
- `completed`
- `completed_canceled`
- `replaced`
- `deleted`

### `pinned_memories`

Stores the current soft shortlist shown on the dashboard.

Recommended fields:

- `id`
- `user_id`
- `memory_id`
- `position`
- `pinned_at`
- `last_shown_at`
- `visible_until`
- `completed_at`
- `completed_cleanup_at`
- `created_at`
- `updated_at`

Field notes:

- `position` preserves dashboard order.
- `visible_until` controls when a pinned memory should stop appearing if it is
  not completed.
- `completed_cleanup_at` should normally be 2 hours after `completed_at`.
- The first dashboard should show at most 3 Cuisine memories and 3 Sightseeing
  memories.

Constraints:

- `user_id` references `users.id`.
- `memory_id` references `memories.id`.
- There should be at most one current pinned record for the same `memory_id`.

### Optional Later Tables

The first version can generate suggestions on demand and record only pin,
ignore, complete, cancel, replace, and delete events. If the suggestion screen
later needs exact replay or analytics, add:

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
- Pinning a suggestion changes pin state but does not refresh the whole
  suggestion list automatically.
- Ignoring a suggestion records an event but does not delete the memory.
- Already showing pinned memories should not appear again in suggestions.

## Pinned Memory Behavior

Pinned memories do not need the normal suggestion score. Pinning is already a
strong manual signal.

Dashboard behavior:

- The first dashboard should show up to 3 Cuisine memories and up to 3
  Sightseeing memories.
- The first dashboard should not support adding or editing memory categories.
- Pinned memory order should remain stable across refreshes and dashboard loads.
- Marking a pinned memory as done records a `completed` event, updates memory
  summary fields, sets `completed_at`, and sets `completed_cleanup_at` to about
  2 hours later.
- If done was a misclick, the user can cancel done before cleanup.
- On dashboard load, completed pinned records whose cleanup time has passed
  should be deleted and replaced with another memory if one is available.
- Replacing a pinned memory selects a new memory from the same category and
  position. The replacement should not already be showing and should not already
  be completed.
- The new replacement should stay expanded so the user can immediately inspect
  it.

Visibility timing:

- When a pinned memory appears, set `visible_until` to a random duration after
  `last_shown_at`.
- Allowed durations are 24, 30, 36, 42, and 48 hours.
- Completing or replacing a pinned memory should refresh the relevant visible or
  cleanup timing.
- Visibility timing is separate from the 2-hour completed cleanup timing.

## Dashboard

The home dashboard should show a compact `Pinned Memories` section. Its icon
should match the Memories item in the hamburger menu.

For each pinned memory, show:

- title
- short description
- category

Clicking or focusing a pinned memory should expand it like the current routine
cards. Only the expanded state should show:

- done button
- replace button
- view button that opens the memory detail page

Clicking the pinned memory again should collapse it.

If the user clicks done, keep the card expanded and show the completed state. If
the user clicks replace, replace only that one item, keep other positions
unchanged, and keep the new item expanded.

On dashboard load or reload:

- apply the rules in Pinned Memory Behavior
- preserve the order of still-active pinned memories
- fill empty slots by appending new pinned memories at the end of the category
  list when candidates exist

## Memories Page

The Memories page is the full management page for this feature.

It should allow the user to:

- view all memories
- filter by category
- open a memory detail page
- add a memory
- edit or delete a memory
- manage categories in a lightweight dialog
- open the suggestion page

The Memories page can be opened from the hamburger menu. Its icon should match
the `Pinned Memories` dashboard section; `ClipboardList` is a reasonable first
icon.

### Memory Management UI

The Memories page should support direct testing of persisted memory data.

The user must be able to:

- add a memory
- edit a memory
- delete a memory
- add a memory category
- edit a memory category
- delete a memory category when it is not used by memories

The add and edit controls should not appear as inline panels inside the memory
list. Inline panels are hard to distinguish from page content and make it
unclear whether a save action succeeded.

Use one of these navigation patterns:

- separate add/edit pages or subpages
- modal dialogs above the current page

For the current web implementation, prefer modal dialogs because they keep the
user on the Memories page while testing data entry.

Modal behavior:

- Opening `Add` should show an add-memory dialog.
- Opening `Edit` on a memory should show an edit-memory dialog.
- Opening `Categories` should show a category-management dialog.
- The page behind the dialog should be covered by a semi-transparent black
  overlay.
- Clicking outside the dialog or pressing a visible close button should dismiss
  the dialog without saving.
- The dialog should not be nested inside a page card or list item.
- The dialog should fit on mobile and scroll internally when content is taller
  than the viewport.

Save/delete behavior:

- After a successful save or delete, close the active dialog.
- Refresh the Memories page data immediately after the backend action succeeds.
- Keep the dialog open and show a clear message if validation or database
  update fails.
- Disable action buttons while the backend action is pending so duplicate
  submits are avoided.
- Category delete can fail when the category is still used by memories; show the
  backend message and keep the dialog open.
