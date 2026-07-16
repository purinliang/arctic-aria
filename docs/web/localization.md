# Web Localization

This document describes the web localization direction and current translation
scope. It is not a full Chinese UI implementation yet.

## Preference Ownership

`apps/web/src/app-shell/app-preferences.ts` owns browser/system defaults for:

- browser language
- browser timezone
- system light/dark mode

The current app can detect whether the browser language looks Chinese. The
language selector can use browser language, English, or Simplified Chinese.

When persisted Settings exist, the logged-in user's language setting should
override browser language. If the user setting is missing or unavailable, fall
back to browser language. If the browser language is unsupported, fall back to
English.

## Message Catalogs

Do not hard-code translated strings in feature components once localization
starts.

Prefer feature-scoped TypeScript message catalogs with one central lookup layer
instead of one giant global JSON file. This keeps text near the feature that
uses it while still making the active language manageable.

Current shared catalogs:

```text
apps/web/src/messages/
|-- app-messages.ts
`-- languages.ts
```

Recommended future feature-catalog shape:

```text
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
- local language preference with `system`, `en`, and `zh-CN`
- typed shared app message catalogs
- translated auth loading, login, registration, and placeholder action text
- translated sidebar, page titles, Settings rows, and version labels

Not implemented:

- full feature-page translation for Projects, Routines, Memories, and Dashboard
- persisted user language settings
- timezone-based date/time formatting policy
- automatic translation of user-generated content
