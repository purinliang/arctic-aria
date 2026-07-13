# Web Dashboard Prototype Refactor Notes

## Goal

Refine the interactive Next.js dashboard prototype so it better matches the
intended daily planning experience. This document is historical for the first
dashboard prototype. New project and task work should follow the Project docs
instead of this older prototype direction.

This boundary applies to dashboard prototype work only. The separate username
and password auth implementation is documented in
[auth-implementation.md](auth-implementation.md). Database-backed Memories are
documented in [memories-implementation.md](memories-implementation.md). Project
rules are documented in
[projects/overview.md](../../core-layer/projects/overview.md),
[projects/data-model.md](../../core-layer/projects/data-model.md), and
[projects/ui.md](../../core-layer/projects/ui.md).

## Scope

The dashboard prototype currently includes:

- A single dashboard page for today's daily plan.
- A fixed day boundary of `04:00`.
- Dummy project tasks with project labels, deadlines, priority, status, and
  optional subtasks.
- Dummy routines with scheduled time, reminder state, status, and streak text.
- Local React state for all interactions.
- A review panel that can be opened at any time and updated repeatedly.
- Expected reward values based on dummy progress.
- Database-backed pinned memories from the Memories implementation.

For task, routine, review, and reward prototype work, keep:

- Dummy data only.
- Local React state only.
- No state survival after reload.
- Desktop-first layout with usable iPhone Chrome behavior.

For task, routine, review, and reward prototype work, do not add:

- Real reward calculations.
- Full CRUD for projects, tasks, or routines.
- Shared packages.
- Core-layer business logic.

## Product Boundaries

The dashboard may display task, routine, review, and reward concepts, but it
should not own their real rules.

- Project, task, and subtask status, deadlines, and priority are Core project
  concepts.
- Routine instance completion, skip, and pending status are Core routine
  concepts. Reminder delivery state is a scheduler and infrastructure concept.
- Daily review summaries are Review engine concepts.
- Gold and treasure chest rewards are Reward plugin concepts.

For this prototype, these concepts can remain typed dummy records in
`apps/web/src/features/dashboard`.

## User Experience

The first screen is the dashboard itself, not a landing page. The layout should
be dense, quiet, and work-focused so it feels like an operational planning tool.
Daytime mode should be the default.

The desktop layout should include:

- A left navigation sidebar opened by a hamburger button.
- A top summary bar with the current date, the `04:00` day boundary, and a
  review button.
- A primary task column for today's recommended tasks and subtasks.
- A routine and reminder column for scheduled routines.
- A review card shown only after the user clicks `Review`.

The top summary bar should not include task progress or routine progress. The
daily dashboard should avoid duplicate progress visuals.

The dashboard should not include a timeline section in this page.

The mobile layout should be usable on an iPhone-sized Chrome viewport, with
sections stacking cleanly and without overlapping text.

## Navigation And Theme

On desktop, keep a persistent left sidebar and show page content on the right.
On mobile and tablet-sized viewports, hide the sidebar behind a hamburger
button and show it as an overlay when opened. Detailed sidebar behavior is
documented in [sidebar.md](sidebar.md) and [sidebar-ui.md](sidebar-ui.md).

The page title bar should show only the current page title. Do not show the day
boundary, current time, current user, logout button, or review button in the
page title bar.

The sidebar should contain:

- `Dashboard`: the current page.
- `Projects`: placeholder navigation item for future project editing.
- `Routines`: placeholder navigation item for future routine editing.
- `Memories`: memory management.
- `Settings`: placeholder navigation item for future settings.
- theme mode action.
- sign out action.

Do not show `Review` in the sidebar until the review feature has a stable
navigation design. Do not show the current signed-in user display name in the
sidebar or page title bar.

Daytime mode should be the default. A theme mode action can be local state and
does not need persistence.

Placeholder sidebar items should show a non-blocking notification instead of
silently doing nothing.

## Task Cards

Project product and UI rules are now documented in
[projects/overview.md](../../core-layer/projects/overview.md),
[projects/data-model.md](../../core-layer/projects/data-model.md), and
[projects/ui.md](../../core-layer/projects/ui.md). This section records the
dashboard behavior that remains valid after the Project naming decision.

Tasks shown on the dashboard are recommended for today, but their project or
milestone deadline may be several days later. A task deadline should display as
a date with time, not only a time.

Priority should reflect urgency in the dummy data:

- `High`: approaching deadline, missed deadline, or high user priority.
- `Medium`: useful today but not urgent.
- `Low`: optional or low-pressure work.

Task card behavior:

- Do not use a large checkbox button for the task itself.
- Do not show standalone progress visualization for task completion.
- Do not show a horizontal progress bar.
- Do not add duplicate progress visualization.
- Click the task card to expand details.
- Click the task card again to collapse details.
- Expanded details should show subtasks with checkboxes and descriptions.
- Partial completion should be represented by checked subtasks, not editable
  numeric progress fields or a separate `Partial` button.

## Interactions

The dashboard should support:

- Expanding and collapsing task details by clicking the task card.
- Updating task progress from expanded details.
- Toggling subtasks with checkboxes.
- Reflecting local task progress through checked subtasks.
- Expanding and collapsing routine details by clicking the routine card.
- Marking routines as done, skipped, or pending through reminder actions.

## Routine Cards

Routine cards should be collapsed by default, except for routine instances with
an active reminder delivery. A card with an active reminder should open
automatically so the user can answer quickly.

Routine card behavior:

- Click the routine card to expand details.
- Click the routine card again to collapse details.
- Expanded details should show three action buttons: `Done`, `Busy`, and `Skip`.
- Dummy routine instance statuses are `completed`, `pending`, and `skipped`.
- `reminding` is a UI delivery state for a currently visible reminder, not a
  Core routine status.
- `Busy` is an action, not a stored status. Clicking it should snooze or
  reschedule the reminder delivery state.
- Reminder delivery state should be visually distinct from routine instance
  status.

## Review And Rewards

The review UI is intentionally hidden from primary navigation for now. Keep the
prototype dialog code only if it is useful for later work, but do not expose a
sidebar item until the review feature has a stable navigation design.

The review card should show:

- Completed project tasks and routines.
- Partial task progress derived from subtasks.
- Unfinished tasks and skipped routines.
- Expected rewards so far.

Reward display:

- Show gold as a numeric reward.
- Show a treasure chest instead of a generic box label.
- Use an icon for gold and an icon for the treasure chest.
- Do not show separate item rewards directly in the main review card.
- Items belong inside the treasure chest preview.
- Hovering or focusing the treasure chest should show expected contents, such as
  five items with at least two Legendary items, one Epic item, one Rare item, and
  one Common item.
- Use rarity colors in the preview list: Legendary orange, Epic purple, Rare
  blue, and Common neutral.

## Pinned Memories Status

Pinned Memories started as dashboard dummy UI, but the current app now uses the
database-backed Memories implementation. Do not follow the old dummy-memory
prototype direction for new work.

Current Memories behavior is documented in:

- [memories.md](../../core-layer/memories.md)
- [memories-ui.md](../../core-layer/memories-ui.md)
- [memories-implementation.md](memories-implementation.md)

## Technical Direction

Continue using the existing Next.js app under `apps/web`:

- App Router.
- TypeScript.
- React client-side state.
- Tailwind CSS.
- ESLint.
- `src/` directory layout.
- pnpm package management.

Keep the prototype source in:

```text
apps/web/
  src/app/page.tsx
  src/app/globals.css
  src/features/dashboard/dummy-data.ts
  src/features/dashboard/types.ts
  src/features/dashboard/components/
```

The database-backed Memories page implementation is now tracked separately in
[memories-implementation.md](memories-implementation.md).

Suggested refactor shape:

- Keep `Dashboard` as the larger stateful component.
- Split project task cards, routine cards, review dialog, sidebar, and small
  shared UI into separate components.
- Keep dashboard-specific types in `features/dashboard/types.ts`.
- Keep only remaining prototype records in `features/dashboard/dummy-data.ts`.
- Keep UI-only derived state inside dashboard components.
- Move database-backed project behavior into the future `features/projects`
  module and the dashboard components that render it.
- Keep database-backed Memories behavior in `features/memories` and the
  dashboard components that render it.
- Do not introduce shared packages or server APIs.
- Do not create a real scheduler, review engine, or reward plugin in this
  branch.

## Visual Direction

Use restrained styling, clear spacing, and scan-friendly information density.
Cards are appropriate for individual task and routine items or functional
panels. Avoid decorative nested cards, marketing hero sections, or purely
illustrative UI.

Use Tailwind utilities and simple React components. If `lucide-react` is
available in the scaffold, use it for compact icon buttons. Otherwise, use
clear text labels and native controls.

Avoid:

- Marketing hero sections.
- Timeline visualization on the daily dashboard.
- Nested decorative cards.
- Duplicate progress indicators.
- Text that overlaps or overflows controls on mobile.

## Verification

Run the relevant checks after implementation:

- `pnpm lint`
- `pnpm build`
- `git diff --check`

Run the app locally and inspect:

- Desktop viewport around `1440x900`.
- Mobile viewport around `390x844`.
- Nonblank dashboard content.
- No incoherent text overlap.
- Sidebar open and close behavior.
- Daytime mode default and theme mode menu action.
- Project task expand and collapse behavior.
- Subtask checkbox behavior.
- Routine status changes.
- Routine auto-expand behavior when a reminder is active.
- Pinned memory done behavior.
- Pinned memory replace behavior.
- Treasure chest hover or focus preview behavior.

## Refactor Checklist

After this direction is accepted, refactor the existing prototype in this order:

1. Add daytime-first page styling and local theme mode action.
2. Add hamburger sidebar with placeholder navigation items.
3. Simplify the top bar to date, day boundary, and review button only.
4. Remove task checkbox progress bars and standalone task progress visuals.
5. Change task deadlines to date-time values in dummy data.
6. Make task cards expand and collapse on card click.
7. Move subtask checkboxes and descriptions into expanded task details.
8. Remove the timeline section from the dashboard.
9. Make routine cards expand and collapse, with active reminders open by
   default.
10. Move routine `Done`, `Busy`, and `Skip` buttons into expanded routine
    details.
11. Replace the persistent review panel with a review dialog or popover.
12. Replace box/item reward UI with gold and treasure chest preview UI.
13. Run lint, build, `git diff --check`, and viewport inspection.
