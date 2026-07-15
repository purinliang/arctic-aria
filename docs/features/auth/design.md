# User

This document defines the first user feature. It covers registration, login,
and future OAuth. User settings are documented separately in
[settings.md](settings.md).

User-facing auth UI behavior is documented in [ui.md](ui.md). The
current web implementation notes are documented in
[web-implementation.md](web-implementation.md). Keep
this file as the product rule source and use the implementation note for code
locations, commands, and current prototype status.

## Scope

The first user feature should include:

- username and password registration
- username and password login
- password hashing
- basic validation and user-facing error messages

The first user feature should not include:

- Google OAuth
- changing display name
- changing password
- account deletion
- multi-factor authentication

## Suggested Table Design

### `users`

Should be stored in the `users` SQL table.

Recommended fields:

- `id`
- `username`
- `password_hash`
- `display_name`
- `created_at`
- `updated_at`

Recommended constraints:

- `id` is the primary key.
- `username` is unique.
- `username` must follow the registration username validation rules.
- `display_name` must follow the registration display name validation rules.
- `password_hash` is required.

Do not store raw passwords. Password hashing secrets, salts, pepper values, and
environment variables must not be committed to git.

Use bcrypt for password hashing. Bcrypt handles per-password salts internally.
If a pepper value is added, it must come from an environment variable or secret
manager, not from tracked files.

## Registration

Progress: planned

Use `register` in code. The UI can say `Sign up`.

### Required fields

- username
- display name
- password
- repeated password

### Validation when typing

- Username must be at least 4 characters and at most 16 characters.
- Username must contain visible non-blank ASCII characters only.
- Password must be at least 8 characters and at most 32 characters.
- Password must contain visible non-blank ASCII characters only.
- Password and repeated password must match.
- Display name is optional.
- If display name is provided, it must be at least 1 character and at most 24 characters.
- Display name should support UTF-8.
- Display name should be trimmed before validation.
- Display name can contain spaces and other blank characters inside the trimmed
  value.

When a typing validation rule fails:

- The UI should show a field-level error near the matching input.
- The user can type invalid characters, but the UI should respond while typing
  with a hint so the user understands what is wrong.
- Empty required fields should not show field-level errors while typing. Empty
  required-field messages are submit validation.
- If multiple rules fail for the same field, show the first rule in the order
  listed above.
- The confirm button should be disabled while any non-empty typing validation
  rule fails.

### Validation when submitting

- Trim all fields before backend validation.
- Run all typing validation rules again on the backend to protect against
  frontend mistakes or request tampering.
- Username is required.
- Password is required.
- Repeated password is required for registration.
- Username must be unique.
- If display name is empty, use the username as the display name.

When a submit validation rule fails:

- Show required-empty errors, such as `Username can't be empty.`, as field-level
  bubbles after the user clicks the confirm button.
- Show backend or persistence errors in the shared notification stack separate
  from field-level typing hints.
- Keep the user on the current page.
- Preserve the user's input except for password fields if the implementation
  chooses to clear them for safety.
- If multiple rules fail, show the first rule in the order listed above.

When registration succeeds:

- Show a shared success notification.
- Open the dashboard or main page after the session is created. The notification
  should use the shared notification stack so it can persist across the auth to
  dashboard transition.

For success, validation failure, and internal failure, both frontend and backend
should write useful logs. Logs must not include raw passwords or other sensitive
values.

## Login

Progress: planned

Use `login` in code. The UI can say `Sign in`.

### Required fields

- username
- password

### Validation when typing

- Username is required.
- Password is required.
- Username and password should use the same validation rules and messages as
  registration for format violations.

Use the same typing validation behavior as registration.

### Validation when submitting

- Run all typing validation rules again on the backend to protect against
  frontend mistakes or request tampering.
- Failed login should show a clear but generic error, such as invalid username
  or password.

Use the same submit validation behavior as registration.

## OAuth

Progress: suspended

Google OAuth can be added later. It should not block the first username and
password implementation.

## UI

User auth UI behavior is documented in [ui.md](ui.md). Keep this file
focused on product rules, validation, persistence, and security behavior.
