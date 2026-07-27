# Web Color

This document defines the shared web color roles. Theme preference loading
remains documented in [theme.md](theme.md), and component structure remains
documented in [ui-components.md](ui-components.md).

## Ownership

Color decisions belong in shared web code:

- `apps/web/src/app/globals.css` owns the actual light and dark values.
- `apps/web/src/components/color.ts` owns reusable color and border helpers.
- Shared components own component-level color composition.

Feature pages must not create feature-local color systems. If a page needs a
new repeated color pattern, update the shared role system first.

Docs should use color tokens, not raw color values.

## Palette

The base palette uses generated Radix-style `blue` and `gray` scales:

- `blue-1` through `blue-12`
- `gray-1` through `gray-12`
- matching alpha, contrast, surface, indicator, and track tokens where useful

Light and dark mode define the same palette token names with different values.
Shared Arctic Aria roles then map those palette tokens to product UI behavior.

The `--aa-gray-*` intermediate tokens are narrow helper steps between adjacent
Radix gray values. They exist only to make panel, panel-hover, and panel-header
surfaces feel distinct without creating a separate color system.

## Core Roles

The shared web UI should stay close to this small set of background and button
roles:

| Role family | Background token | Text token | Border token | Hover background token | Hover text token | Hover border token | Disabled background token | Disabled text token | Disabled border token |
|---|---|---|---|---|---|---|---|---|---|
| Page | `--aa-page-bg` | use text roles | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| Panel | `--aa-panel-bg` | use text roles | use secondary button border | `--aa-panel-hover-bg` | n/a | n/a | n/a | n/a | n/a |
| Panel header | `--aa-panel-header-bg` | use text roles | use secondary button border | n/a | n/a | n/a | n/a | n/a | n/a |
| Primary button | `--aa-primary-button-bg` | `--aa-primary-button-text` | `--aa-primary-button-hover-bg` | `--aa-primary-button-hover-bg` | `--aa-primary-button-hover-text` | `--aa-primary-button-hover-bg` | `--aa-primary-button-disabled-bg` | `--aa-primary-button-disabled-text` | `--aa-primary-button-disabled-bg` |
| Secondary button | `--aa-secondary-button-bg` | `--aa-secondary-button-text` | `--aa-secondary-button-border` | `--aa-secondary-button-hover-bg` | `--aa-secondary-button-hover-text` | `--aa-secondary-button-hover-border` | `--aa-secondary-button-disabled-bg` | `--aa-secondary-button-disabled-text` | `--aa-secondary-button-disabled-border` |
| Text input | `--aa-text-input-bg` | `--aa-text-input-text` | `--aa-text-input-border` | `--aa-text-input-hover-bg` | `--aa-text-input-hover-text` | `--aa-text-input-hover-border` | `--aa-text-input-disabled-bg` | `--aa-text-input-disabled-text` | `--aa-text-input-disabled-border` |

Text is independent from page and panel backgrounds:

| Text role | Token |
|---|---|
| Primary text | `--aa-primary-text` |
| Secondary/supportive text | `--aa-secondary-text` |

Light and dark mode should resolve the same role names to different values in
`globals.css`. Components should not need separate light-mode and dark-mode
class logic for normal chrome behavior. Components that share the same visual
role must reference the same token, so changing or renaming one role updates
all components mapped to that role.

Secondary buttons have two presentations:

- Secondary button uses the secondary button tokens for its surface, text,
  border, hover, disabled, and disabled border colors.
- Secondary button (borderless) uses the same secondary button text, hover, and
  disabled tokens without drawing a border.

Do not create a separate color family for secondary button and secondary button
(borderless).

Typed text controls use text-input tokens for background, border, hover, focus,
placeholder, and disabled chrome. Their hover and focus backgrounds default to
the normal text-input background so typed fields do not look like hovered
buttons. Their focus state changes the existing border to
`--aa-text-input-focus-border` and may add inward border weight; do not add a
separate outside focus ring.

Button-like form controls, such as select triggers and picker triggers, use
secondary button tokens because they open a menu or picker instead of accepting
direct text entry.

## Component Mapping

| Component | Role |
|---|---|
| `panelColorClass` | Panel |
| `panelHeaderColorClass` | Panel header |
| `panelHoverContainerColorClass` | Panel hover container |
| `textInputControlColorClass`, `formControlClass` | Text input |
| `formButtonControlClass` | Secondary button-like input control |
| `toneClass`, `statusMessageClass` | Status tone exception |
| `secondaryTextColorClass` | Secondary text |
| `secondaryButtonDividerColorClass`, `secondaryButtonBorderColorClass` | Secondary button border |
| `AppShell`, `appShellClass` | Page |
| `Sidebar` | Panel |
| `ArcticAriaLogo` text | Inherits parent |
| `ArcticAriaLogo` icon asset | Fixed app icon colors |
| `LoadingLine` | Inherits parent |
| `Panel` | Panel |
| `Card` | Panel |
| `CardHeader` | Panel header |
| `DialogOverlay` | Modal backdrop exception |
| `DialogFrame`, `dialogFrameClass` | Panel |
| `DialogHeader`, `DialogActionRow` | Inherits `DialogFrame` |
| `DialogPrimaryButton` | Primary button |
| `ConfirmDialog` | Composed from `DialogFrame`, `Button`, and `DialogPrimaryButton` roles |
| `formControlPopupClass` | Panel |
| `Button` with `tone="primary"` | Primary button |
| `Button` with `tone="secondary"` | Secondary button |
| `Button` icon/menu utility presentation | Secondary button |
| `Button` with `tone="ghost"` | Secondary button (borderless) |
| `Button` with `tone="success"` | Status tone exception |
| Sidebar root | Panel header |
| `SidebarItem` | Secondary button |
| Active `SidebarItem` | Primary button |
| `ListItem`, `ExpandableListItem` | Panel |
| `ListItem`, `ExpandableListItem` hover | Panel hover |
| Selected `ListItem` or expanded `ExpandableListItem` | Primary button |
| `SingleChoiceGroup`, `MultipleChoiceGroup`, `ChoiceActionButton` option | Secondary button |
| Selected `SingleChoiceGroup`, `MultipleChoiceGroup` option | Primary button |
| `SelectInput` trigger | Secondary button-like input control |
| `SelectInput` option | Secondary button |
| Selected `SelectInput` option | Primary button |
| `CheckboxGroup` | Inherits parent |
| `DatePickerField` trigger | Secondary button-like input control |
| `DatePickerField` popup | Panel |
| `DatePickerField` day button | Secondary button |
| Selected `DatePickerField` day button | Primary button |
| `TimePickerField` trigger | Secondary button-like input control |
| `TimePickerField` popup | Panel |
| `TimePickerField` text input | Text input |
| `TimePickerField` period choice | Secondary button |
| Selected `TimePickerField` period choice | Primary button |
| `FieldLabel` | Inherits parent |
| `TextInput`, `PasswordInput`, `TextArea`, `NumberInput` | Text input |
| `FieldError` | Status tone exception |
| `CheckboxField`, `CheckboxControl` unchecked | Secondary button |
| `CheckboxField`, `CheckboxControl` checked | Primary button |
| `Switch` off | Secondary button |
| `Switch` on | Primary button |
| `PageTitle`, `SectionTitle`, `LabelText` | Inherits parent |
| `DescriptionText`, `SupportingText` | Inherits parent |
| `InlineMessage` | Status tone exception |
| `NotificationStack` | Inherits page; positions notification toasts |
| Notification toast | Status tone exception |
| Notification close button | Secondary button visual role inside status tone |
| `Tag` | Status tone exception |
| `VersionStatusSupport`, `VersionStatusRows` | Inherits parent |

## Exceptions

- Status, validation, and notification tones may use semantic status palettes.
  Supported status tones are neutral, amber, blue, cyan, emerald, indigo, lime,
  orange, pink, and red. The default status tone is neutral.
- Modal backdrops may use overlay colors instead of panel roles.
- Panel list hover states should use `--aa-panel-hover-bg`, not button hover
  roles, unless the row is actually a button.
- `--aa-panel-hover-bg` must stay visually weaker than
  `--aa-panel-header-bg` in both light and dark mode.
- Project title breadcrumb hover uses panel hover roles because it behaves like
  a title affordance rather than a normal product button.

## Rules

- Product buttons have two types: primary and secondary.
- Secondary button and secondary button (borderless) must use the same
  secondary button role tokens.
- Bordered secondary controls must use `--aa-secondary-button-border` for the
  normal outline and `--aa-secondary-button-hover-border` for the hover/focus
  outline. Do not use `--aa-secondary-button-hover-bg` as a border color.
- Disabled primary and secondary buttons must use disabled button color tokens
  and must not expose hover colors.
- Disabled primary and secondary buttons must not rely on opacity as their main
  disabled treatment.
- Disabled input controls should keep a visible secondary border while using
  disabled secondary background and text tokens.
- Do not create a new color role for every component.
- Selected, active, checked, and current states should reuse primary or
  secondary button roles unless a future design explicitly adds a separate
  selected-state role.
- Unselected interactive controls should reuse secondary button roles.
- Text inputs, password inputs, textareas, number inputs, and time picker typed
  fields should use text-input tokens while hovering, focusing, or typing.
- Text-input hover and focus backgrounds should not reuse button hover
  background tokens. Adjust `--aa-text-input-hover-bg` or
  `--aa-text-input-focus-bg` when a distinct text-entry effect is needed.
- Text-input focus should change the existing border color to the primary focus
  token, make the existing edge visibly stronger, and should not draw a
  separate outside blue ring.
- Select triggers, date picker triggers, and time picker triggers should use
  the secondary button-like input treatment.
- Shared app-styled form controls should opt out of the global outside focus
  outline. Normal command buttons may keep the global focus outline for keyboard
  accessibility.
- Input validation error borders should appear while the field is idle or
  blurred. While the app user is focused in the field, the control should use
  the normal text-input focus treatment so editing does not feel blocked by the
  error state.
- Panels and cards should not invent local background or text colors.
- Feature pages must not use raw palette classes for normal UI chrome.
