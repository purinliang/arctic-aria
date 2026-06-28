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

Required fields:

- username
- display name
- password
- repeated password

Validation:

- Username is required.
- Username must be unique.
- Username must contain visible non-blank ASCII characters only.
- Password is required.
- Password must be at least 8 characters.
- Password must contain visible non-blank ASCII characters only.
- Password and repeated password must match.
- Display name is required.
- Display name should be trimmed.
- Display name should support UTF-8.
- Display name can contain spaces and other blank characters inside the trimmed
  value.
- Display name should be no longer than 80 characters.

The first UI should show field-level errors for each validation failure.

## Login

Progress: planned

Use `login` in code. The UI can say `Sign in`.

Required fields:

- username
- password

Validation:

- Username is required.
- Password is required.
- Username and password should use the same validation messages as registration
  for format violations.
- Failed login should show a clear but generic error, such as invalid username
  or password.

## OAuth

Progress: suspended

Google OAuth can be added later. It should not block the first username and
password implementation.
