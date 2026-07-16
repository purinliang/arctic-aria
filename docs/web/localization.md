# Web Localization

This document describes the planned web localization direction. It is not a
full Chinese UI implementation yet.

## Preference Ownership

`apps/web/src/app-shell/app-preferences.ts` owns browser/system defaults for:

- browser language
- browser timezone
- system light/dark mode

The current app can detect whether the browser language looks Chinese, but the
active UI language remains English because Chinese message catalogs are not
implemented yet.

When persisted Settings exist, the logged-in user's language setting should
override browser language. If the user setting is missing or unavailable, fall
back to browser language. If the browser language is unsupported, fall back to
English.

## Message Catalog Direction

Do not hard-code translated strings in feature components once localization
starts.

Prefer feature-scoped TypeScript message catalogs with one central lookup layer
instead of one giant global JSON file. This keeps text near the feature that
uses it while still making the active language manageable.

Recommended future shape:

```text
apps/web/src/messages/
|-- shared.en.ts
|-- shared.zh-CN.ts
`-- index.ts

apps/web/src/features/projects/messages/
|-- en.ts
`-- zh-CN.ts

apps/web/src/features/memories/messages/
|-- en.ts
`-- zh-CN.ts
```

Feature components should receive or import a stable message object for their
feature. Shared UI components should stay mostly text-agnostic; callers pass
labels, descriptions, and button text into them.

JSON files can be considered later if translation is managed by an external
tool. For now, TypeScript catalogs are safer because keys can be typed and
reviewed with normal code changes.

## Current Status

Implemented:

- browser language detection
- English-only language selector in Settings

Not implemented:

- Chinese message catalogs
- persisted user language settings
- timezone-based date/time formatting policy
- automatic translation of user-generated content
