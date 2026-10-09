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
| `DISCORD_BOT_TOKEN` | Yes for outbound direct messages, command sync, and deploy | Local and Vercel | Secret bot token from the Discord Developer Portal. |
| `DISCORD_APP_ID` | Yes for command sync and deploy | Local and Vercel | App ID from the Discord Developer Portal, used by `pnpm --dir apps/web discord:sync-commands`. |
| `DISCORD_PUBLIC_KEY` | Yes for Discord interactions | Local and Vercel | Public Key used to verify requests from Discord. |
| `CRON_SECRET` | Yes for scheduled reminder routes | Vercel web app, Cloudflare cron worker, and local cron-route testing | Secret used to authorize internal cron routes. |
| `GEMINI_API_KEY` | Optional development smoke test only | Local server secrets | Not used by user-facing AI actions; users supply their own keys. |
| `GEMINI_MODEL` | Optional development smoke test only | Local server variables | Defaults to `gemini-2.5-flash`; no automatic model fallback. |
| `AI_CREDENTIAL_ENCRYPTION_KEY` | Required for saved user AI credentials | Local server or deployment secrets | Base64-encoded 32-byte AES key, separate from auth secrets. Keep stable and private. |

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

## Gemini API Preparation

The optional server adapter is in `apps/web/src/server/ai/`. It uses Google's
official `@google/genai` SDK, pinned to an exact 2.x version. Published SDK files
work without dependency lifecycle scripts; installation explicitly denies new
SDK/protobuf scripts instead of granting broad build permissions.

Create an API key through [Google AI Studio](https://aistudio.google.com/apikey)
and set `GEMINI_API_KEY` in ignored `apps/web/.env.local` only for development
CLI smoke tests. Product users enter their own key in Settings. Restrict keys to the Gemini API.
Never paste real keys into chat, commits or terminal arguments. Do not set a
browser-public variable, store plaintext in product tables, or add it to Next config.

`GEMINI_MODEL` defaults to `gemini-2.5-flash`. Google currently limits 2.5 model
access to previous users; check the project's access before relying on it.
See [Google's model availability guidance](https://ai.google.dev/gemini-api/docs/deprecations).
If access is unavailable, explicitly choose an accessible text model using
`GEMINI_MODEL`; the adapter never changes models silently.

From the repository root:

```bash
pnpm --dir apps/web ai:check
pnpm --dir apps/web ai:smoke
```

Both commands load `.env.local` without printing credentials. `ai:check` checks
local configuration only and consumes no API quota. `ai:smoke` explicitly sends
one neutral request, which may incur quota usage or charges; it reports only
success/failure, model and safe HTTP status, not prompt, response or provider
error bodies. Normal tests, builds and deployments do not run it. The smoke
test verifies model access, key validity/restrictions and basic generation.

The adapter accepts text only (up to 8,000 characters), limits output to 1,024
tokens, uses a 30-second request timeout, and disables automatic retries.
Thinking is disabled for 2.5 models for a lightweight baseline. Errors are
normalized without retaining raw exceptions containing request data or keys.

Settings includes a user-owned AI Provider card. Authenticated server actions
use only account-owned credentials. Save validates the entered key with one
neutral prompt, not product data, before storing encrypted credentials. A failed
check never saves the key or enables AI. It never falls back to saved keys or
`GEMINI_API_KEY`. Saved keys expose Delete only; delete before adding another.
Each account is limited to one test per 30 seconds using an atomic database claim.
Settings stores an account-owned model choice, currently limited to
`gemini-3.5-flash-lite`. The connection
test uses the selected model without silently falling back. CLI overrides do
not change user settings. Existing configurations move to 3.5 Flash-Lite.

Migration `0042` stores encrypted keys in `user_ai_settings`. AES-256-GCM uses
random nonces and owner/provider-bound authenticated data. The browser receives
only enabled/provider/has-key/model status, never stored keys or ciphertext. Draft
keys live only in React memory and are cleared after successful save and account changes.
No key or raw provider/database error is logged.
Migration `0043` adds the account model choice; `0044` restricts it to 3.5
Flash-Lite. Neither changes saved ciphertext or cooldowns. Apply both to the development/preview database before testing the new
UI; production requires its own migration when this feature is released.

Prepare local encrypted storage before using Save:

```bash
node apps/web/scripts/setup-ai-encryption.mjs
pnpm --dir apps/web database:migrate
```

The setup command adds a random key to ignored `.env.local`, without displaying
it, and preserves an existing key. Restart the local server afterward. Production
requires its own stable `AI_CREDENTIAL_ENCRYPTION_KEY` deployment secret before
this feature is released. Back up it separately from the database. Losing or
changing it makes saved keys unreadable; rotation requires deliberate
decryption/re-encryption with both old and new keys, not automatic regeneration.

Repeatable settings checks, from `apps/web` with a fresh production build running
locally on port 3001:

```bash
node scripts/check-ai-provider-settings.mjs
BASE_URL=http://localhost:3001 node --env-file=.env.local scripts/check-ai-provider-live.mjs --confirm-development
```

The first check mocks all actions and covers desktop/mobile, both languages and
themes, masked keys, rollback and removal. The second uses the selected
development database and disposable accounts to check authentication, encryption,
account isolation, reload and atomic cooldowns, then removes its test accounts.
Both use fake keys and never call Google. Do not run the live check against a
production database. A genuine model response still requires a user-owned key.

No chat UI, product-data export or AI command execution is added. Chat and
Progress remain hidden pending human confirmation. Future user-facing calls must
check the account's enabled setting, authenticate,
enforce authorization/rate limits, disclose external data transfer and require
confirmation before destructive or scheduling commands. Do not import this
adapter from client components; it uses the SDK's Node-only entry point and
rejects browser configuration.

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

## One-Off Neon Region Copy Variables

Region-to-region data copy is not normal app runtime. The web app still reads
only `NEON_POSTGRES_URL`, but a one-off Neon project or region copy should use
`apps/database/.env.local` with unpooled URLs:

```bash
SOURCE_NEON_UNPOOLED_URL="postgresql://..."
DESTINATION_NEON_UNPOOLED_URL="postgresql://..."
```

Do not commit these variables to `.env.example`, docs, or scripts. Use them
only from the local database helper that runs `pg_dump` and `pg_restore`.
After the copy is verified, update the intended runtime environment's
`NEON_POSTGRES_URL` through `apps/web/.env.local` or through deployment secret
storage.

## Cron Worker

Example file:

- `apps/cron/.dev.vars.example`

Local secret file:

- `apps/cron/.dev.vars`

Production secret storage:

- Cloudflare Worker secret storage for `CRON_SECRET`
- Cloudflare Worker variables in `apps/cron/wrangler.jsonc` for non-secret
  configuration

Current variables:

| Variable | Required now | Purpose |
| --- | --- | --- |
| `WEB_APP_BASE_URL` | Yes | Base URL for the deployed web app that owns the cron route. Production currently points at `https://arctic-aria.vercel.app`. |
| `CRON_SECRET` | Yes | Secret sent to the web app as `Authorization: Bearer <CRON_SECRET>`. This must match the web app's `CRON_SECRET` for the target environment. |

The cron worker is deployed separately from the web app. It does not need
`NEON_POSTGRES_URL`, `AUTH_SESSION_SECRET`, `DISCORD_BOT_TOKEN`,
`DISCORD_APP_ID`, or `DISCORD_PUBLIC_KEY`. Those stay in the web app because
the web cron route owns database reads, Discord delivery, idempotency, and
logging.

## Discord Integration

The Discord integration is implemented inside the web app. Configure these
variables in `apps/web/.env.local` and in the Vercel web project.

Current variables:

| Variable | Required now | Purpose |
| --- | --- | --- |
| `DISCORD_BOT_TOKEN` | Yes to send outbound Discord direct messages, sync commands, and run deploy | Secret bot token from the Discord Developer Portal. |
| `DISCORD_APP_ID` | Yes for command sync and deploy | App ID from the Discord Developer Portal, used by `pnpm --dir apps/web discord:sync-commands`. |
| `DISCORD_PUBLIC_KEY` | Yes to run the HTTP interaction endpoint | Public Key used to verify requests from Discord. |
| `CRON_SECRET` | Yes for scheduled Discord routes | Secret used to authorize internal cron routes such as scheduled Discord notifications. |
| `NEON_POSTGRES_URL` | Yes | Same Neon PostgreSQL database used by the web app. |

Command metadata is synced to Discord with
`pnpm --dir apps/web discord:sync-commands`, and `pnpm --dir apps/web deploy`
includes that step. Each environment should use its own Discord app variables
so local, preview, and production sync the correct Discord app automatically.

Discord account binding is user-facing. The signed-in Arctic Aria user creates
a one-time code in Settings, then runs `/bind code:<code>` in Discord. The old
developer auto-binding prototype is removed and should not be configured.

There is no current Discord message-push shared secret. Outbound Discord direct
messages use an internal server-side service while delivery code lives inside
the web app.

`CRON_SECRET` is separate from Discord secrets. It protects web-hosted scheduled
routes such as `/api/cron/discord-notifications` and
`/api/cron/routine-reminders`; it is not a Discord message-push secret and
should not be used by client code. The Cloudflare cron worker stores the same
secret only so it can invoke those protected web routes.

## Optional App Metadata

The web app can read optional metadata override variables such as `APP_VERSION`,
`APP_COMMIT`, `APP_BRANCH`, and `APP_SOURCE_STATE`. Normal local development
does not need these variables because the app derives metadata from Git when
possible.

In Vercel Git deployments, Arctic Aria treats source state as `clean` when
Vercel commit metadata is available. This avoids false dirty-source warnings
when `pnpm database:migrate` runs after `pnpm build` and build-generated files exist
in the deployment workspace.

Do not set generated `NEXT_PUBLIC_*` metadata variables manually unless
debugging the build system. `apps/web/next.config.ts` generates them from Git,
Vercel metadata, and migration files.
