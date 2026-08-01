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

`color.ts` owns reusable color and border class helpers. Color tokens,
component color mappings, and known inconsistencies are documented in
[color.md](color.md).

Use it for:

- shared surface colors
- muted text colors
- section borders
- dividers
- reusable semantic tones, currently neutral, blue, emerald, and red

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
- composable text stacks in rows, panels, dialogs, and Design review pages

Use `Text` when a component needs a specific composition of size, weight, tone,
line-height, element, or truncation. Supported sizes are `xs`, `sm`, `md`, `lg`,
`xl`, and `page`. Supported weights are `light`, `normal`, `medium`, and
`semibold`. Supported tones are `primary`, `secondary`, `inverse`, and
`current`.

Use `TextStack` for reusable title, description, and supporting metadata
rhythm. Use `ListItemTextStack` for list rows.

Placeholder text belongs to the input component API, but it should follow the
same plain English style as other helper text.

Use `LabelText` for static field labels. Use `DescriptionText` for descriptive
body copy. Use `SupportingText` for supporting metadata lines; it should keep
the same muted visual family and line height direction as descriptions, but one
size smaller. Supporting metadata should usually be a single `A · B · C` line.
Feature rows should not hand-code label, description, or metadata font size,
line height, or muted color.

## Spacing

`spacing.ts` owns reusable class constants for shared padding, margin, and gap
tokens.

Use spacing helpers for repeated chrome:

- page, panel, section, subsection, and body stacks
- list row and compact manager row padding
- card header and body padding
- dialog and popover padding
- table-like cell padding
- tag padding
- title-description and description-supporting text gaps
- inline, control, and icon gaps

Do not tokenize one-off geometry such as fixed max-widths, grid templates,
z-index, animation distances, artwork sizes, or absolute positioning.

## Content Section

`content-section.tsx` owns unframed content sections and subsections that sit at
the same visual level as panels.

Use `ContentSection` for a page-level block with a title, optional description,
optional right-side action, and body content. Use `ContentSubsection` inside
that block for smaller titled groups. These components should not add panel
borders, card backgrounds, or nested-card styling; they structure content that
already lives on the page surface, such as Design review pages.

Use them when a surface needs title plus description rhythm but is not a panel,
dialog, form section, or list row.

## Masked Text

`masked-text.tsx` owns read-only masked text display for values that should not
look editable, such as an external account id. Use it instead of a disabled
password input when the user can view or hide a value but cannot edit it.

Masked text should follow normal list-row height and button rhythm. It should
not introduce form-field label spacing unless it is used inside a real form.

## Button

`button.tsx` owns shared button styling.

Buttons support:

- primary actions
- secondary actions
- ghost, or borderless, icon and utility actions
- text, icon, or text plus icon
- loading state
- disabled state

Feature pages should not define local button class helpers.

The default button size is `sm`, used for normal panel, header, list, and row
actions. Main form actions, such as auth submit and CRUD save/delete buttons,
use `md`. Keep the semantic size names even when their pixel values are close,
so future design changes can tune button and form-control rhythm independently.

Button size roles:

- `sm`: normal buttons, panel-title actions, list-row actions, and choice-group
  buttons
- `md`: main form actions such as auth submit and CRUD save/delete actions, and
  taller navigation/menu rows when a surface needs larger scan targets
- `lg`: explicitly larger actions when a later design needs them
- `icon`: square icon-only actions

Create buttons in card or panel headers should use secondary styling and the
label `New` when the header title already names the object being created, such
as `Projects`, `Routines`, `Memories`, or `Milestones`. Do not use primary
styling for these header create buttons. Use a more specific label, such as
`New task`, only when the surrounding row or section does not already name the
created object clearly.

## Action Menu

`action-menu.tsx` owns compact menu popovers opened by icon-only action
buttons. Use it for command lists such as dialog header overflow actions. Action
menus should not show a title inside the popup, and rows should stay text-only
unless the menu has enough actions that icons materially improve scanning.

## Icon

Use `lucide-react` icons for normal UI icons when a suitable icon exists.
Feature UI docs may name exact Lucide icons when a repeated surface needs
consistent meaning, such as `Check` for project tasks or `ClipboardList` for
memories.

Use official brand artwork instead of Lucide for brand identities, such as the
Google sign-in placeholder icon.

## Scroll Area

`scroll-area.tsx` owns custom scroll behavior. Use it instead of feature-local
scrollbar state or feature-local hidden-scrollbar CSS.

Use `scrollbar="auto-hide"` only where a persistent scrollbar would distract
from the surface, such as the sidebar. Auto-hide mode hides the browser's native
scrollbar, shows a subtle shared thumb while the user scrolls, and hides the
thumb again after scrolling stops.

Use the default visible custom scrollbar for dropdowns, dialogs, lists, and page
content when the scrollbar helps the user discover overflow. Do not expose the
browser's native scrollbar in app-styled surfaces.

## Input Field

`forms/input-field.tsx` owns the appearance of single-line text inputs and
single-line password inputs.

Form rhythm:

- button heights: `sm` `36px`, `md` `40px`, `lg` `44px`
- text inputs, select triggers, and date/time picker triggers: `40px`
- icon-only buttons: `36px`
- label-to-control gap: `2px`
- normal field-group gap: `12px`
- form section gap: `18px`
- form actions should start `36px` after the field group
- actions inside the action area use the shared `12px` inline gap
- auth submit and CRUD save/delete buttons use the `40px` `md` height

Use tight field groups for repeated simple inputs. Use larger form sections
only when the form has meaningful groups, such as project basics versus
timeline, task basics versus metadata, or routine basics versus schedule and
recurrence.

Input fields support:

- labels
- optional markers
- placeholders
- trailing controls such as password visibility buttons
- clear field-level hint or error bubbles

Input field components must stay presentational. They should accept the current
visual state, bubble text, and bubble visibility from the caller, but they should
not decide validation rules or validation timing.

Text inputs, password inputs, text areas, number fields, and time picker typed
fields should keep the text-input background while hovered or focused. Their
focus state should change the existing border color instead of drawing an
outside ring. The focused border may become visually heavier inward, but it
must not add a second outline outside the control.

Selection inputs and date/time picker triggers are button-like form controls
because they open another surface. They may use button-like hover treatment, but
their focus state should still be expressed through the existing border, not an
outside ring.

Choice groups are action choices, not text-entry controls. They use normal
`sm` button rhythm instead of text-input height. Selected color and border are
enough to communicate state; do not add a check icon unless a future component
variant explicitly needs one.

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
The calendar header should use short month names, and weekday labels must come
from the active localization messages. Longer formatted date strings outside
the picker may use the shared long date formatter when the surface needs the
weekday. Do not use native browser `type=date` controls for primary UI, because
the popup can follow the user's browser or operating-system locale and cannot
be styled consistently.

`forms/time-picker-field.tsx` owns time selection. It must render a compact
app-styled picker with one typed time field and AM/PM controls when the active
time-format preference is 12-hour, then return normalized `HH:mm` values. The
typed field should accept compact values such as `910` for `9:10` and 24-hour
values such as `19:30` for `7:30 PM`. Valid typed values and AM/PM toggles
should update the owning form immediately; do not require a separate confirm
button. Invalid in-progress text may stay local until it becomes a valid time.
Do not show an extra visible `Time` title inside the popover; the surrounding
form field owns the label.
When the popover opens, autofocus the typed time field and select its current
value so keyboard entry can start immediately. The typed field placeholder
should show example formats, such as `9:30PM or 21:30`.
When no value exists, the picker defaults to the current time plus 15 minutes,
rounded up to the next 15-minute boundary. Do not use native browser
`type=time` controls for primary UI and do not use a long scroll list or
quick-minute button strip for routine time selection.
The visible time trigger should place the clock icon on the left and, when a
saved value is present, a borderless clear icon button on the right. The time
picker popover should show the typed time field on the first row without a
duplicated icon or clear button. In 12-hour mode, the second row should contain
`AM` and `PM` buttons using normal button height, not input-field height. Do
not show a `Confirm` action and do not show a preview/description row for noon,
midnight, morning, evening, or night. Do not render a separate clear row.
Pressing Enter or the mobile keyboard confirm key inside the typed time field
should close only the picker popover and must not submit the surrounding
add/edit dialog.

Date picker trigger controls should place the calendar icon on the left. The
date picker clear action is an inline borderless icon button inside the date
trigger value area on the right, and only appears when a saved value is present.
Do not render a separate clear row below the calendar grid.

Clicking or double-clicking unrelated empty space inside a date or time picker
popover, including blank calendar cells and grid gaps, should not dismiss the
popover or blur/reset the time picker draft. Picker popovers close through
explicit picker controls, outside clicks, or intended keyboard dismissal.
Re-clicking or double-clicking the time picker trigger while its popover is
already open should keep it open.

Date and time pickers are still controlled form components. Feature code owns
the current value, validation rules, and validation timing. Picker popovers
should render as absolute overlays inside the field wrapper with stable widths
and normal, even padding on all four edges so opening them does not change the
parent card, dialog, list item, or field layout. The closed picker trigger
should use the bordered secondary button role, not normal input text styling.
It should keep the same text and icon color whether it is empty, placeholder
text, defaulted, or selected; text and icon color changes are reserved for
hover, disabled, and error states. Focus should change the border only. Do not
render picker popovers through a viewport portal unless there is a specific
clipping bug that cannot be solved in the dialog/layout component.

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
colors while avoiding parent `overflow-hidden` clipping. The opened menu should
have no outer padding and should match the trigger width; option rows own their
own internal padding.

When a single-select dropdown opens below the trigger, render options in their
normal order. When it opens above the trigger because there is not enough space
below, render options in reverse visual order so the first logical option stays
closest to the trigger and mouse position.

The closed select trigger should use the bordered secondary button role. It
should keep the same text and icon color whether it is empty or selected.
Empty placeholder wording can differ from selected text, but the trigger should
not visually change weight or color only because the user selected a value.

`forms/choice-group.tsx` owns visible button-group choices for single and
multiple selection. Use it when the user should clearly see a compact set of
choices. Do not use passive label chips as selectable buttons. Selected choices
should be indicated by color and border only; do not add a check icon to
selected choices.

Choice groups use normal button height when they behave like filters or simple
option buttons. Descriptive secondary text may increase the row height, but the
base rhythm should still come from the shared `sm` button height. Field labels
above choice groups should use shared `LabelText`, the same as input, select,
date picker, and time picker labels.

## Switch

`switch.tsx` owns binary toggle controls.

Use it for settings that can be turned on or off, such as theme mode. Do not
build one-off toggle switches inside feature pages.

Do not use a switch in the sidebar theme row. Sidebar actions should use the
same menu-item button style as navigation items.

## Tabs

`tabs.tsx` owns tabbed page switching controls.

Use it when a page contains several peer review surfaces inside the same route,
such as the developer-only Design page. Tabs are page-local state, not sidebar
navigation, and should switch content without changing the browser path unless
a feature explicitly needs route-backed tabs.

Tabs use the same inset rounded background first used by the auth
login/register selector. Use normal `sm` button height unless a feature has a
documented reason for taller tabs.

## Settings Control Row

`settings-control-row.tsx` owns setting-style control rows that pair label and
supporting text on the left with one control or value area on the right.

Use it for settings-like configuration rows wherever they appear, including
Settings itself and developer-only review surfaces such as Design. The component
is shared because the row pattern is not owned by the Settings feature.

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
the same split pattern: flexible left panel plus fixed `20rem` right panel. If
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

Card and panel headers should use the shared card-header padding token, a
bottom border, and a subtle header background that differs from the content
surface. Header descriptions use supporting-text weight because they explain the
title rather than acting as body copy.

Header icons should use the same foreground color as the header title. Do not
style header icons as muted/supporting text; muted color is reserved for
descriptions, metadata, and helper copy.

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
selected state consistent. The shared `ListItem` owns list-row padding. Feature
rows should not hand-code first/last padding.

List dividers use the weaker list-divider border role, not the stronger panel
outline border. Panel borders should remain visually stronger than dividers
between rows.

For normal title, main-content, and supporting-metadata rows, use
`ListItemContent` with its `title`, `main`, and `support` slots, or use
`ListItemTextStack` when the row is a simple title, description, and supporting
metadata composition. Use `ListItemTitle`, `ListItemDescription`, and
`ListItemSupportingText` inside custom slot content. Feature rows should not
hand-code list title, description, or metadata font size, weight, line height,
muted color, or local `mt-*` spacing. `ListItemContent` owns the vertical
relationship between the slots, and the list text components own the compact
multiline rhythm.

Empty states, overview copy, form help, and dialog body text are not list rows.
Use `DescriptionText` or `SupportingText` for those surfaces instead of forcing
them into `ListItemTitle` or `ListItemContent`.

Use `ExpandableListItem` for rows that open details. The header row and expanded
details must be rendered inside the same list item so the background, padding,
and divider behavior stay consistent. Do not place expanded details in a
separate grey box or sibling container below the item.

## Paged List

`paged-list.tsx` owns pagination for long management lists. It composes the
shared `List` and `ListItem` primitives, so feature rows keep the same padding,
dividers, hover states, and text rhythm while the list renders only one page at
a time.

Use `PagedList` when a page or panel user-created list can naturally grow past
a short review length, such as routine definitions, routine instances, Event
definitions, Event instances, project tasks, projects, memories, and ideas. The
owning feature still decides which items belong in the list through filters or
grouping; `PagedList` only slices the already-filtered item array.

The footer uses compact ghost icon controls:

```text
[First] [Previous] [Page x / y] [Next] [Last]
```

The icon buttons are compact and borderless. The page count is text, not an
input or dialog trigger in the current UI.

When a surrounding filter changes, pass a reset key so the current page returns
to the first page. Do not use paged lists for compact dashboard panels that
intentionally show only today's top items.

Default page sizes:

- `6`: generated instance lists and dialog manager lists
- `8`: normal feature-page lists with taller rows
- `10`: full-width or primary single-panel lists with more vertical room

## Manager List

`manager-list.tsx` owns compact dialog-only management sections and rows. Use it
inside manager dialogs that list user-created supporting records, such as
Routine Groups, Event Groups, Project Milestones, and Memory Categories.

`ManagerDialogSection` aligns the section title on the left and the `New`
action on the right. `ManagerListRow` uses the same right-side action column, so
the header `New` action aligns with row-level actions such as `Edit`.

`ManagerList` should not look like a page panel list. It uses compact dialog
row padding and a dialog-form surface. It renders at most six rows per page by
default and uses the same compact icon pager as `PagedList` when needed.

## Optional Description Copy

User-authored description and objective fields should be optional unless a
feature document explicitly says otherwise. Title placeholders should stay simple
and direct, such as `Project title`, `Task title`, `Routine title`, or `Memory
title`.

Description/objective placeholders may use localized default description copy,
but the selected placeholder must be stable for that dialog open. Do not derive
the placeholder from the draft title while the user is typing.

When an edit dialog opens with an existing title and a missing saved
description/objective, use that title as the fixed placeholder seed so the
dialog placeholder matches the fallback copy shown in rows and overview panels.
For new dialogs without a title, choose a stable random seed when the dialog
opens.

When a saved optional description/objective is missing, rows and overview panels
may render localized fallback copy derived from a stable hash of the title. Blank
submissions should be normalized to `NULL` before persistence. This fallback is
display-only and must not be stored in the database.

## Dialog

`dialog.tsx` owns dialog shells and confirmation dialogs.

Use it for:

- add dialogs
- edit dialogs
- delete confirmations
- loading dialogs when a blocking state is necessary

Dialogs are stronger than notifications. Use dialogs when the user must make a
decision or when the current workflow cannot safely continue.

Dialog frames use the shared dialog padding token. Form dialogs should use the
default dialog width so input fields, date pickers, and other long controls do
not collapse into a narrow column. Use larger section spacing only when a form
has meaningful groups. Small confirmation dialogs may use the `sm` size. Wide
workflow dialogs that need side-by-side editing and preview, such as Project
Tree Template, may use the `lg` size. Dialog overlays must provide enough top
and bottom viewport padding and must allow vertical scrolling when form content is
taller than the viewport. Dialogs must not close when the user clicks the
semi-transparent overlay; close only through explicit close, cancel, save,
delete, or confirmation controls. Feature dialogs should use shared dialog
primitives instead of hand-rolling fixed overlay containers.

Dialog headers may include a compact action slot immediately left of the close
button. Use it for secondary dialog-level menus such as template tools or
less-frequent destructive actions. Keep the close button as the rightmost
control.

Add/edit form dialogs that save an entity and optionally delete it should use
`CrudEditorDialog`. Feature code supplies the fields, draft state, validation,
and action handlers; the shared dialog owns overlay, frame, header, full-width
save action, save pending text, field or section grouping, form-action spacing,
and optional delete action. Lower-level
`DialogOverlay`, `DialogFrame`, `DialogHeader`, `DialogActionRow`, and
`DialogPrimaryButton` remain available for dialogs that do not fit the standard
CRUD form shape.

Save and delete dialog actions should use text-only pending labels, not loading
icons. Full-width save buttons can use animated dots: `Saving.`, `Saving..`,
and `Saving...`. Auto-width delete confirmation buttons should use a static
pending label such as `Deleting...`; do not animate dots there because it can
make compact buttons feel jumpy. The visible icon and current text should keep
their natural width and stay centered together as one group. Do not show spinner
icons in add/edit/delete dialog action rows.

Use the shared `PendingText` primitive for action labels that animate dot
suffixes, such as signing in, signing up, saving, and signing out. Avoid it for
compact auto-width buttons.

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
