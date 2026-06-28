# User

This document defines the first user feature. It covers registration, login,
and future OAuth. User settings are documented separately in
[user-settings.md](user-settings.md).

## Scope

The first user feature should include:

- email and password registration
- email and password login
- password hashing
- basic validation and user-facing error messages

The first user feature should not include:

- Google OAuth
- changing display name
- changing password
- account deletion
- multi-factor authentication

## Attributes

Progress: planned

Store users in SQL.

`users` should store:

- id
- email
- password hash
- display name
- created and updated timestamps

Do not store raw passwords. Password hashing secrets, salts, pepper values, and
environment variables must not be committed to git.

## Registration

Progress: planned

Use `register` in code. The UI can say `Sign up`.

Required fields:

- email
- display name
- password
- repeated password

Validation:

- Email is required and should be normalized before storage.
- Email must be unique.
- Display name is required.
- Display name can contain normal spaces.
- Multiple spaces in a display name should be collapsed into one space.
- Password must be at least 8 characters.
- Password and repeated password must match.

The first UI should show field-level errors for each validation failure.

## Login

Progress: planned

Use `login` in code. The UI can say `Sign in`.

Required fields:

- email
- password

Validation:

- Email is required.
- Password is required.
- Failed login should show a clear but generic error, such as invalid email or
  password.

## OAuth

Progress: suspended

Google OAuth can be added later. It should not block the first email and
password implementation.
