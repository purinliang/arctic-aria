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

The page content area should keep a minimum height of `110vh` so the right page
keeps its own scroll surface visible during normal desktop inspection. Shared
bottom padding belongs to the app shell content column, not individual feature
pages.

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
  - up to three pinned project shortcuts, shown as indented children when set
- Ideas
- Routines
- Memories
- Settings

Implemented items should navigate or open the intended dialog. Placeholder
items should show a non-blocking notification instead of silently doing
nothing.

The main `Projects` item always opens the Projects list page. Pinned project
shortcuts below it open that specific Project detail page directly. Pinned
project shortcuts are optional and should not replace the main Projects item.

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
name in the sidebar or page title bar. Theme behavior is documented in
[theme.md](theme.md).

## Brand

The sidebar shows a compact brand block at the top-left: first row Sparkles
icon plus localized brand text, second row larger workspace label. In English
the brand text is `ArcticAria`; in Simplified Chinese it is `北极阿莉雅`. The
brand block should stay aligned with the navigation menu item content and
should not be shown as uppercase helper text. The workspace label should be
visually larger than the brand text. Short labels such as `工作区` may render
larger than English `Workspace` so the sidebar hierarchy stays balanced. Keep
the gap between the brand row and workspace row compact.
