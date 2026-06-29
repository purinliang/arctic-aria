# Web Dashboard Prototype Refactor Plan

## Goal

Refine the current interactive Next.js dashboard prototype so it better matches
the intended daily planning experience. The prototype still uses dummy data
only, but the UI should show the product direction clearly enough to guide later
Core, scheduler, review, and reward-plugin work.

This is an Interface layer prototype. It must not add real Core logic,
persistence, Discord behavior, API routes, authentication, or database access.
This boundary applies to dashboard prototype work only. The separate username
and password auth implementation is documented in
[auth-implementation.md](auth-implementation.md).

## Scope

The current prototype already includes:

- A single dashboard page for today's daily plan.
- A fixed day boundary of `04:00`.
- Dummy tasks with plan labels, deadlines, priority, status, weight, completed
  weight, and optional subtasks.
- Dummy routines with scheduled time, reminder state, status, and streak text.
- Local React state for all interactions.
- A review panel that can be opened at any time and updated repeatedly.
- Expected reward values based on dummy progress.

The refactor should keep:

- Dummy data only.
- Local React state only.
- No state survival after reload.
- Desktop-first layout with usable iPhone Chrome behavior.

The refactor must not add:

- Authentication or user accounts.
- Database storage, persistence, or backend APIs.
- Discord bot behavior.
- Real reward calculations.
- Full CRUD for plans, tasks, or routines.
- Shared packages.
- Core-layer business logic.

## Product Boundaries

The dashboard may display task, routine, review, and reward concepts, but it
should not own their real rules.

- Task and subtask status, weights, deadlines, and priority are Core task-engine
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
Default theme should be dark.

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

Add a hamburger button that opens a left sidebar. The sidebar should contain:

- `Dashboard`: the current page.
- `Tasks`: placeholder navigation item for future task editing.
- `Routines`: placeholder navigation item for future routine editing.
- `Settings`: contains the dark mode toggle for now.

Dark mode should be the default. A light mode toggle can be local state and does
not need persistence.

## Task Cards

Tasks shown on the dashboard are recommended for today, but their plan deadline
may be several days later. A task deadline should display as a date with time,
not only a time.

Priority should reflect urgency in the dummy data:

- `High`: approaching deadline, missed deadline, or high user priority.
- `Medium`: useful today but not urgent.
- `Low`: optional or low-pressure work.

Task card behavior:

- Do not use a large checkbox button for the task itself.
- Show one green circular progress indicator for task completion.
- Do not show a horizontal progress bar.
- Do not add a second progress visualization.
- Click the task card to expand details.
- Click the task card again to collapse details.
- Expanded details should show subtasks with checkboxes, descriptions, and
  weight circles.
- Each subtask weight should be shown as outline circles. If the subtask is
  checked, all of its circles become green.
- Partial completion should be represented by checked subtask weights, not a
  `Completed weight` range control or a separate `Partial` button.

## Interactions

The dashboard should support:

- Expanding and collapsing task details by clicking the task card.
- Updating task progress from expanded details.
- Toggling subtasks with checkboxes.
- Reflecting partial task progress through the green progress circle.
- Expanding and collapsing routine details by clicking the routine card.
- Marking routines as done, skipped, or pending through reminder actions.
- Clicking `Review` at any time, multiple times.

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

The review UI should appear only after clicking the `Review` button. It can be a
center dialog or a compact popover below the review button. Prefer the option
that feels stable on desktop and usable on mobile.

The review card should show:

- Completed tasks and routines.
- Partial task progress.
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

## Technical Plan

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

Suggested refactor shape:

- Keep `Dashboard` as the larger stateful component.
- Split task cards, routine cards, review dialog, sidebar, and small shared UI
  into separate components.
- Keep dashboard-specific types in `features/dashboard/types.ts`.
- Keep dummy records in `features/dashboard/dummy-data.ts`.
- Keep UI-only derived state inside dashboard components.
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
- Dark mode default and light mode toggle.
- Task expand and collapse behavior.
- Subtask checkbox behavior.
- Green circular task progress behavior without text inside the circle.
- Routine status changes.
- Routine auto-expand behavior when a reminder is active.
- Repeated `Review` button behavior.
- Treasure chest hover or focus preview behavior.

## Refactor Checklist

After this plan is accepted, refactor the existing prototype in this order:

1. Add dark-mode-first page styling and local light mode toggle.
2. Add hamburger sidebar with placeholder navigation items.
3. Simplify the top bar to date, day boundary, and review button only.
4. Replace task checkbox and progress bars with green circular progress.
5. Change task deadlines to date-time values in dummy data.
6. Make task cards expand and collapse on card click.
7. Move subtask checkboxes, descriptions, and weight circles into expanded task
   details.
8. Remove the timeline section from the dashboard.
9. Make routine cards expand and collapse, with active reminders open by
   default.
10. Move routine `Done`, `Busy`, and `Skip` buttons into expanded routine
    details.
11. Replace the persistent review panel with a review dialog or popover.
12. Replace box/item reward UI with gold and treasure chest preview UI.
13. Run lint, build, `git diff --check`, and viewport inspection.
