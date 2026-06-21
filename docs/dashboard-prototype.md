# Daily Dashboard Prototype Plan

## Goal

Build a small interactive Next.js dashboard prototype for the daily plan
experience. The prototype uses dummy data only and focuses on how a user scans
today's tasks, routines, progress, review state, and expected rewards.

## Scope

The prototype includes:

- A single dashboard page for today's daily plan.
- A fixed day boundary of `04:00`.
- Dummy tasks with plan labels, deadlines, priority, status, weight, completed
  weight, and optional subtasks.
- Dummy routines with scheduled time, reminder state, status, and streak text.
- Local React state for all interactions.
- A review panel that can be opened at any time and updated repeatedly.
- Expected reward values based on dummy progress.

The prototype does not include:

- Authentication or user accounts.
- Database storage, persistence, or backend APIs.
- Discord bot behavior.
- Real reward calculations.
- Full CRUD for plans, tasks, or routines.

State resets on page reload.

## User Experience

The first screen is the dashboard itself, not a landing page. The layout should
be dense, quiet, and work-focused so it feels like an operational planning tool.

The desktop layout should include:

- A top summary bar with the current date, `04:00` day boundary, progress, and a
  review button.
- A primary task column for today's tasks and subtasks.
- A routine and reminder column for scheduled routines.
- A timetable or progress visualization for scanning the day.
- A review and reward panel.

The mobile layout should be usable on an iPhone-sized Chrome viewport, with
sections stacking cleanly and without overlapping text.

## Interactions

The dashboard should support:

- Toggling a task between incomplete and complete.
- Opening a partial-completion control for tasks.
- Adjusting completed task weight for partial progress.
- Marking routines as complete, skipped, or busy.
- Clicking `Review` at any time, multiple times.

The review panel should show:

- Completed tasks and routines.
- Partial task progress.
- Unfinished tasks and skipped or busy routines.
- Expected rewards so far, using dummy values such as gold, box level, and item
  preview.

## Technical Plan

Create a Next.js app under `apps/web` with:

- App Router.
- TypeScript.
- React client-side state.
- Tailwind CSS.
- ESLint.
- `src/` directory layout.
- pnpm package management.

Suggested file structure:

```text
apps/web/
  src/app/page.tsx
  src/app/globals.css
  src/features/dashboard/dummy-data.ts
  src/features/dashboard/types.ts
  src/features/dashboard/components/
```

Keep prototype code inside `apps/web`. Do not add shared packages unless the
prototype becomes awkward without them.

## Visual Direction

Use restrained styling, clear spacing, and scan-friendly information density.
Cards are appropriate for individual task and routine items or functional
panels. Avoid decorative nested cards, marketing hero sections, or purely
illustrative UI.

Use Tailwind utilities and simple React components. If `lucide-react` is
available in the scaffold, use it for compact icon buttons. Otherwise, use
clear text labels and native controls.

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
- Task toggle behavior.
- Partial completion behavior.
- Routine status changes.
- Repeated `Review` button behavior.

