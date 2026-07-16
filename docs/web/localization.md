# Web Localization

This document describes the web localization direction and current translation
scope. Simplified Chinese exists as an opt-in, machine-translated, incomplete
interface while the app continues to default to English.

## Preference Ownership

`apps/web/src/app-shell/app-preferences.ts` owns browser/system defaults for:

- browser language
- browser timezone
- system light/dark mode

The current app can detect whether the browser language looks Chinese, but
English remains the default when no user preference exists. The language
selector can use English, `简体中文`, or system setting. The `简体中文` option label
should stay clean; show the incomplete machine-translation warning as supporting
text below the selector instead of inside the option label. In the web app,
system language resolution currently reads browser language settings.

When persisted Settings exist, the logged-in user's language setting should
override browser language. If the user setting is missing or unavailable, fall
back to English. If the user explicitly chooses system language and the browser
language is unsupported, fall back to English.

## Message Catalogs

Do not hard-code translated strings in feature components once localization
starts.

Prefer feature-scoped TypeScript message catalogs with one central lookup layer
instead of one giant global JSON file. This keeps text near the feature that
uses it while still making the active language manageable.

Current shared catalogs:

```text
apps/web/src/messages/
|-- action-result.ts
|-- app-messages.ts
|-- dashboard-messages.ts
|-- form-messages.ts
|-- languages.ts
|-- memory-messages.ts
|-- project-messages.ts
`-- routine-messages.ts
```

Feature components should receive a stable message object for their feature.
Shared UI components should stay mostly text-agnostic; callers pass labels,
descriptions, aria labels, button text, and empty states into them.

If the catalogs grow too large, split them by feature while keeping one central
lookup layer:

```text
apps/web/src/features/<feature>/messages/
|-- en.ts
`-- zh-CN.ts
```

JSON files can be considered later if translation is managed by an external
tool. For now, TypeScript catalogs are safer because keys can be typed and
reviewed with normal code changes.

## Action Results

Backend actions may keep English messages for diagnostics and fallback display.
Expected failures that can reach the UI should also return a stable result
`code`, such as `project_deadline_date_missing` or `auth_invalid_credentials`.
Frontend code should translate that code with `localizedActionMessage` and fall
back to the backend English message only when no localized message exists.

This keeps backend logs and tests simple while avoiding hard-coded English
notifications in localized UI.

## Date And Time Formatting

Shared date and time pickers must use app-styled controls and message-catalog
formatters, not native browser popups, for primary UI. This keeps picker labels,
weekday names, AM/PM labels, clear buttons, and displayed values consistent
across browsers and languages.

## Current Status

Implemented:

- browser language detection
- local language preference with `system`, `en`, and `zh-CN`
- English default when there is no saved language preference
- typed shared app message catalogs
- translated auth loading, login, registration, and placeholder action text
- translated sidebar, page titles, Settings rows, version labels, feature
  panels, dialogs, notifications, date picker labels, and time picker labels
- frontend translation of common action-result codes

Not implemented:

- persisted user language settings
- production-quality human Chinese translation
- automatic translation of user-generated content
