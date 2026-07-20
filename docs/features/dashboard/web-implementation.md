# Dashboard Web Implementation

This document records the current Dashboard web implementation. Visible UI
behavior is documented in [ui.md](ui.md).

## Current Scope

The current Dashboard is database-backed for active user-facing panels:

- project tasks from the Projects feature
- routine instances from the Routines feature
- pinned memories from the Memories feature

The Dashboard component is a thin composition layer. It should not own project,
routine, or memory row rules.

## Data Flow

`AppShell` owns authenticated app state and loads Dashboard data through
feature-aware hooks:

```text
AppShell
  useDashboardProjects
  useDashboardRoutines
  useDashboardMemories
  Dashboard
    ProjectTasksPanel
    RoutinesPanel
    TodayReviewPanel
    PinnedMemoriesPanel
```

Feature ownership:

- `features/projects` owns project task data, task commands, and
  `ProjectTasksPanel`
- `features/routines` owns routine instance data, routine commands, and
  `RoutinesPanel`
- `features/memories` owns pinned memory data, memory commands, and
  `PinnedMemoriesPanel`
- `features/dashboard` owns Dashboard composition, Dashboard hooks, shared
  dashboard optimistic helpers, and Dashboard-level tests

The Dashboard hooks may use browser `localStorage` as a stale-while-refresh
cache for signed-in users. After client hydration, cached project, routine, and
memory data can populate the Dashboard and pinned-project sidebar shortcuts
before the backend responds. Live backend data remains authoritative and
replaces the cached snapshot after refresh. If the backend refresh fails, the
cached content should stay visible and the failure should appear through the
shared notification stack.

Dashboard browser cache rules:

- key cached sections by Arctic Aria user id and section name
- keep separate sections for projects, routines, and memories
- validate a small schema envelope before reading cached data
- remove malformed cached data instead of rendering it
- never use browser cache as the source of truth for saves, deletes, or
  optimistic rollback decisions

## Dashboard Commands

Dashboard actions are lightweight commands. They should usually be optimistic
and should use the shared notification stack for backend failures.

Current active commands:

- mark a project task done
- mark a routine completed or pending
- mark a pinned memory completed or active
- send the manual Daily Review Discord message

The production scheduled Daily Review path is called from
`/api/cron/discord-notifications`, which also runs routine reminders. The
manual `Send` action uses the same review text builder and Discord notification
service.

Feature management actions, such as add/edit/delete project, routine, memory,
or category, belong to the feature pages and dialogs, not the Dashboard.

## Code Locations

Dashboard composition:

```text
apps/web/src/features/dashboard/components/Dashboard.tsx
```

Dashboard hooks and optimistic helpers:

```text
apps/web/src/features/dashboard/hooks/useDashboardProjects.ts
apps/web/src/features/dashboard/hooks/useDashboardRoutines.ts
apps/web/src/features/dashboard/hooks/useDashboardMemories.ts
apps/web/src/features/dashboard/optimistic-updates.ts
```

Feature-owned Dashboard panels:

```text
apps/web/src/features/projects/components/ProjectTasksPanel.tsx
apps/web/src/features/routines/components/RoutinesPanel.tsx
apps/web/src/features/memories/components/PinnedMemoriesPanel.tsx
```

Do not add new dummy-data-backed Dashboard behavior. The active Dashboard loads
database-backed feature data through the hooks above.

## Related Feature Docs

- [../projects/web-implementation.md](../projects/web-implementation.md)
- [../routines/web-implementation.md](../routines/web-implementation.md)
- [../memories/web-implementation.md](../memories/web-implementation.md)

## Verification

Run from `apps/web`:

```text
pnpm test
pnpm lint
pnpm build
```

Manual inspection should cover:

- desktop viewport around `1440x900`
- mobile viewport around `390x844`
- nonblank Dashboard content
- no incoherent text overlap
- Dashboard task checkbox behavior
- routine checkbox behavior
- pinned memory done and replace behavior
