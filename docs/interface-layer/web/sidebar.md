# Sidebar

This document describes the web sidebar structure. Component-level behavior is
documented in [sidebar-ui.md](sidebar-ui.md).

## Desktop Layout

On desktop, the sidebar is persistent on the left and the page content is on
the right.

The sidebar height is independent from the page content height. It should stay
anchored to the viewport and must not stretch to match a long right-side page.
The page content may scroll independently.

The desktop page title bar should show only the current page title. It should
not show the current user, sign out button, current time, day boundary, or review
button.

## Mobile Layout

On mobile and tablet-sized viewports, hide the sidebar behind a hamburger
button. Opening the hamburger shows the sidebar as an overlay above the page.

The mobile sidebar should use the same content order as desktop.

## Navigation Content

The main navigation area should contain:

- Dashboard
- Tasks
- Routines
- Memories
- Review
- Settings

Implemented items should navigate or open the intended dialog. Placeholder
items should show a non-blocking notification instead of silently doing
nothing.

## Bottom Account Area

The bottom area should be separated from the page navigation by a line, not by a
large card that makes the sign out action look like part of the dark-mode
setting.

Order from top to bottom:

- separator line
- dark mode setting
- sign out button
- current user display name

The current user display name belongs at the bottom of the sidebar, near the
account action. It should not appear in the page title bar.
