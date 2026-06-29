# Auth Implementation Notes

This note records the current username and password auth prototype in the
Next.js web app. The product rules still live in
[user.md](../../core-layer/user.md).

The general dashboard prototype plan is documented in
[prototype.md](prototype.md). Its "no authentication" boundary applies to the
dashboard-only prototype work, not to this auth feature branch.

## Current Status

The first auth flow is a good starting point:

- Users can sign up with username, optional display name, and password.
- Users can sign in with username and password.
- Successful sign up and sign in create a 30-day signed session cookie.
- Users can sign out from the dashboard.
- Passwords are hashed with bcrypt before storage.
- The default auth service uses Neon PostgreSQL through the database client.
- Frontend typing validation and backend submit validation share the same
  validation functions.
- The initial `users` migration has database constraints for stored username
  and display name values.
- Duplicate username races are handled through the database unique constraint
  and returned as a clean username validation error.

This is still not a complete production auth system. It is enough for local
manual testing and for building the next authenticated features.

## Code Map

Auth UI:

```text
apps/web/src/features/auth/components/
|-- AuthGate.tsx
|-- AuthForm.tsx
|-- AuthTextField.tsx
`-- GoogleIcon.tsx
```

Auth actions and shared validation:

```text
apps/web/src/features/auth/actions.ts
apps/web/src/features/auth/validation.ts
```

Auth backend:

```text
apps/web/src/features/auth/server/
|-- auth-service.ts
|-- password.ts
|-- postgres-user-repository.ts
|-- session.ts
`-- user-repository.ts
```

Database client and migrations:

```text
apps/web/src/server/database/neon.ts
apps/web/database/migrations/0001_create_users.sql
apps/web/scripts/migrate.mjs
```

Tests:

```text
apps/web/src/features/auth/__tests__/auth-service.test.ts
apps/web/src/features/auth/__tests__/session.test.ts
apps/web/src/features/auth/__tests__/validation.test.ts
apps/web/src/server/database/__tests__/neon.test.ts
```

## Validation Boundary

Use `apps/web/src/features/auth/validation.ts` as the implementation source for
both frontend and backend auth field validation.

Current rules:

- Username is required.
- Username must be 4 to 16 characters.
- Username must contain visible non-blank ASCII characters only.
- Password is required.
- Password must be 8 to 32 characters.
- Password must contain visible non-blank ASCII characters only.
- Repeated password must match password during sign up.
- Display name is optional.
- A provided display name is trimmed before validation.
- A provided display name must be 1 to 24 characters.
- Display name can contain UTF-8 text and blanks inside the trimmed value.

The database cannot validate the raw password because only the bcrypt hash is
stored. Password validation must happen before hashing.

## Database Notes

The selected database for the current prototype is Neon PostgreSQL.

The app reads the database URL from environment variables through
`apps/web/src/server/database/neon.ts`. Keep local `.env*` files untracked and
do not commit connection strings.

Run migrations from `apps/web`:

```bash
pnpm db:migrate
```

The migration runner loads `.env.local` and `.env.development.local` before it
connects. Prefer an unpooled or direct Neon URL for migrations when one is
available.

## Session Notes

The current prototype stores login state in an HTTP-only signed cookie named
`arctic_aria_session`. The cookie lasts 30 days.

The session token is signed with `AUTH_SESSION_SECRET` when it is set. For local
development, the app falls back to available database URL environment variables
or a development-only fallback secret. A deployed environment should set
`AUTH_SESSION_SECRET` explicitly.

The current session payload stores user id, username, display name, and expiry.
It is not stored in the database, so there is no server-side session revocation
yet.

## UI Rules

Auth UI should follow the existing web rules:

- Keep the auth panel centered.
- Keep `Sign in` and `Sign up` as the two tabs.
- Use field-level error bubbles after a field has been focused.
- Disable submit while typing validation fails.
- Show the first hidden validation error when hovering a disabled submit button.
- Keep OAuth as a placeholder until the username and password flow is stable.
- Use `lucide-react` icons for normal UI icons when a suitable icon exists.
- Use the Google-provided multicolor logo component for the Google placeholder.
- Avoid unrelated actions on the auth screen.

## Useful Commands

From `apps/web`:

```bash
pnpm test
pnpm lint
pnpm build
pnpm db:migrate
pnpm dev
```

Manual smoke test:

1. Run `pnpm db:migrate`.
2. Run `pnpm dev`.
3. Sign up with a new username.
4. Sign in with the same username and password.
5. Try signing in with a different username and confirm it fails.

## Improvements To Consider Next

- Add rate limiting for login and registration attempts.
- Add better handling for unexpected database failures.
- Add end-to-end tests for the browser auth flow.
- Decide whether the signed cookie session should later move to a server-side
  sessions table or an auth library.
- Add session revocation if account settings, password changes, or shared
  devices become important.
