# Environment Variables

This document explains which environment variables Arctic Aria currently uses,
what each one is for, and where it belongs.

Do not commit real values. The committed `.env.example` files are placeholders
only. Real values belong in ignored local env files or deployment secret
storage.

## Web App

Example file:

- `apps/web/.env.example`

Local secret file:

- `apps/web/.env.local`

Production secret storage:

- Vercel project environment variables for the web app

Current variables:

| Variable | Required now | Where | Purpose |
| --- | --- | --- | --- |
| `NEON_POSTGRES_URL` | Yes | Local and Vercel | PostgreSQL connection URL used by the web app and migration runner. |
| `AUTH_SESSION_SECRET` | Yes | Local and Vercel | Secret used to sign the 30-day auth session cookie. |

The web code reads `NEON_POSTGRES_URL` only. If the Vercel Neon integration
creates `NEON_DATABASE_URL`, copy that pooled URL into a new Vercel variable
named `NEON_POSTGRES_URL`.

Every environment, including local development, must set
`AUTH_SESSION_SECRET`. The app does not fall back to `NEON_POSTGRES_URL` or a
default development string. This keeps the cookie-signing secret independent of
the database URL.

Use a different `AUTH_SESSION_SECRET` for local development, preview, and
production. A cookie signed by one environment's secret cannot be verified by
another environment's secret. Browsers also keep `localhost` cookies separate
from production-domain cookies. Changing a deployed environment's
`AUTH_SESSION_SECRET` invalidates existing login cookies for that environment,
so users must sign in again.

Generate one independent session secret per environment with:

```bash
openssl rand -base64 48
```

## Vercel Neon Variables

The Neon integration may create variables such as:

- `NEON_AUTH_BASE_URL`
- `NEON_DATABASE_URL`
- `NEON_DATABASE_URL_UNPOOLED`
- `NEON_PGDATABASE`
- `NEON_PGHOST`
- `NEON_PGHOST_UNPOOLED`
- `NEON_PGPASSWORD`
- `NEON_PGUSER`

The current Arctic Aria code does not read these names directly. They are Neon
integration details. Use `NEON_DATABASE_URL` as the source value for
`NEON_POSTGRES_URL`.

Do not use `NEON_DATABASE_URL_UNPOOLED` unless a later database operation
explicitly requires an unpooled connection.

`NEON_AUTH_BASE_URL` is not used because Arctic Aria currently implements its
own username/password auth instead of Neon Auth.

## Optional App Metadata

The web app can read optional metadata override variables such as `APP_VERSION`,
`APP_COMMIT`, `APP_BRANCH`, and `APP_SOURCE_STATE`. Normal local development
does not need these variables because the app derives metadata from Git when
possible.

Do not set generated `NEXT_PUBLIC_*` metadata variables manually unless
debugging the build system. `apps/web/next.config.ts` generates them from Git,
Vercel metadata, and migration files.
