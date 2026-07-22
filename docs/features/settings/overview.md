# Settings

This document describes user-facing settings that are separate from
authentication. These settings can be implemented after the first registration
and login flow.

## Scope

Progress: implemented

Settings should include personal configuration that affects how the product
behaves for one user.

The current web app implements a Settings page opened from the sidebar
`Settings` item. It is organized into normal user cards plus an administrator
diagnostic card when the signed-in account is an administrator:

- `Preferences`: persisted display, language, and time preferences
- `Discord Binding`: Discord account binding controls
- `About`: visible app version and collapsed database-version metadata
- `Developer Tools`: administrator-only diagnostics, currently latency testing

Implemented user preferences:

- `Theme`: `Use system setting`, `Light`, or `Dark`
- `Language`: `Use system setting`, `English`, or `简体中文`
- `Time format`: `12-hour` or `24-hour`
- `Timezone`: disabled in the current UI and fixed to `Use system setting`

Timezone preference columns exist in the database, but the user-facing timezone
feature is intentionally hidden for the current release. The frontend treats
timezone as system/browser timezone and keeps multiple-timezone mode off until
the routine reminder design is ready.

Server-side scheduled jobs cannot read the browser timezone directly. The web
app stores the last concrete browser-resolved timezone separately from the
user's `system` preference so scheduled Discord messages can use the correct
local day boundary.

Logged-in users store these preferences in the database. The browser/device
local preference remains as a fallback before login, while the app is loading,
or if the persisted settings cannot be read.

Theme `Use system setting` uses browser or operating-system light/dark mode. If
browser/system defaults cannot be read, the fallback is light mode.

Language `Use system setting` resolves the browser language to English or
Simplified Chinese, with English as the fallback for unsupported languages. If
there is no saved language preference, the app defaults to English because the
Simplified Chinese translation is incomplete and machine translated.
The incomplete-translation support text should appear only when the active UI
language is Simplified Chinese, not when the active UI language is English.

Time format changes how visible times render across the app. Stored routine
times remain normalized `HH:mm`; the rendering layer displays them as either
`8:30 PM Evening` or `20:30 Evening`, using the current language's day-period
label.

Timezone uses IANA timezone names so daylight-saving changes are handled by the
platform instead of fixed UTC offsets. For example, `Australia/Melbourne`
resolves to UTC+10 or UTC+11 depending on the date. Routine dates remain plain
dates for now; timezone affects preferred-time interpretation and future
reminder delivery.

Current Chinese translation covers global surfaces: auth loading, login,
registration, placeholder auth actions, sidebar/page titles, Settings rows, and
version labels. Feature-heavy pages such as Projects, Routines, Memories, and
Dashboard remain separate translation slices.

Version metadata rows:

- app version, with commit hash only for unreleased branch builds
- actual database version, rendered in markup but visually collapsed for normal
  users

This is a normal authenticated `About` surface. Normal signed-in users
see only the app version. The database version row remains mounted in the DOM so
the developer can inspect it through browser developer tools when debugging
deployment or migration state.

The visible card description should describe only the app version, not database
status, because database metadata is collapsed for normal users.

The `About` card should show version rows:

- `App Version`: current build version. Exact release tags show only the
  release version, such as `v0.5.0`; develop, feature, fix, and hotfix branch
  builds append the commit hash.
- `Database Version`: the compact schema-history hash derived from applied
  migration filenames and file checksums. This row is visually collapsed by
  default, regardless of build type or alignment state.

Do not show migration filenames in the user-facing Settings UI. Do not add
developer-account-specific display rules for version metadata. If a future
admin/debug mode is added, reveal the existing mounted database row through an
explicit role or environment rule rather than a hard-coded account name.

## Developer Tools

Progress: implemented for administrator latency diagnostics

The `Developer Tools` card appears only when the signed-in session has
`isAdmin = true`. It is not a user-controlled developer-mode switch. Backend
developer APIs must also verify the signed session and reject non-admin users.

Current behavior:

- show `Only visible to administrators.`
- show one `Test Latency` button with a speed/gauge icon
- run 30 sequential samples against `/api/developer/performance/latency`
- show min, p10, p50, p90, max, and average timing
- show `Frontend-Backend RTT` and `Backend-Database RTT`
- allow copying a Markdown report
- also print the latest report table to the browser console for quick debugging
- do not persist latency reports in the database

The latency route performs one lightweight database query per request. The
frontend repeats the request so the report measures real browser request
latency, not only an internal backend loop.

Current web source:

- `apps/web/src/features/settings/components/SettingsPage.tsx`
- `apps/web/src/app-shell/app-preferences.ts`
- `apps/web/src/messages/app-messages.ts`
- `apps/web/src/messages/languages.ts`

## Discord Binding

Progress: partially implemented

Discord binding belongs in Settings because it is account-scoped configuration
for one Arctic Aria user. The binding connects an Arctic Aria user to one
Discord account so the Discord integration can accept `/idea` and later send direct
messages to that user.

Settings shows Discord controls inside a separate `Discord Binding` card.

Unbound state:

- show `Discord`
- show supporting text explaining that Discord can receive ideas and send
  messages
- show `Checking binding status...` while the initial status load is pending
- show `Binding status unavailable.` and a `Check Again` action if the status
  check fails
- show `No bound account.` after loading when no active binding exists and no
  binding code is pending
- show a secondary `Bind` button
- use the same normal list-row and button rhythm as the checking and pending
  code states

Pending code state:

- show the one-time code as part of the exact Discord slash command
- show a single instruction sentence such as `Send /bind code:R8A3-Y6LL-KV3Q
  to Arctic Aria in Discord in 15 minutes.`
- show `Expired` in red when the code expires
- show the exact Discord slash command in monospace inline command style, such
  as `/bind code:R8A3-Y6LL-KV3Q`
- show only `Cancel` immediately after the instruction when width allows; do
  not push it to the far right and do not show a normal `Check Again` action
  for pending codes
- use the same normal list-row and button rhythm as the checking and unbound
  states
- successful `/bind` completion should update the open web app through a future
  server notification/event-bus channel and show a web notification; do not
  depend on the user manually checking again as the normal success path

Bound state:

- show `Bound account` as the field label
- show the bound Discord account id in a disabled shared password input
- show an icon-only view/hide button inside the password input
- show `Send Test` to send a simple Discord DM directly from the web server to
  the bound Discord account
- show `Unbind` in the same horizontal row when width allows
- use the same normal list-row and button rhythm as checking, unbound, and
  pending code states

Unbind:

- asks for confirmation
- marks the Discord binding as revoked
- leaves historical rows queryable for audit/debugging, but normal product
  commands only use active bindings

Expected notifications:

- show success notification when a code is generated, canceled, or unbind
  succeeds
- show success notification when `Send Test` sends a Discord DM
- show error notification when code creation, binding status loading, or unbind
  fails
- show specific error notifications for test-message failures: missing bot
  token, no active binding, or Discord delivery failure
- do not show raw code hashes, internal secrets, Discord tokens, or raw
  backend errors

Current implementation:

- Settings can load the active Discord binding for the signed-in Arctic Aria
  user.
- Settings can create and cancel one-time binding codes.
- Settings can unbind the active Discord account after confirmation.
- Settings can send a test Discord DM to the active bound account through the
  shared Discord notification service used by outbound Discord messages.
- The Discord integration implements `/bind code:<code>` and consumes those
  codes.
- The UI does not yet receive server-pushed binding completion events after the
  user completes `/bind` in Discord. The intended fix is a shared app event bus
  or server notification channel, not a permanent manual `Check Again` button.

## Attributes

Implemented preferences are stored in the `user_settings` SQL table. Persistence
rules are documented in [data-model.md](data-model.md).

Current attributes:

- `theme_preference`: `system`, `light`, or `dark`
- `language_preference`: `system`, `en`, or `zh-CN`
- `time_format_preference`: `12h` or `24h`
- `timezone_preference`: `system` or an IANA timezone; current frontend keeps
  this disabled as `system`
- `resolved_timezone`: nullable concrete IANA timezone captured from the
  browser for server-side scheduled jobs
- `multiple_timezones_enabled`: reserved for future routine-specific timezone
  editors; current frontend keeps this false and hidden

Planned attributes:

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
