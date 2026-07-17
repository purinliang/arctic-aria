# Web Color

This document defines the target web color roles. Theme preference loading
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

## Core Roles

The shared web UI should stay close to this small set of background and button
roles:

| Role family | Background token | Text token | Hover background token | Hover text token | Disabled background token | Disabled text token |
|---|---|---|---|---|---|---|
| Page | `--aa-page-bg` | use text roles | n/a | n/a | n/a | n/a |
| Panel | `--aa-panel-bg` | use text roles | `--aa-panel-hover-bg` | n/a | n/a | n/a |
| Panel header | `--aa-panel-header-bg` | use text roles | n/a | n/a | n/a | n/a |
| Primary button | `--aa-primary-button-bg` | `--aa-primary-button-text` | `--aa-primary-button-hover-bg` | `--aa-primary-button-hover-text` | `--aa-primary-button-disabled-bg` | `--aa-primary-button-disabled-text` |
| Secondary button | `--aa-secondary-button-bg` | `--aa-secondary-button-text` | `--aa-secondary-button-hover-bg` | `--aa-secondary-button-hover-text` | `--aa-secondary-button-disabled-bg` | `--aa-secondary-button-disabled-text` |

Text is independent from page and panel backgrounds:

| Text role | Token |
|---|---|
| Primary text | `--aa-primary-text` |
| Secondary/supportive text | `--aa-secondary-text` |

Light and dark mode should resolve the same role names to different values in
`globals.css`. Components should not need separate light-mode and dark-mode
class logic for normal color behavior. Components that share the same visual
role must reference the same token, so changing or renaming one role updates
all components mapped to that role.

## Current Alias Mapping

The current code still uses older aliases. Until the code is refactored, treat
these as the closest current equivalents:

| Target token | Current closest token |
|---|---|
| `--aa-page-bg` | `--aa-color-page` |
| `--aa-panel-bg` | `--aa-color-surface` |
| `--aa-panel-hover-bg` | `--aa-color-control-muted` |
| `--aa-panel-header-bg` | `--aa-color-header` |
| `--aa-primary-text` | `--aa-color-text` |
| `--aa-secondary-text` | `--aa-color-muted` |
| `--aa-primary-button-bg` | `--aa-color-primary` |
| `--aa-primary-button-text` | `--aa-color-inverse-text` |
| `--aa-primary-button-hover-bg` | `--aa-color-primary-hover` |
| `--aa-primary-button-hover-text` | `--aa-color-inverse-text` |
| `--aa-primary-button-disabled-bg` | not implemented; current code uses opacity |
| `--aa-primary-button-disabled-text` | not implemented; current code uses opacity |
| `--aa-secondary-button-bg` | `--aa-color-control` |
| `--aa-secondary-button-text` | `--aa-color-muted` |
| `--aa-secondary-button-hover-bg` | `--aa-color-control-hover` |
| `--aa-secondary-button-hover-text` | `--aa-color-text` |
| `--aa-secondary-button-disabled-bg` | `--aa-color-control-muted` for input-like controls; buttons not implemented |
| `--aa-secondary-button-disabled-text` | `--aa-secondary-text` for input-like controls; buttons not implemented |

## Component Mapping

| Component | Role |
|---|---|
| `surfaceClass` | Panel |
| `headerSurfaceClass` | Panel header |
| `controlGroupSurfaceClass` | Secondary button |
| `inputColorClass`, `formControlClass` | Secondary button |
| `toneClass`, `statusMessageClass` | Status tone exception |
| `mutedTextClass`, `dividerClass`, `sectionBorderClass` | No background role |
| `AppShell`, `appShellClass` | Page |
| `Sidebar` | Panel |
| `ArcticAriaLogo` | Inherits parent |
| `LoadingLine` | Inherits parent |
| `Panel` | Panel |
| `Card` | Panel |
| `CardHeader` | Panel header |
| `DialogOverlay` | Modal backdrop exception |
| `DialogBackdrop` | Inherits `DialogOverlay` |
| `DialogFrame`, `dialogFrameClass` | Panel |
| `DialogHeader`, `DialogActionRow` | Inherits `DialogFrame` |
| `DialogPrimaryButton` | Primary button |
| `ConfirmDialog` | Composed from `DialogFrame`, `Button`, and `DialogPrimaryButton` roles |
| `formControlPopupClass` | Panel |
| `Button` with `tone="primary"` | Primary button |
| `Button` with `tone="secondary"` | Secondary button |
| `Button` icon/menu utility presentation | Secondary button |
| `Button` with `tone="ghost"` | Secondary button visual role with borderless presentation |
| `Button` with `tone="success"` | Status tone exception |
| `SidebarItem` | Secondary button |
| Active `SidebarItem` | Primary button |
| `ListItem`, `ExpandableListItem` | Panel |
| Selected `ListItem` or expanded `ExpandableListItem` | Primary button in current code; review whether selected list items are still needed |
| `SingleChoiceGroup`, `MultipleChoiceGroup`, `ChoiceActionButton` option | Secondary button |
| Selected `SingleChoiceGroup`, `MultipleChoiceGroup` option | Primary button |
| `SelectInput` trigger | Secondary button |
| `SelectInput` option | Secondary button |
| Selected `SelectInput` option | Primary button |
| `CheckboxGroup` | Inherits parent |
| `DatePickerField` trigger | Secondary button |
| `DatePickerField` popup | Panel |
| `DatePickerField` day button | Secondary button |
| Selected `DatePickerField` day button | Primary button |
| `TimePickerField` trigger | Secondary button |
| `TimePickerField` popup | Panel |
| `TimePickerField` text input | Secondary button |
| `TimePickerField` period choice | Secondary button |
| Selected `TimePickerField` period choice | Primary button |
| `FieldLabel` | Inherits parent |
| `TextInput`, `PasswordInput`, `TextArea`, `NumberInput` | Secondary button |
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

## Current Inconsistencies

These are observations from the current shared components and should guide the
next color refactor:

- The code has too many color aliases. It should collapse toward the core role
  set above.
- Primary buttons currently use selected aliases in `Button`, which couples
  primary actions to active navigation and selected option states.
- Secondary buttons currently do not use an explicit secondary button
  background token.
- Some clickable input-like controls do not expose a hover background even
  though they behave as buttons.
- `CheckboxField` selected text is internally inconsistent because child label
  text overrides the selected parent text.
- Disabled states are inconsistent. Inputs have explicit disabled colors, while
  buttons and choices mostly rely on opacity.

## Rules

- Product buttons have two types: primary and secondary.
- Disabled primary and secondary buttons must use disabled button color tokens
  and must not expose hover colors.
- Do not create a new color role for every component.
- Selected, active, checked, and current states should reuse primary or
  secondary button roles unless a future design explicitly adds a separate
  selected-state role.
- Unselected interactive controls should reuse secondary button roles.
- Panels and cards should not invent local background or text colors.
- Feature pages must not use raw palette classes for normal UI chrome.
