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

## Discord Bot

Example file:

- `apps/discord-bot/.env.example`

Local secret file:

- `apps/discord-bot/.env.local`

The current Discord bot is an HTTP Interactions process. It is not deployed
inside the Vercel web app yet, so these Discord variables usually do not belong
in Vercel unless a later deployment design runs the interaction endpoint there.

Current and planned variables:

| Variable | Required now | Purpose |
| --- | --- | --- |
| `DISCORD_BOT_TOKEN` | Yes to register slash commands and send future Discord API messages | Secret bot token from the Discord Developer Portal. |
| `DISCORD_APP_ID` | Yes to register slash commands | App ID from the Discord Developer Portal. |
| `DISCORD_PUBLIC_KEY` | Yes to run the HTTP interaction endpoint | Public Key used to verify requests from Discord. |
| `DISCORD_DEVELOPER_USER_ID` | Required for the developer prototype binding | Developer's Discord account id. |
| `ARCTIC_ARIA_DEVELOPER_USERNAME` | Required for the developer prototype binding | Existing Arctic Aria username used by the developer in the web app. |
| `DISCORD_INTERNAL_PUSH_SECRET` | Planned for reverse message push | Shared secret used by Arctic Aria services when calling the Discord bot internal push endpoint. |
| `NEON_POSTGRES_URL` | Yes | Same Neon PostgreSQL database used by the web app. |
| `PORT` | Optional | Local HTTP port for `/interactions`; defaults to `3001`. |

Use `DISCORD_APP_ID` consistently for the Discord app id. Discord OAuth2 calls
the same value `client_id`, but keeping one Arctic Aria env name avoids
duplicate values drifting apart.

The first bot does not have a normal user self-service binding flow. On startup,
it can bind `DISCORD_DEVELOPER_USER_ID` to `ARCTIC_ARIA_DEVELOPER_USERNAME` by
inserting or updating one row in `discord_accounts`. That lets the developer
test `/idea` before a full user-facing binding page exists.

If the developer binding variables are missing, the bot can still start, but
`/idea` will reply that the Discord account is not linked. These developer
binding variables are a prototype path and should be removed after the
Settings-driven `/bind` flow is implemented.

`DISCORD_INTERNAL_PUSH_SECRET` must be different from `AUTH_SESSION_SECRET`,
Discord tokens, and database credentials. Store it in every environment that
runs a caller of `POST /internal/discord/messages` and in the Discord bot
service environment. Generate it like other shared service secrets:

```bash
openssl rand -base64 48
```

## Optional App Metadata

The web app can read optional metadata override variables such as `APP_VERSION`,
`APP_COMMIT`, `APP_BRANCH`, and `APP_SOURCE_STATE`. Normal local development
does not need these variables because the app derives metadata from Git when
possible.

Do not set generated `NEXT_PUBLIC_*` metadata variables manually unless
debugging the build system. `apps/web/next.config.ts` generates them from Git,
Vercel metadata, and migration files.
