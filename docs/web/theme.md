# Web Theme

This document describes shared web theme behavior. Component-level styling
rules live in [ui-components.md](ui-components.md), and sidebar placement rules
live in [sidebar.md](sidebar.md).

## Ownership

Theme is app-shell behavior, not Dashboard behavior and not feature-page
behavior.

The root auth gate and authenticated app shell own:

- loading browser/system defaults
- persisted user preference state, with local fallback
- resolved light or dark mode
- root page background
- root CSS variable synchronization for browser overscroll background
- passing `darkMode` into shared UI components

Feature pages should not write root CSS variables directly. They should receive
theme state from the app shell and pass it into shared components.

Color values and reusable palette classes belong in `apps/web/src/components/`
helpers such as `theme.ts` and `color.ts`. Auth, Settings, Dashboard, and
feature components must not own their own palette decisions.

## Preference Loading

`apps/web/src/app-shell/app-preferences.ts` owns browser/system preference
loading for app-level defaults:

- system light/dark mode
- browser language detection
- browser timezone detection

The file also owns local fallback preference state. After login, the app loads
the user's persisted settings and applies them over the browser/device fallback.

The current theme preference options are:

- `system`: follow the browser or operating-system color scheme
- `light`
- `dark`

The resolved theme mode is what rendering receives. Rendering helpers should
not read browser settings directly.

## Default Appearance

System theme is the first fallback preference default. If browser/system theme
cannot be read, fall back to light mode because daytime mode is currently the
strongest visual direction for Arctic Aria.

The page background should stay consistent while loading, signing in, and using
authenticated pages. Loading, auth, 404, and app-shell screens should share the
same Arctic Aria brand direction.

## Color Tokens

The web app uses Radix-style generated color scales as the base palette:

- `--blue-*` for the Arctic Aria accent scale
- `--gray-*` for neutral app chrome
- alpha variants such as `--blue-a*` and `--gray-a*` when a future component
  needs translucent role colors

The current palette is generated from the Radix custom palette tool with light
accent `#3D4561` and dark accent `#12276E`. The copied tokens live in
`apps/web/src/app/globals.css`, including sRGB fallbacks and P3 `oklch` /
`color(display-p3 ...)` values.

Feature and shared component code should not reference raw Radix step tokens
directly unless a new shared role is being designed. Normal UI should use the
semantic Arctic Aria aliases:

- `--aa-color-page`
- `--aa-color-surface`
- `--aa-color-header`
- `--aa-color-control`
- `--aa-color-control-muted`
- `--aa-color-border`
- `--aa-color-border-strong`
- `--aa-color-text`
- `--aa-color-muted`
- `--aa-color-inverse-text`
- `--aa-color-primary`
- `--aa-color-primary-hover`
- `--aa-color-primary-muted`
- `--aa-color-primary-muted-text`
- `--aa-color-hover`
- `--aa-color-selected`
- `--aa-color-selected-hover`
- `--aa-color-focus`

Light and dark modes both keep Radix's intended hierarchy: background steps are
subtle, interactive and border steps are stronger, solid accent steps are used
for primary or selected controls, and high steps are used for readable text.
Do not reintroduce a custom numeric grey scale such as `--aa-grey-*`.

Use shared component color helpers for these roles:

- page background
- panel and card surface
- card header surface
- border and divider
- main text
- label text
- description and supporting text
- icon text
- hover and active row backgrounds
- disabled controls

Do not use Tailwind palettes such as `slate-*`, `neutral-*`, `white`, or `black`
for normal UI chrome. Reserve semantic colors such as red, green, amber, cyan,
or blue for status, validation, brand identity, or clearly meaningful feature
states. Translucent black remains acceptable for modal and mobile-sidebar
backdrops.

## Dark Mode

Dark mode is an account setting for logged-in users and a local fallback setting
before login.

Dark mode should update the browser pull-down and pull-up overscroll background
so mobile browsers do not reveal an inconsistent light background behind the
app shell.

The logged-in user's saved theme preference overrides local/browser defaults. If
the user setting is missing or unavailable, fall back to the local/browser
preference resolution.

## Auth Page Theme Action

The signed-out auth page should support light and dark rendering. Its theme
button changes the same local theme preference used by the authenticated app
shell.

## Sidebar Theme Action

The sidebar theme action is a menu-style row. Do not use a switch inside the
sidebar. The theme row should align visually with other sidebar menu items.

Detailed sidebar placement is documented in [sidebar.md](sidebar.md) and
[sidebar-ui.md](sidebar-ui.md).
