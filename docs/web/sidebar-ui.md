# Sidebar UI

This document describes user-visible sidebar details for the web app. Product
placement rules are documented in [sidebar.md](sidebar.md).

## Desktop

Use a fixed-width left sidebar. The sidebar should stay visually independent
from page panels and should not share the right page's height.

The page area starts to the right of the sidebar and keeps its own max width.
The sidebar should not look like another page panel.

The right page content should have a minimum height of `110vh` on desktop.
This keeps the page scroll behavior visible and separate from the sidebar. On
mobile, use the visible viewport height instead of `110vh` so browser chrome
does not create excess blank height. The app shell also owns shared bottom
padding so feature pages do not add page-end spacing individually.

The sidebar should scroll internally when the viewport height is too small for
all sidebar content.

The sidebar scrollbar should be visually hidden by default. When the user
scrolls the sidebar, reveal a subtle scrollbar thumb and hide it again after
scrolling stops. Keep the track transparent and avoid a permanent native
scrollbar unless the browser forces one.

## Mobile

Use the hamburger button only on mobile and tablet-sized viewports. The opened
sidebar overlays the page and can be dismissed by clicking the overlay or the
close button.

When a mobile page title uses multiple rows, align the hamburger button to the
top title row instead of centering it against the full wrapped title area.

Browser overscroll background and dark-mode root colors are theme behavior,
documented in [theme.md](theme.md).

## Navigation Items

Navigation items use the shared button component. Active items use the primary
state. Inactive items use the ghost state.

When a feature is not implemented, clicking its item shows the shared
notification component. Do not use a dialog for this case.

Pinned project shortcuts appear directly below the main `Projects` navigation
item. The main `Projects` item keeps the folder icon. Pinned project shortcuts
do not show an icon; their text is indented inside a full-width menu button so
the response area stays the same as other sidebar items. The project title must
truncate on one line when long, with no horizontal scrollbar. The active pinned
project shortcut uses the active state when that project detail page is open.

## Sidebar Actions

Theme mode and sign out are not a separate bottom list. They appear in the same
sidebar list after Settings, below a separator line:

- separator line
- Theme mode menu item
- Sign out menu item

Theme mode and sign out should use the same visual style as navigation items.
They should share the same left alignment, icon slot, row height, hover state,
and active/disabled behavior. Do not use a separate switch control. Do not show
the username in the sidebar.

## Brand

The sidebar brand block appears at the top-left. It uses a stacked structure:
first row Sparkles icon plus compact localized brand text, then a larger
workspace label below. In English the brand text is `Arctic Aria`; in Simplified
Chinese it is `北极阿莉雅`. Both text lines use the normal app font. Keep it
left aligned with the navigation item content and do not use all-caps
conversion. The workspace label should be visually larger than the brand text.
Short labels such as `工作区` may render larger than English `Workspace` so the
sidebar hierarchy stays balanced. Keep the vertical gap between the brand row
and workspace row compact.

The mobile close button is a ghost icon button so it reads as a borderless
close affordance beside the brand row.

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
