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
| `DISCORD_BOT_TOKEN` | Yes for command registration and outbound direct messages | Local and Vercel | Secret bot token from the Discord Developer Portal. |
| `DISCORD_APP_ID` | Yes for command registration | Local and Vercel | App ID from the Discord Developer Portal. |
| `DISCORD_PUBLIC_KEY` | Yes for Discord interactions | Local and Vercel | Public Key used to verify requests from Discord. |

Current credential state as of 2026-07-19:

- `AUTH_SESSION_SECRET` has been rotated. Keep independent values for local,
  preview, and production.
- `NEON_POSTGRES_URL` has been rotated. Local development should point at the
  Neon `preview/develop` branch unless a task explicitly needs another
  non-production branch.
- Do not copy the production Neon `main` branch URL into local
  `apps/web/.env.local`.

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

The Settings page can send a Discord test message to the signed-in user's bound
Discord account. That web action calls the same server-side delivery logic as
outbound messages, so it needs `DISCORD_BOT_TOKEN`.

## Environment Database Split

Use separate Neon branches for separate runtime environments:

| Runtime | Expected database branch | Where to configure |
| --- | --- | --- |
| Local development | `preview/develop` or another non-production branch | `apps/web/.env.local` |
| Vercel Preview for `develop` | `preview/develop` | Vercel Preview environment variables, branch-scoped to `develop` when possible |
| Vercel Production | `main` | Vercel Production environment variables only |

The local `apps/web/.env.local` file has been checked only for key presence and
shape, not printed or committed. It currently contains non-empty
`NEON_POSTGRES_URL` and `AUTH_SESSION_SECRET` values, and does not contain the
old fallback names `NEON_DATABASE_URL` or `DATABASE_URL`.

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

## Discord Integration

The Discord integration is implemented inside the web app. Configure these
variables in `apps/web/.env.local` and in the Vercel web project.

Current variables:

| Variable | Required now | Purpose |
| --- | --- | --- |
| `DISCORD_BOT_TOKEN` | Yes to register slash commands and send outbound Discord direct messages | Secret bot token from the Discord Developer Portal. |
| `DISCORD_APP_ID` | Yes to register slash commands | App ID from the Discord Developer Portal. |
| `DISCORD_PUBLIC_KEY` | Yes to run the HTTP interaction endpoint | Public Key used to verify requests from Discord. |
| `NEON_POSTGRES_URL` | Yes | Same Neon PostgreSQL database used by the web app. |

Use `DISCORD_APP_ID` consistently for the Discord app id. Discord OAuth2 calls
the same value `client_id`, but keeping one Arctic Aria env name avoids
duplicate values drifting apart.

Discord account binding is user-facing. The signed-in Arctic Aria user creates
a one-time code in Settings, then runs `/bind code:<code>` in Discord. The old
developer auto-binding prototype is removed and should not be configured.

There is no current Discord message-push shared secret. Outbound Discord direct
messages use an internal server-side service while delivery code lives inside
the web app.

## Optional App Metadata

The web app can read optional metadata override variables such as `APP_VERSION`,
`APP_COMMIT`, `APP_BRANCH`, and `APP_SOURCE_STATE`. Normal local development
does not need these variables because the app derives metadata from Git when
possible.

Do not set generated `NEXT_PUBLIC_*` metadata variables manually unless
debugging the build system. `apps/web/next.config.ts` generates them from Git,
Vercel metadata, and migration files.
