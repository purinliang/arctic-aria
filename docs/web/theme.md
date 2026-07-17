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

## Neutral Scale

The web app should use one restrained neutral scale as the default palette for
both light and dark mode. The scale does not need to be mathematically pure
grey; a slightly cool or warm neutral is acceptable when it improves the Arctic
Aria visual direction. The important rule is that the app uses one coherent
scale instead of mixing unrelated grey families.

The concrete shared scale lives in `apps/web/src/app/globals.css` as
`--aa-grey-0` through `--aa-grey-63`. Step `0` is black, step `63` is white, and
the steps should stay equal distance from each other. Shared color helpers
should use those variables for normal app chrome so changing the scale does not
require editing every component.

Design and tune the light-mode scale first. Light mode should define the
intended relationship between page background, surfaces, headers, borders,
icons, supporting text, and main text. Dark mode should then reverse those
roles from the same scale: light surfaces become dark surfaces, dark text
becomes light text, and middle neutral steps keep similar visual distance from
their surrounding surfaces. Do not collapse page background, sidebar, cards,
panels, inputs, and headers into one pure black surface; dark mode should keep
the same visible hierarchy that light mode has.

Current core surface mapping:

- light page background: `--aa-grey-60`
- light card and panel header: `--aa-grey-61`
- light card, panel, sidebar, and input content: `--aa-grey-63`
- light main text, titles, descriptions, and normal icons: `--aa-grey-0`
- light supporting text, supporting icons, borders, and dividers:
  `--aa-grey-6`
- light hover background: 36 steps deeper than the base surface, with reversed
  text
- light selected background: 48 steps deeper than the base surface, with
  reversed text
- dark page background: `--aa-grey-0`
- dark card and panel header: `--aa-grey-3`
- dark card, panel, sidebar, and input content: `--aa-grey-4`
- dark main text, titles, descriptions, and normal icons: `--aa-grey-63`
- dark supporting text, supporting icons, borders, and dividers:
  `--aa-grey-57`
- dark hover background: 36 steps lighter than the base surface, with reversed
  text
- dark selected background: 48 steps lighter than the base surface, with
  reversed text

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

Do not use blue-grey palettes such as `slate-*` for normal UI chrome. Reserve
semantic colors such as red, green, amber, cyan, or blue for status, validation,
brand identity, or clearly meaningful feature states.

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
