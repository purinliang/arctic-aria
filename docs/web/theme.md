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

## Neutral Grey Scale

The web app should use a neutral grey scale as the default palette for both
light and dark mode. Think of the scale as roughly 16 steps from black to white:
step `0` is black, step `15` is white, and the middle steps are light, mid, and
deep greys.

Light mode uses the white end of the scale for surfaces and the black end for
text. Dark mode reverses the same roles: black surfaces and white text. Middle
greys should keep similar visual distance from the active surface in both
themes.

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
