# Web Theme

This document describes shared web theme behavior. Color tokens and component
color usage live in [color.md](color.md). Component-level styling rules live in
[ui-components.md](ui-components.md), and sidebar placement rules live in
[sidebar.md](sidebar.md).

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

Color values and reusable palette classes belong in shared theme and color
helpers. Auth, Settings, Dashboard, and feature components must not own their
own palette decisions.

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

## Color

Color tokens, component color mappings, and current color inconsistencies are
documented in [color.md](color.md).

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
