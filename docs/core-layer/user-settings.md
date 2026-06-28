# User Settings

This document describes user settings that are separate from authentication.
These settings can be implemented after the first registration and login flow.

## Scope

Progress: suspended

User settings should include personal configuration that affects how the product
behaves for one user.

Initial settings:

- timezone
- day boundary time, default `04:00`

The day boundary matters because a routine completed at `01:00` may still belong
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

Changing password belongs in user settings and should be updated from a settings
page.
