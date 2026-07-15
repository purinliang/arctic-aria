# Web UI Components

This document defines shared UI component families for the web app. New web UI
must use these components first. If a page needs a new repeated pattern, add or
extend a component in the shared UI library before implementing one-off styling.

Shared components live in:

```text
apps/web/src/components/
```

## Color

`color.ts` owns reusable color and border class helpers.

Use it for:

- shared surface colors
- muted text colors
- section borders
- dividers
- reusable semantic tones such as blue, amber, cyan, emerald, neutral, and red

Do not hard-code repeated color combinations in feature pages.

## Theme

`theme.ts` owns shared app-shell theme values and document background syncing.

Use it for:

- the root app shell background and foreground classes
- root CSS variable updates for browser overscroll background
- shared light and dark app-level theme color values

Feature pages should not write root CSS variables directly. App surfaces should
call the shared theme helper and pass `darkMode` into shared UI components.

## Text

`text.tsx` owns shared text styles and message components.

Use it for:

- page titles
- section titles
- descriptions
- helper/supporting text
- input labels
- inline validation messages

Placeholder text belongs to the input component API, but it should follow the
same plain English style as other helper text.

## Button

`button.tsx` owns shared button styling.

Buttons support:

- primary actions
- secondary actions
- ghost/icon actions
- success actions
- text, icon, or text plus icon
- loading state
- disabled state

Feature pages should not define local button class helpers.

## Input Field

`input-field.tsx` owns text inputs, number inputs, date inputs, time inputs,
password inputs, and text areas.

Date and time inputs should use explicit English labels and helper text. Browser
date pickers may still follow the user's device locale, so the app should not
depend on picker-localized text for meaning.

Input fields support:

- labels
- optional markers
- helper text
- validation errors
- trailing controls such as password visibility buttons

## Switch

`switch.tsx` owns binary toggle controls.

Use it for settings that can be turned on or off, such as theme mode. Do not
build one-off toggle switches inside feature pages.

Do not use a switch in the sidebar theme row. Sidebar actions should use the
same menu-item button style as navigation items.

## Panel

`panel.tsx` owns page panels: the main content blocks inside pages, dashboards,
and management views.

Panels should keep outer border, background, and page-level surface styling
consistent. Page title bars, menu bars, and global navigation are not panels.

Panel spacing should be controlled by the panel and the immediate layout, not
recreated independently in each feature page.

Desktop pages that use a left detail area and a right metadata panel should use
the same split pattern: flexible left panel plus fixed `24rem` right panel. If
the available width cannot keep the left panel at least 20% wider than the
right panel, stack the panels vertically. Use the shared CSS classes
`aa-split-container`, `aa-split-panel`, and `aa-split-panel-sidebar`; they switch
to two columns only when the container is at least `53rem` wide. The split
controls width only; left and right panels keep independent content-driven
heights and should not be stretched to match each other.

## Card

`card.tsx` owns compact card structure.

Cards may include:

- shared card surface and border styling
- icon
- title
- description
- metadata
- optional title action with text, icon, or both

Use `CardHeader` for card and panel headers that need an icon, title,
description, metadata, or a right-side action. Do not create feature-local
header components for the same shape.

Use cards for repeated compact objects. Do not use cards as page sections or as
containers around other cards.

## List

`list.tsx` owns list wrappers and list items.

Use it for:

- management lists
- dashboard lists
- repeated selectable rows
- list dividers

List items should keep horizontal padding, vertical rhythm, hover state, and
selected state consistent.

Use `ExpandableListItem` for rows that open details. The header row and expanded
details must be rendered inside the same list item so the background, padding,
and divider behavior stay consistent. Do not place expanded details in a
separate grey box or sibling container below the item.

## Dialog

`dialog.tsx` owns dialog shells and confirmation dialogs.

Use it for:

- add dialogs
- edit dialogs
- delete confirmations
- loading dialogs when a blocking state is necessary

Dialogs are stronger than notifications. Use dialogs when the user must make a
decision or when the current workflow cannot safely continue.

## Notification

`notification.tsx` owns non-blocking notifications.

Use notifications for optimistic command failures and other non-blocking status
messages.

The shared `useNotifications` hook owns app-level notification state and helper
commands such as error and info notifications. Feature-specific code should
receive notification callbacks from the app shell instead of owning a separate
notification stack.

Placement:

- desktop: bottom-right
- mobile and tablet: bottom-center

Notifications should be visually lighter than dialogs and should not block the
current workflow.

## Tags

`tag.tsx` owns small status and category labels.

Use tags for:

- category labels
- status labels
- pinned markers
- reminder state labels

Do not repeat tag color classes in feature pages.
