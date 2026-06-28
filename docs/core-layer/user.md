# User

This document defines the first user feature. It covers registration, login,
and future OAuth. User settings are documented separately in
[user-settings.md](user-settings.md).

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

## Attributes

Should be stored in the `users` SQL table.

- id
- username
- password hash
- display name
- created and updated timestamps

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

- Username is required.
- Username must contain visible non-blank ASCII characters only.
- Password is required.
- Password must be at least 8 characters.
- Password must contain visible non-blank ASCII characters only.
- Password and repeated password must match.
- Display name is required.
- Display name should support UTF-8.
- Display name should be trimmed before validation.
- Display name can contain spaces and other blank characters inside the trimmed
  value.
- Display name should be no longer than 32 characters.

When a typing validation rule fails:

- The UI should show a field-level error near the matching input.
- The user can type invalid characters, but the UI should respond immediately
  with a hint so the user understands what is wrong.
- If multiple rules fail for the same field, show the first rule in the order
  listed above.
- The confirm button should be disabled while any typing validation rule fails.

### Validation when submitting

- Run all typing validation rules again on the backend to protect against
  frontend mistakes or request tampering.
- Username must be unique.

When a submit validation rule fails:

- Show an error dialog or toast separate from field-level typing hints.
- Keep the user on the current page.
- Preserve the user's input except for password fields if the implementation
  chooses to clear them for safety.
- If multiple rules fail, show the first rule in the order listed above.

When registration succeeds:

- Show a small notification or dialog.
- After about 2 seconds, dismiss the notification and navigate to the dashboard
  or main page.

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
