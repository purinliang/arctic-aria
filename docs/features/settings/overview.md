# Settings

This document describes user-facing settings that are separate from
authentication. These settings can be implemented after the first registration
and login flow.

## Scope

Progress: implemented

Settings should include personal configuration that affects how the product
behaves for one user.

The current prototype implements a Settings page opened from the sidebar
`Settings` item. It shows persisted display preferences and app/database
version metadata.

Implemented user preferences:

- `Theme`: `Use system setting`, `Light`, or `Dark`
- `Language`: `Use system setting`, `English`, or `简体中文`
- `Time format`: `12-hour` or `24-hour`

Logged-in users store these preferences in the database. The browser/device
local preference remains as a fallback before login, while the app is loading,
or if the persisted settings cannot be read.

Theme `Use system setting` uses browser or operating-system light/dark mode. If
browser/system defaults cannot be read, the fallback is light mode.

Language `Use system setting` resolves the browser language to English or
Simplified Chinese, with English as the fallback for unsupported languages. If
there is no saved language preference, the app defaults to English because the
Simplified Chinese translation is incomplete and machine translated.

Time format changes how visible times render across the app. Stored routine
times remain normalized `HH:mm`; the rendering layer displays them as either
`8:30 PM Evening` or `20:30 Evening`, using the current language's day-period
label.

Current Chinese translation covers global surfaces: auth loading, login,
registration, placeholder auth actions, sidebar/page titles, Settings rows, and
version labels. Feature-heavy pages such as Projects, Routines, Memories, and
Dashboard remain separate translation slices.

Version metadata rows:

- app version, with commit hash only for unreleased branch builds
- actual database version

This is a normal authenticated Settings surface. Version metadata is
intentionally more visible than the signed-out auth-page metadata footer,
because signed-in users can use it to compare the deployed frontend/backend
with database migration records.

The Settings panel should show version rows:

- `App Version`: current build version. Exact release tags show only the
  release version, such as `v0.5.0`; develop, feature, fix, and hotfix branch
  builds append the commit hash.
- `Database Version`: the compact schema-history hash derived from applied
  migration filenames and file checksums.

For exact release versions, hide the `Database Version` row entirely when the
database schema hash matches the expected hash from the current source tree.
Users do not need database metadata when a release is healthy.

For develop, feature, fix, and hotfix branch builds, always show the expected
database schema hash after the actual hash, such as `(expected abc123def456)`.
Use normal supporting text color when the database is aligned.

For any build, if the database schema is behind, ahead, different, missing
checksums, or unavailable, show the `Database Version` row and append the
parenthetical message in red. Do not show migration filenames in the
user-facing Settings UI.

Current web source:

- `apps/web/src/features/settings/components/SettingsPage.tsx`
- `apps/web/src/app-shell/app-preferences.ts`
- `apps/web/src/messages/app-messages.ts`
- `apps/web/src/messages/languages.ts`

## Discord Binding

Progress: planned

Discord binding belongs in Settings because it is account-scoped configuration
for one Arctic Aria user. The binding connects an Arctic Aria user to one
Discord account so the Discord bot can accept `/idea` and later send direct
messages to that user.

Settings should show a Discord row or section inside the existing Settings
panel.

Unbound state:

- show `Discord`
- show supporting text explaining that Discord is not connected
- show a secondary `Connect` button

Pending code state:

- show the one-time code
- show expiry time
- show instructions: run `/bind code:<code>` in Discord
- show `Regenerate` and `Cancel` actions

Bound state:

- show the Discord username when available, otherwise Discord user id
- show last interaction time when available
- show `Reconnect` and `Unbind` actions

Reconnect:

- creates a new one-time code
- successful `/bind` replaces the previous Discord account for the same Arctic
  Aria user

Unbind:

- asks for confirmation
- marks the Discord binding as revoked
- leaves historical rows queryable for audit/debugging, but normal product
  commands only use active bindings

Expected notifications:

- show success notification when a code is generated, binding is refreshed, or
  unbind succeeds
- show error notification when code creation, binding status loading, or unbind
  fails
- do not show raw code hashes, internal secrets, Discord bot tokens, or raw
  backend errors

## Attributes

Implemented preferences are stored in the `user_settings` SQL table. Persistence
rules are documented in [data-model.md](data-model.md).

Current attributes:

- `theme_preference`: `system`, `light`, or `dark`
- `language_preference`: `system`, `en`, or `zh-CN`
- `time_format_preference`: `12h` or `24h`

Planned attributes:

- timezone, to handle daylight-saving changes and personal-day calculations
- day boundary time, default `04:00`
- date format preference
- future auto-translation preference

The day boundary matters because a routine completed at `03:59` may still belong
to the previous personal day.

A document-style store can be considered later if settings become large or
highly variable.

## Change Display Name

Progress: suspended

Changing display name belongs in user settings and should be updated from a
settings page.

## Change Password

Progress: suspended

Changing password is shown from the Settings page, but the credential update
command belongs to Auth because it must enforce password validation, hashing,
session, and security rules.
