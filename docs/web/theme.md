# Web Theme

This document describes shared web theme behavior. Component-level styling
rules live in [ui-components.md](ui-components.md), and sidebar placement rules
live in [sidebar.md](sidebar.md).

## Ownership

Theme is app-shell behavior, not Dashboard behavior and not feature-page
behavior.

The authenticated web app shell owns:

- daytime-first default theme
- dark mode state
- root page background
- root CSS variable synchronization for browser overscroll background
- passing `darkMode` into shared UI components

Feature pages should not write root CSS variables directly. They should receive
theme state from the app shell and pass it into shared components.

## Default Appearance

Daytime mode is the default because it is currently the strongest visual
direction for Arctic Aria.

The page background should stay consistent while loading, signing in, and using
authenticated pages. Loading, auth, 404, and app-shell screens should share the
same Arctic Aria brand direction.

## Dark Mode

Dark mode is a local web setting for now. It does not need database persistence
until the Settings feature is implemented.

Dark mode should update the browser pull-down and pull-up overscroll background
so mobile browsers do not reveal an inconsistent light background behind the
app shell.

## Sidebar Theme Action

The sidebar theme action is a menu-style row. Do not use a switch inside the
sidebar. The theme row should align visually with other sidebar menu items.

Detailed sidebar placement is documented in [sidebar.md](sidebar.md) and
[sidebar-ui.md](sidebar-ui.md).
