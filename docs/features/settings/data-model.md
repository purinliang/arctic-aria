# Settings Data Model

Settings persistence stores one preference row per authenticated user.

## Tables

### `user_settings`

`user_settings` owns account-scoped display preferences. The row is created on
first settings read or write so existing users can keep working after the
migration.

Columns:

- `user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE`
- `theme_preference text NOT NULL DEFAULT 'system'`
- `language_preference text NOT NULL DEFAULT 'en'`
- `time_format_preference text NOT NULL DEFAULT '12h'`
- `timezone_preference text NOT NULL DEFAULT 'system'`
- `multiple_timezones_enabled boolean NOT NULL DEFAULT false`
- `created_at timestamptz NOT NULL DEFAULT now()`
- `updated_at timestamptz NOT NULL DEFAULT now()`

Constraints:

- `theme_preference` must be `system`, `light`, or `dark`
- `language_preference` must be `system`, `en`, or `zh-CN`
- `time_format_preference` must be `12h` or `24h`
- `timezone_preference` must be `system` or a non-empty trimmed string no
  longer than 64 characters. Backend normalization accepts only IANA timezone
  names.
- `multiple_timezones_enabled` must be boolean

### `discord_accounts`

`discord_accounts` stores the active or revoked Discord binding for an Arctic
Aria user. The table is shared by Settings and the Discord integration.

Columns are documented in [Discord integration](../discord/overview.md).
Settings should read only the row owned by the signed-in Arctic Aria user.

Settings rules:

- one Arctic Aria user can have at most one active Discord account
- one Discord user id can have at most one active Arctic Aria user binding
- normal settings reads show active bindings only
- unbind marks the row `revoked` and sets `revoked_at`
- reconnect can reactivate or replace the binding for the same Arctic Aria user
- a Discord account already active for another Arctic Aria user cannot be
  claimed

### `discord_binding_codes`

`discord_binding_codes` stores short-lived one-time codes created from Settings
and consumed by the Discord `/bind` command.

Implemented columns:

- `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`
- `user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE`
- `code_hash text NOT NULL UNIQUE`
- `expires_at timestamptz NOT NULL`
- `consumed_at timestamptz`
- `created_at timestamptz NOT NULL DEFAULT now()`

Constraints and indexes:

- index active codes by `code_hash`
- `code_hash` must be a lowercase SHA-256 hex digest
- index unconsumed user codes by `user_id`
- `expires_at` must be after `created_at`

Backend rules:

- Settings creates a random code and stores only a hash
- raw codes are returned to the frontend only once, immediately after creation
- codes expire after 15 minutes
- `/bind` consumes only unexpired and unconsumed codes
- creating a new code consumes previous unconsumed codes for the same user
- canceling a pending code marks unconsumed codes for that user as consumed
- consuming a code and upserting `discord_accounts` happens in one atomic SQL
  statement
- expired and consumed codes are not valid for binding

### `discord_message_deliveries`

Settings does not own Discord delivery records, but the `Send Test` action uses
the Discord outbound-message delivery logic directly. Delivery rows and
idempotency rules are documented in
[Discord integration](../discord/overview.md#outbound-direct-messages).

Deletion and lifecycle:

- `user_settings` is deleted automatically when the owning `users` row is
  deleted
- `discord_accounts` is deleted automatically when the owning `users` row is
  deleted
- codes are deleted automatically when the owning `users` row is deleted
- expired or consumed codes may be cleaned up later by maintenance work
- raw codes are never recoverable from the database

There is no separate settings archive behavior. Discord unbind marks an
existing account binding as revoked instead of deleting it during normal user
actions.

## Backend Rules

The backend accepts only known enum values and normalizes missing or unsupported
values to defaults before writing. Timezone preferences are validated with
`Intl.DateTimeFormat` so IANA names such as `Australia/Melbourne` can handle
daylight-saving changes. Database check constraints provide the final
protection against malformed settings rows and concurrent bad writes.

Settings reads return defaults if the row is missing, then insert the default
row for that user. Settings writes upsert the full preference object.

If a settings update fails, the frontend keeps the local visual change for the
current session, shows a notification, and leaves the database unchanged.

Discord binding commands must use transactions when consuming a binding code
and upserting `discord_accounts`.
