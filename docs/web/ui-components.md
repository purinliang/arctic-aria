# Web UI Components

This document defines shared UI component families for the web app. New web UI
must use these components first. If a page needs a new repeated pattern, add or
extend a component in the shared UI library before implementing one-off styling.

Shared components live in:

```text
apps/web/src/components/
```

Form controls live under:

```text
apps/web/src/components/forms/
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

User-visible theme behavior is documented in [theme.md](theme.md).

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

Use `LabelText` for static field labels. Use `DescriptionText` for descriptive
body copy. Use `SupportingText` for supporting metadata lines; it should keep
the same muted visual family and line height direction as descriptions, but one
size smaller. Supporting metadata should usually be a single `A · B · C` line.
Feature rows should not hand-code label, description, or metadata font size,
line height, or muted color.

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

Use button size `field` for inline form-row actions that must align with a
standard input, select, date picker, or time picker height. Do not hand-code
height classes locally for those actions.

Create buttons in card or panel headers should use secondary styling and the
label `New` when the header title already names the object being created, such
as `Projects`, `Routines`, `Memories`, or `Milestones`. Do not use primary
styling for these header create buttons. Use a more specific label, such as
`New task`, only when the surrounding row or section does not already name the
created object clearly.

## Icon

Use `lucide-react` icons for normal UI icons when a suitable icon exists.
Feature UI docs may name exact Lucide icons when a repeated surface needs
consistent meaning, such as `Check` for project tasks or `ClipboardList` for
memories.

Use official brand artwork instead of Lucide for brand identities, such as the
Google sign-in placeholder icon.

## Input Field

`forms/input-field.tsx` owns the appearance of single-line text inputs and
single-line password inputs.

Input fields support:

- labels
- optional markers
- placeholders
- trailing controls such as password visibility buttons
- clear field-level hint or error bubbles

Input field components must stay presentational. They should accept the current
visual state, bubble text, and bubble visibility from the caller, but they should
not decide validation rules or validation timing.

Required-empty messages, such as `Username can't be empty.`, are submit/form
logic. They should appear only after the user clicks the relevant confirm,
login, or save button. Other field rules, such as length, allowed characters, or
password match, may be checked while typing by the owning feature or form logic.

Date, time, number, select, and text-area controls should be separate form
control components instead of being treated as generic input fields.

## Date And Time Pickers

`forms/date-picker-field.tsx` owns date selection. It must render an app-styled
calendar popup with month and year navigation. The day grid must reserve six
weeks so months with five and six visual rows do not change the picker height.
Month names and weekday labels must come from the active localization messages.
Do not use native browser `type=date` controls for primary UI, because the
popup can follow the user's browser or operating-system locale and cannot be
styled consistently.

`forms/time-picker-field.tsx` owns time selection. It must render a compact
app-styled picker with one typed time field and AM/PM controls when the active
time-format preference is 12-hour, then return normalized `HH:mm` values. The
typed field should accept compact values such as `910` for `9:10` and 24-hour
values such as `19:30` for `7:30 PM`. While the popover is open, edits stay in a
local draft until the user clicks `Confirm`. Do not show an extra visible
`Time` title inside the popover; the surrounding form field owns the label.
Before confirmation, show a preview with the normalized time and a capitalized
day period, such as `12:30 AM Midnight`, `09:30 PM Night`, or `21:30 Night`.
When no value exists, the picker defaults to the current time plus 15 minutes,
rounded up to the next 15-minute boundary. Do not use native browser
`type=time` controls for primary UI and do not use a long scroll list or
quick-minute button strip for routine time selection.
The action buttons should be vertical and full width: `Confirm` first, then
`X Clear Time` when a clear action is available.

Date and time pickers are still controlled form components. Feature code owns
the current value, validation rules, and validation timing. Picker popovers
should render as absolute overlays inside the field wrapper with stable widths
so opening them does not change the parent card, dialog, list item, or field
layout. Do not render picker popovers through a viewport portal unless there is
a specific clipping bug that cannot be solved in the dialog/layout component.

Visible time strings outside the picker must use the same shared time formatter
and the user's time-format preference. Do not render raw stored `HH:mm` strings
directly in feature rows.

## Number, Text Area, And Selection Fields

`forms/number-field.tsx` owns numeric input styling. Use it when a number must
still be typed.

`forms/text-area-field.tsx` owns multi-line text entry. Do not implement text
areas as expanded single-line inputs.

`forms/selection-field.tsx` owns app-styled single-select dropdowns, checkbox
rows, and checkbox groups. Single-select dropdowns should use the same rounded
absolute popover surface as date and time pickers. Do not rely on native
`select` popup styling for primary UI, because the opened menu can inherit
browser or operating-system colors, corners, and spacing.

Single-select dropdowns may render their opened menu through a viewport portal
when the field sits inside a clipped list or panel. The portal should preserve
the same rounded popover surface, font size, option spacing, and dark-mode
colors while avoiding parent `overflow-hidden` clipping.

`forms/choice-group.tsx` owns visible button-group choices for single and
multiple selection. Use it when the user should clearly see a compact set of
choices. Do not use passive label chips as selectable buttons. Selected choices
should be indicated by color and border only; do not add a check icon to
selected choices.

Choice groups may use normal button height when they behave like filters or
compact option buttons. They should use input-field height only when they are
visually replacing a form input in a form row.

## Switch

`switch.tsx` owns binary toggle controls.

Use it for settings that can be turned on or off, such as theme mode. Do not
build one-off toggle switches inside feature pages.

Do not use a switch in the sidebar theme row. Sidebar actions should use the
same menu-item button style as navigation items.

## Loading

`loading.tsx` owns shared loading indicators. List, panel, and card loading rows
should use `LoadingLine` with a spinning progress circle instead of plain
loading text. Empty states can remain simple text.

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
header components for the same shape. Header action placement, including the
top and right inset for buttons, belongs to `CardHeader`; feature code should
only pass the action component.

Card and panel headers should use `px-4 py-3`, a bottom border, and a subtle
header background that differs from the content surface. The tighter vertical
padding keeps dashboard and management cards compact.

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

Dialog frames use the same `px-4 py-4` padding rhythm as notifications. Form
dialogs should use the default dialog width so input fields, date pickers, and
other long controls do not collapse into a narrow column. Small confirmation
dialogs may use the `sm` size. Dialog overlays must provide enough top and
bottom viewport padding and must allow vertical scrolling when form content is
taller than the viewport. Feature dialogs should use the shared `DialogOverlay`,
`DialogBackdrop`, `DialogFrame`, and `DialogHeader` pieces instead of
hand-rolling fixed overlay containers.

Add/edit form dialogs should use `DialogActionRow` and `DialogPrimaryButton`
for the save action. The primary save button should be full width with clear
top spacing, matching the login submit button pattern. Secondary destructive
actions may appear below it with secondary styling.

## Notification

`notification.tsx` owns non-blocking notifications.

Use notifications for optimistic command failures and other non-blocking status
messages.

The shared `useNotifications` hook owns app-level notification state and helper
commands such as error, info, and success notifications. Feature-specific code
should receive notification callbacks from the auth gate or app shell instead
of owning a separate notification stack.

Placement:

- desktop: bottom-right
- mobile and tablet: bottom-center

Notifications should be visually lighter than dialogs and should not block the
current workflow.

Notifications should animate as a stack: a new notification pops up from the
bottom, existing notifications move upward with the stack, and dismissed or
overflow notifications fade upward before they are removed.

## Label Chips

Avoid visible colored label chips in the current web UI. They have proven too
distracting for project status, task status, memory category, pinned markers,
and reminder state labels.

Use quieter alternatives:

- muted text for passive category/status metadata
- shared buttons or choice groups for selectable filters
- shared notifications for transient state feedback

Do not add feature-local colored chip classes. If label chips return later,
revise this section first and keep them as a shared primitive.
