# Auth Data Model

This document defines auth persistence, backend validation, and database
constraints. Product behavior is documented in [overview.md](overview.md), and UI
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
- non-null administrator flag with false as the default
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
- `is_admin`
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
- `is_admin` is required and defaults to false.

Admin flag rules:

- `is_admin` gates developer-only diagnostics and future administrator-only
  web tools.
- Normal registration must create non-admin accounts.
- The developer may promote an account manually in Neon while there is no admin
  management UI:

```sql
UPDATE users
SET is_admin = true
WHERE username = '<your username>';
```

- After manually changing `is_admin`, sign out and sign in again so the signed
  session payload receives the updated admin flag.

Security rules:

- Never store raw passwords.
- Hash passwords with bcrypt before storing them. The current implementation
  uses cost `12`.
- Treat `password_hash` as a one-way verifier, not as encrypted password data.
  It should never be decrypted because there is no original password to recover.
- Do not commit password hashing secrets, peppers, auth secrets, or database
  credentials.
- If a future password pepper is added, keep it outside the database and outside
  committed files.

## Sessions

The current web implementation stores session state in a signed HTTP-only
cookie. Session persistence is not stored in a database table yet.

Current session rules:

- The cookie name is `arctic_aria_session`.
- The cookie max age is 30 days.
- The token payload stores only user id, username, display name, admin flag,
  and expiry.
- The token is signed with HMAC SHA-256 to prevent tampering.
- The token is not encrypted, so do not add sensitive data to the payload.
- The cookie is `httpOnly`, `sameSite=lax`, and `secure` in production.
- Every environment, including local development, must set
  `AUTH_SESSION_SECRET` explicitly.

Future database-backed sessions may be added when the app needs server-side
session revocation, device management, or account-security audit records.
