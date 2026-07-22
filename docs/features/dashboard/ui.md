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
and a lightweight Daily Review title-bar action, but it must not redefine their
product rules.

Current Dashboard scope:

- today's selected project tasks
- today's routine instances
- pinned memories
- Daily Review popover with a non-production manual Discord delivery test

Deferred Dashboard scope:

- persisted review history UI
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
- left column: `Tasks`
- right column: stacked `Routines` and `Pinned Memories`
- desktop: left panel should be wider than the right panel through the shared
  split classes
- mobile: panels stack vertically
- panels keep independent content-driven heights

Each Dashboard panel header should include a short friendly description, ideally
5-7 English words and no more than 8 English words. The description should
encourage action without adding instruction text or counts.

The Dashboard should not show a top summary bar, duplicate progress visuals, or
a timeline section in the current UI.

## Daily Review Popover

Daily Review is opened from the Today page title bar, not shown as a Dashboard
panel. The title-bar action opens an info popover using the shared floating
popover view. The summary paragraph should clamp at two lines without forcing a
two-line minimum. The progress bar uses the same weighted progress as Daily
Review text selection: project tasks count as three units, routines count as
one unit, and pinned memories do not affect the progress fill. The secondary
fill shows local day elapsed time.

## Project-Owned Tasks Panel

The project-owned task panel is the main left Dashboard panel. Task product
rules belong to the Projects feature, not to a separate Dashboard task model.

Header:

- icon: `Check`
- title: `Tasks`
- description: short encouragement to choose a steady project step for today
- no header count metadata

Task row layout:

- parent surface: shared list item
- left: done checkbox
- right: title, description, and supporting metadata
- title is underlined and opens the Projects detail page for that task's
  project
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

Clicking the underlined title opens the Projects detail page for that task's
project. It should not open the Projects list page. The whole row is not
clickable. Clicking the checkbox only changes completion state and must not
navigate.

## Routines Panel

The Routines panel shows routine instances for the current personal day. It
does not show every routine definition.

Header:

- icon: `Bell`
- title: `Routines`
- description: short encouragement to keep repeatable checks light and visible

Routine row layout:

- parent surface: shared list item
- left: completion checkbox
- right: title and scheduled time on the first row, then description
- title is underlined and opens the Routines page
- scheduled time is right-aligned beside the title
- description is visible and clamps at two lines
- do not show `Due today`; every routine instance on the Today page is due
  today

Routine rows should not expand or collapse. Do not show `Busy` or `Skip`
buttons in the Dashboard UI. Those are future reminder-response actions.

Checking a routine is a lightweight Dashboard action. The visible row should
update optimistically and backend failure should be reported through the shared
notification stack.

Clicking the underlined title opens the Routines page. The whole row is not
clickable. Clicking the checkbox only changes completion state and must not
navigate.

## Pinned Memories Panel

The Pinned Memories panel shows pinned memories only. It does not show general
memory suggestions.

Header:

- icon: `Album`
- title: `Pinned Memories`
- description: short encouragement to keep good options nearby

Pinned memory row layout:

- parent surface: shared list item
- left: experienced checkbox
- middle: title, description, and supporting metadata
- title is underlined and opens the Memories page
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

Clicking the underlined title opens the Memories page. The whole row is not
clickable. Clicking the checkbox must not navigate.

## Daily Review Message

Daily Review is a lightweight popover and sender, not a persisted review
feature. It should send a short Markdown-style Discord message generated from
the visible Today items:

- done and undone project tasks
- done and undone routine instances
- pinned memories

The first version should not add a `daily_reviews` table or a structured review
editing workflow. Discord delivery history is enough for this version.

Header:

- title-bar action icon: `ClipboardCheck`
- popover title: `Daily Review`
- popover action: secondary `Send` button for the current manual Discord
  delivery test path in local and preview environments only

The Discord message heading should be `Daily Review for <date>`, because the
message can be read outside the Today page and may arrive after the day ends.

Hide the `Send` button in the real production environment. Production uses the
Cloudflare scheduled Discord notification cron for Daily Review delivery.
Settings `Send Test` remains available in production for explicit Discord
diagnostics.

Popover content:

- render only the generated summary sentence as description-level text
- do not repeat the full task, routine, or pinned-memory lists inside the
  Daily Review popover because those lists are already visible on the Today page
- choose the summary tone from the visible state of tasks, routines, and pinned
  memories
- calculate work progress from tasks and routines only. One task has weight
  `3`; one routine has weight `1`
- divide work progress into buckets: `100%`, `80%+`, `50%+`, `20%+`, and
  `0%`. Positive progress below `20%` may still use the lowest progress tone
  so small routine-only progress is not treated as no progress
- keep at least seven localized summary options per tone so repeated status
  patterns do not feel mechanical
- use the current date and visible counts as a stable seed inside the selected
  tone; the summary should not change randomly during the same day
- write summary copy as an end-of-day or midnight reflection. Do not use copy
  that assumes the user still has evening time left or should make `today`
  lighter.

Discord message text should still include Markdown-style sections because the
message can be read outside the Today page:

- start with `### Daily Review for <date>`; the date must use the shared long
  date format, such as `Jul 17, 2026 Fri`
- show the same summary sentence and one friendly count sentence as a single
  paragraph immediately below the heading. Handle zero, singular, and plural
  counts without awkward wording such as `completed no tasks`
- keep exactly one empty line between that summary paragraph and `### Tasks`
- show `Tasks`, `Routines`, and `Pinned Memories` sections as checkbox-like
  lists, with no empty lines between those sections
- list each item as `- \`[x]\` **Title**: Description` or
  `- \`[ ]\` **Title**: Description`; use inline code for the checkbox marker
  so Discord renders it as fixed-width text. Omit the colon and description
  when the description is empty

While sending, the action can show the shared pending button text. Success and
failure results must use the shared notification stack.

## Empty States

Use concise empty states:

- tasks: `A clear slate for today. Choose one project task when you are ready.`
- routines: `No routines are due today. Keep the day light.`
- pinned memories: `No pinned memories yet.`
