# Sidebar UI

This document describes user-visible sidebar details for the web app. Product
placement rules are documented in [sidebar.md](sidebar.md).

## Desktop

Use a fixed-width left sidebar. The sidebar should stay visually independent
from page panels and should not share the right page's height.

The page area starts to the right of the sidebar and keeps its own max width.
The sidebar should not look like another page panel.

## Mobile

Use the hamburger button only on mobile and tablet-sized viewports. The opened
sidebar overlays the page and can be dismissed by clicking the overlay or the
close button.

## Navigation Items

Navigation items use the shared button component. Active items use the primary
state. Inactive items use the ghost state.

When a feature is not implemented, clicking its item shows the shared
notification component. Do not use a dialog for this case.

## Bottom Controls

The bottom controls are not a card. Use a top border separator and compact
vertical spacing.

The bottom controls appear in this order:

- Dark mode row with switch
- Sign out button
- Current user display name

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
