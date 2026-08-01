# Standardize Web Spacing And Typography Tokens

## Goal

Implement a compact shared spacing and typography system for the web app. The
system should standardize repeated padding, margin, gap, line-height, text
color, font size, and font weight decisions while keeping feature behavior and
data models unchanged.

The design should feel like a common dense productivity web app in English, and
it should leave a deliberate typography path for Simplified Chinese instead of
using one-off component overrides.

## Scope

- Add shared CSS tokens for typography size, line-height, font weight, text
  stack rhythm, list rows, cards, dialogs, popovers, tags, tables, panel stacks,
  and section stacks.
- Add language-aware typography tokens for English/default rendering and
  Simplified Chinese rendering.
- Add composable shared text primitives in `apps/web/src/components/text.tsx`.
- Keep existing wrapper components such as `PageTitle`, `SectionTitle`,
  `DescriptionText`, `LabelText`, and `SupportingText` as compatibility APIs
  over the new primitives.
- Add list-specific text stack helpers so feature rows can compose title,
  description, and supporting metadata without hand-coded text classes.
- Migrate shared UI components first, then feature pages that already use shared
  list, panel, card, dialog, and form patterns.
- Add Design review pages for Typography and Spacing in separate source files.
- Update shared web documentation for the new tokens and usage rules.

## Non-Goals

- Do not change product behavior, routes, persistence, server actions, database
  schema, or localization semantics.
- Do not tokenize one-off geometry such as fixed max-widths, grid templates,
  z-index values, animation distances, artwork sizes, or absolute positioning.
- Do not create feature-local text, spacing, or color systems.
- Do not add production-only Chinese copy rewrites. Chinese-specific behavior in
  this goal is limited to font family and line-height tokens.

## Typography Tokens

Use these product text sizes:

| Token | Size | Default line-height | Simplified Chinese line-height |
|---|---:|---:|---:|
| `xs` | `12px` | `16px` | `16px` |
| `sm` | `13px` | `18px` | `20px` |
| `md` | `14px` | `20px` | `22px` |
| `lg` | `16px` | `24px` | `26px` |
| `xl` | `18px` | `26px` | `28px` |
| `page` | `28px` | `34px` | `36px` |

Use these product font weights:

| Token | Weight |
|---|---:|
| `light` | `300` |
| `normal` | `400` |
| `medium` | `500` |
| `semibold` | `600` |

Use these text tones:

- `primary`: normal content and titles
- `secondary`: descriptions, helper text, metadata, inactive details
- `inverse`: text on primary action backgrounds
- `current`: inherit current text color for status-tone and nested contexts

Default English font family:

```text
Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
```

Simplified Chinese font family:

```text
Inter, "Noto Sans SC", "PingFang SC", "Microsoft YaHei", ui-sans-serif, system-ui, sans-serif
```

## Spacing Tokens

The first implementation should cover common repeated app rhythm:

| Token area | Purpose |
|---|---|
| Page stack | Vertical gap between page-level panels or blocks |
| Panel stack | Vertical gap inside normal panels |
| Section stack | Vertical gap between content sections |
| Subsection stack | Vertical gap between smaller content groups |
| Body stack | Normal inner body gap |
| Inline gap | Gap between inline controls or text/action pairs |
| Text title-desc | Gap between a title and description |
| Text desc-support | Gap between a description and supporting metadata |
| List row padding | Normal user-generated-content row padding |
| Compact list row padding | Dense manager rows and repeated settings rows |
| Card header/body padding | Normal compact card chrome |
| Dialog padding | Dialog header/body/action rhythm |
| Popover padding | Select, picker, and action menu surfaces |
| Table cell padding | Compact table-like rows |
| Tag padding | Status and metadata tags |

## Shared Primitives

Add or extend these shared primitives:

- `Text`: composable text with `as`, `size`, `weight`, `tone`, `leading`, and
  truncation support.
- `TextStack`: title, description, and support slots with tokenized gaps.
- `ListItemTextStack`: list-specific convenience wrapper for common row text
  combinations.

Existing text components should remain supported and should forward to the new
primitive system.

## Design Review Pages

Add separate files:

- `DesignTypographyPage.tsx`
- `DesignSpacingPage.tsx`

The Design page tabs should include:

- `Color`
- `Buttons`
- `Typography`
- `Spacing`

Typography previews should show size, weight, tone, and English/Chinese
multi-line rhythm. Spacing previews should show list rows, compact rows, card
header/body rhythm, dialog rhythm, popover rhythm, tags, and text stacks.

## Migration Order

1. Add CSS variables and helper classes.
2. Update shared text primitives and keep compatibility wrappers.
3. Update shared list, card, panel, dialog, manager-list, paged-list, settings
   control row, notification, tag, button, and form helper components.
4. Add Design Typography and Spacing pages.
5. Update shared web docs.
6. Run focused shared-component checks and full web checks.

## Validation

Run these checks before committing the implementation:

```bash
git diff --check
pnpm --dir apps/web exec node --test src/components/__tests__/*.test.ts src/components/forms/__tests__/*.test.ts
pnpm --dir apps/web test
pnpm --dir apps/web lint
pnpm --dir apps/web build
```

