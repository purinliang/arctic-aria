# Settings

This document describes user-facing settings that are separate from
authentication. These settings can be implemented after the first registration
and login flow.

## Scope

Progress: prototype

Settings should include personal configuration that affects how the product
behaves for one user.

The current prototype implements only a read-only Settings page. It is opened
from the sidebar `Settings` item and shows app and database version metadata:

- app version, with commit hash only for unreleased branch builds
- actual database version

This is a normal authenticated Settings surface. It is intentionally more
visible than the signed-out auth-page metadata footer, because signed-in users
can use it to compare the deployed frontend/backend with database migration
records.

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

## Attributes

Should be stored in the `user_settings` SQL table.

- timezone, to handle daylight-saving changes and personal-day calculations
- day boundary time, default `04:00`
- default theme, such as light or dark
- language preference, such as English or Chinese
- date format preference
- future auto-translation preference

The day boundary matters because a routine completed at `03:59` may still belong
to the previous personal day.

The first implementation can store settings in a SQL table linked by user id. A
document-style store can be considered later if settings become large or highly
variable.

## Change Display Name

Progress: suspended

Changing display name belongs in user settings and should be updated from a
settings page.

## Change Password

Progress: suspended

Changing password is shown from the Settings page, but the credential update
command belongs to Auth because it must enforce password validation, hashing,
session, and security rules.
