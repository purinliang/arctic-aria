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
- `created_at timestamptz NOT NULL DEFAULT now()`
- `updated_at timestamptz NOT NULL DEFAULT now()`

Constraints:

- `theme_preference` must be `system`, `light`, or `dark`
- `language_preference` must be `system`, `en`, or `zh-CN`
- `time_format_preference` must be `12h` or `24h`

## Backend Rules

The backend accepts only known enum values and normalizes missing or unsupported
values to defaults before writing. Database check constraints provide the final
protection against unsupported values and concurrent bad writes.

Settings reads return defaults if the row is missing, then insert the default
row for that user. Settings writes upsert the full preference object.

If a settings update fails, the frontend keeps the local visual change for the
current session, shows a notification, and leaves the database unchanged.

## Deletion

`user_settings` is deleted automatically when the owning `users` row is deleted.
There is no separate settings archive behavior.
