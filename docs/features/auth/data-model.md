# Auth Data Model

This document defines auth persistence, backend validation, and database
constraints. Product behavior is documented in [design.md](design.md), and UI
behavior is documented in [ui.md](ui.md).

## Validation And Consistency

Auth uses the shared database integrity rules from
[../../infrastructure/database.md](../../infrastructure/database.md).

Backend validation should check:

- username is present during submit
- username length is 4-16 characters
- username uses visible non-blank ASCII characters
- password is present during submit
- password length is 8-32 characters
- password uses visible non-blank ASCII characters
- repeated password matches during registration
- display name is optional before normalization
- normalized display name length is 1-24 characters

Database constraints should protect:

- unique username
- required password hash
- stored username length and character set
- stored display name length

Do not rely on a read-before-insert username check as the only duplicate
protection. Registration must handle concurrent duplicate usernames through the
database unique constraint and return a clean username error.

## `users`

The `users` table stores Arctic Aria users.

Current fields:

- `id`
- `username`
- `password_hash`
- `display_name`
- `created_at`
- `updated_at`

Current database constraints:

- `id` is the primary key.
- `username` is required and unique.
- `username` length is 4-16 characters.
- `username` contains visible non-blank ASCII characters only.
- `password_hash` is required.
- `display_name` is required.
- `display_name` length is 1-24 characters.

Security rules:

- Never store raw passwords.
- Hash passwords with bcrypt before storing them.
- Do not commit password hashing secrets, peppers, auth secrets, or database
  credentials.

## Sessions

The current web implementation stores session state in a signed HTTP-only
cookie. Session persistence is not stored in a database table yet.

Future database-backed sessions may be added when the app needs server-side
session revocation, device management, or account-security audit records.
