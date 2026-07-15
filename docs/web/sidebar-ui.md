# Sidebar UI

This document describes user-visible sidebar details for the web app. Product
placement rules are documented in [sidebar.md](sidebar.md).

## Desktop

Use a fixed-width left sidebar. The sidebar should stay visually independent
from page panels and should not share the right page's height.

The page area starts to the right of the sidebar and keeps its own max width.
The sidebar should not look like another page panel.

The right page content should have a minimum height of `110vh`. This keeps the
page scroll behavior visible and separate from the sidebar. The app shell also
owns shared bottom padding so feature pages do not add page-end spacing
individually.

The sidebar should scroll internally when the viewport height is too small for
all sidebar content.

## Mobile

Use the hamburger button only on mobile and tablet-sized viewports. The opened
sidebar overlays the page and can be dismissed by clicking the overlay or the
close button.

Browser overscroll background and dark-mode root colors are theme behavior,
documented in [theme.md](theme.md).

## Navigation Items

Navigation items use the shared button component. Active items use the primary
state. Inactive items use the ghost state.

When a feature is not implemented, clicking its item shows the shared
notification component. Do not use a dialog for this case.

Pinned project shortcuts appear directly below the main `Projects` navigation
item. They should use the same shared button component, but with a smaller,
indented row so they read as children of Projects instead of top-level pages.
The project title should truncate on one line when long. The active pinned
project shortcut uses the active state when that project detail page is open.

## Bottom Controls

The bottom controls are not a card. Use a top border separator and compact
vertical spacing.

The bottom controls appear in this order:

- Theme mode menu item
- Sign out menu item

Theme mode and sign out should use the same visual style as navigation menu
items. They should share the same left alignment and should not use a separate
switch control. Do not show the username in the sidebar.

## Brand

The brand row uses a Sparkles icon followed by `Arctic Aria`. The label uses the
same casing as the login page and should not be converted to all caps.

## Expandable Lists Near Sidebar Pages

Management pages opened from the sidebar should use shared panel and list
components. Panels inside the same page must not be forced to equal height by
the page grid; each panel should size to its content unless a feature
explicitly needs equal heights.

Expandable list items should keep their header row stable. The expand/collapse
indicator must stay at the far right of the header. Expanded details should be
appended below the header and must not push the indicator left.

The expanded area should share the same background color as the expanded list
item. Hover color should not create a mismatched block between the collapsed
header and appended details.
