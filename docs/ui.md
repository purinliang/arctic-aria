# UI Rules

This document is the human-facing entry point for Arctic Aria UI rules. Detailed
web component rules live in [web/ui-components.md](web/ui-components.md).
Feature-specific UI behavior stays under `docs/features/<feature>/ui.md`.

## Structure

- A panel is a page or dashboard section, such as `ProjectTasksPanel`,
  `RoutinesPanel`, `PinnedMemoriesPanel`, `MemoriesPanel`, or
  `SuggestionsPanel`.
- A row is one item inside a list or panel, such as a task row, routine row, or
  memory row.
- A card is a compact inner surface or repeated object. Do not use `Card` in a
  component name when the visible section title is plural and the component
  owns the whole section.
- Dashboard composition should stay thin. Feature-owned panels should render
  feature-owned rows.

## Shared Components

New web UI must use the shared components in `apps/web/src/components/`.
Do not create one-off buttons, panels, dialogs, notifications, list rows, or
form controls inside feature pages. Add or extend a shared component first when
the app needs a reusable pattern.

Important shared docs:

- [web/ui-components.md](web/ui-components.md)
- [web/theme.md](web/theme.md)
- [web/sidebar.md](web/sidebar.md)
- [web/sidebar-ui.md](web/sidebar-ui.md)

## Interaction Defaults

- Dashboard actions should be lightweight, usually optimistic, and tracked per
  item when concurrent clicks are possible.
- Add/edit/delete dialogs may stay blocking because they should close only after
  the backend confirms success.
- Auth login and registration are not optimistic. They should wait for backend
  confirmation before showing success or opening the dashboard.
- Failed optimistic commands should use the shared notification stack.

## Current Feature UI Docs

- [features/auth/ui.md](features/auth/ui.md)
- [features/dashboard/ui.md](features/dashboard/ui.md)
- [features/projects/ui.md](features/projects/ui.md)
- [features/routines/ui.md](features/routines/ui.md)
- [features/memories/ui.md](features/memories/ui.md)
