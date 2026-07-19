# Dashboard UI

This document describes the current user-visible Dashboard behavior. Dashboard
implementation notes are documented in [web-implementation.md](web-implementation.md).
Feature-specific rules stay in their owning feature docs:

- Projects: [../projects/ui.md](../projects/ui.md)
- Routines: [../routines/ui.md](../routines/ui.md)
- Memories: [../memories/ui.md](../memories/ui.md)

## Purpose

The Dashboard is the daily operating surface. It should show what the user can
act on today without turning into a management page.

The Dashboard may display project tasks, routine instances, pinned memories,
and future reviews, but it must not redefine their product rules.

Current Dashboard scope:

- today's selected project tasks
- today's routine instances
- pinned memories

Deferred Dashboard scope:

- review summary UI
- timeline UI
- full project, routine, or memory management

## Layout

The Dashboard is rendered inside the shared app shell. Sidebar, page title bar,
theme mode, document background, and notifications are web-shell behavior, not
Dashboard behavior. Shared shell behavior is documented in:

- [../../web/theme.md](../../web/theme.md)
- [../../web/sidebar.md](../../web/sidebar.md)
- [../../web/sidebar-ui.md](../../web/sidebar-ui.md)

Dashboard body layout:

- parent layout: shared split layout
- left panel: `Tasks`
- right panel: stacked `Routines` and `Pinned Memories`
- desktop: left panel should be wider than the right panel through the shared
  split classes
- mobile: panels stack vertically
- panels keep independent content-driven heights

The Dashboard should not show a top summary bar, duplicate progress visuals, or
a timeline section in the current UI.

## Project-Owned Tasks Panel

The project-owned task panel is the main left Dashboard panel. Task product
rules belong to the Projects feature, not to a separate Dashboard task model.

Header:

- icon: `Check`
- title: `Tasks`
- no header count metadata

Task row layout:

- parent surface: shared list item
- left: done checkbox
- right: title, description, and supporting metadata
- description is always visible
- supporting metadata uses `project · milestone · deadline`
- omit the milestone segment when the task has no milestone

Task row should not show:

- edit action
- expand/collapse action
- status selector
- priority tag
- progress ring or progress bar
- block or skip actions

Checking a task is a lightweight Dashboard action. The visible row should update
optimistically and backend failure should be reported through the shared
notification stack.

Clicking the row's outlineless right-arrow button opens the Projects detail page
for that task's project. It should not open the Projects list page. The whole
row is not clickable. Clicking the checkbox only changes completion state and
must not navigate.

## Routines Panel

The Routines panel shows routine instances for the current personal day. It
does not show every routine definition.

Routine row layout:

- parent surface: shared list item
- left: completion checkbox
- right: title, description, and supporting metadata
- description is always visible
- supporting metadata uses scheduled time and due/answered text

Routine rows should not expand or collapse. Do not show `Busy` or `Skip`
buttons in the Dashboard UI. Those are future reminder-response actions.

Checking a routine is a lightweight Dashboard action. The visible row should
update optimistically and backend failure should be reported through the shared
notification stack.

Clicking the row's outlineless right-arrow button opens the Routines page. The
whole row is not clickable. Clicking the checkbox only changes completion state
and must not navigate.

## Pinned Memories Panel

The Pinned Memories panel shows pinned memories only. It does not show general
memory suggestions.

Pinned memory row layout:

- parent surface: shared list item
- left: experienced checkbox
- middle: title, description, and supporting metadata
- right: optional outlineless right-arrow button to open the Memories page
- description is always visible
- supporting metadata uses category only

Pinned memory rows should not expand or collapse. Do not show a Dashboard
`View` button. Do not show a single-row refresh or replace button.
Do not expose internal memory rotation state such as `visible_until`, cleanup
timing, or visible-window status in the row metadata.

Checking a pinned memory marks it experienced. Experienced pinned memories should
not use a green background or strikethrough text. If the user cancels before
cleanup, restore the active state. If the backend rejects either command, roll
back the visible state and show the shared notification.

Pinned-memory checkbox labels can use category-specific experience verbs in
both English and Chinese when the row has a built-in category key. Custom
categories fall back to `experienced` / `体验`.

Clicking the row's outlineless right-arrow button opens the Memories page. The
whole row is not clickable. Clicking the checkbox must not navigate.

## Review

Review UI is not an active Dashboard feature yet. Do not keep review dialog
code inside the Dashboard feature until Reviews has current docs.

Future review UI may show:

- completed project tasks and routines
- unfinished tasks and skipped routines

## Empty States

Use concise empty states:

- tasks: `No tasks selected for today.`
- routines: `No routines due today.`
- pinned memories: `No pinned memories yet.`
