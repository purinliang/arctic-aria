# Sidebar

This document describes the web sidebar structure. Component-level behavior is
documented in [sidebar-ui.md](sidebar-ui.md).

## Desktop Layout

On desktop, the sidebar is persistent on the left and the page content is on
the right.

The sidebar height is independent from the page content height. It should stay
anchored to the viewport and must not stretch to match a long right-side page.
The sidebar and page content may scroll independently. If the sidebar does not
have enough vertical space, the sidebar content should scroll inside the
sidebar instead of being clipped.

The page content area should keep a minimum height of `105vh` so the right page
keeps its own scroll surface visible during normal desktop inspection.

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
- Projects
- Routines
- Memories
- Settings

Implemented items should navigate or open the intended dialog. Placeholder
items should show a non-blocking notification instead of silently doing
nothing.

Review is hidden from the sidebar until the review feature has a stable
navigation design.

## Bottom Account Area

The bottom area should be separated from the page navigation by a line, not by a
large card that makes the sign out action look like part of the dark-mode
setting.

Order from top to bottom:

- separator line
- theme mode item
- sign out item

The theme mode and sign out actions should look like other sidebar menu items:
same left alignment, icon position, row height, and button surface. Do not use a
separate switch control in the sidebar. Do not show the current user display
name in the sidebar or page title bar.

## Brand

The sidebar brand should match the login page naming: `Arctic Aria`, same
letter case, led by a Sparkles icon. It should not be shown as uppercase helper
text.
