# Settings

This document describes user-facing settings that are separate from
authentication. These settings can be implemented after the first registration
and login flow.

## Scope

Progress: prototype

Settings should include personal configuration that affects how the product
behaves for one user.

The current prototype implements only a read-only Settings page. It is opened
from the sidebar `Settings` item and shows app version metadata:

- app version
- commit hash
- source state

This is a normal authenticated Settings surface. It is intentionally more
visible than the very subtle auth-page metadata footer, because signed-in users
can use it to compare the deployed frontend/backend with database migration
records.

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
