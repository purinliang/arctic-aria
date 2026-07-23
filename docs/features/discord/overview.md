# Discord Integration

Discord is an Arctic Aria integration for quick interaction away from the web
UI. It is implemented inside the Next.js web app and does not own product
planning, routine, idea, scheduler, or review rules.

There is no separate Discord runtime app. Discord HTTP Interactions, command
registration, outbound direct-message delivery, and Settings binding support
all live under `apps/web`.

Implemented capabilities:

- `/bind code:<code>` for user-facing Discord account binding
- `/idea text:<raw text>` for quick idea capture
- outbound Discord direct messages through an internal server-side service
- Settings -> Discord -> `Send Test` for manual direct-message verification

Direction terms:

- `inbound interaction`: Discord sends a slash command or interaction to Arctic
  Aria
- `outbound message`: Arctic Aria sends a Discord DM through the Discord HTTP
  API

Use these terms from the Arctic Aria system point of view.

## Runtime

Runtime code lives in `apps/web`.

Code locations:

- Interaction route: `apps/web/src/app/api/discord/interactions/route.ts`
- Interaction endpoint:
  `apps/web/src/features/discord/server/interaction-endpoint.ts`
- Slash command metadata:
  `apps/web/src/features/discord/server/commands.ts`
- Command sync script:
  `apps/web/src/features/discord/server/sync-commands.ts`
- `/bind` behavior:
  `apps/web/src/features/discord/server/account-binding.ts`
- `/idea` behavior:
  `apps/web/src/features/discord/server/idea-capturing.ts`
- Outbound message behavior:
  `apps/web/src/features/discord/server/message-push.ts`
- Discord HTTP sender:
  `apps/web/src/features/discord/server/discord-api.ts`

The runtime uses Discord HTTP Interactions. Do not add a long-running Gateway
listener unless a later feature genuinely needs Gateway events.

## Endpoints

Discord Developer Portal -> General Information -> Interactions Endpoint URL:

```text
https://<web-host>/api/discord/interactions
```

Local development with ngrok:

```text
https://<ngrok-domain>/api/discord/interactions
```

## Environment

All current Discord variables belong in `apps/web/.env.local` locally and in
the Vercel web project environment for deployment:

- `DISCORD_BOT_TOKEN`
- `DISCORD_APP_ID` when syncing slash commands
- `DISCORD_PUBLIC_KEY`

The web app also needs its normal shared variables, such as `NEON_POSTGRES_URL`
and `AUTH_SESSION_SECRET`.

## Command Metadata

Slash command names and metadata live in
`apps/web/src/features/discord/server/commands.ts`.

After changing slash command metadata, make sure `apps/web/.env.local` points
at the intended Discord app and run:

```bash
pnpm --dir apps/web discord:sync-commands
```

This command uses `DISCORD_APP_ID` and `DISCORD_BOT_TOKEN` to push global
commands to Discord. For user-installed Discord apps, installed command metadata
can still be stale after command settings change. After adding, renaming, or
changing slash-command options, reinstall or re-authorize the app from Discord
Developer Portal -> Installation -> Install Link, then refresh or restart the
Discord client.

Recommended Discord Developer Portal settings:

- Installation -> Installation Contexts: enable `User Install`
- Installation -> Default Install Settings -> User Install: add
  `applications.commands`
- Installation -> Install Link: use Discord Provided Link

## Local Runbook

1. Configure `apps/web/.env.local`.

2. Apply database migrations:

   ```bash
   pnpm --dir apps/web database:migrate
   ```

3. Sync slash commands if metadata changed or if this is a new dev bot:

   ```bash
   pnpm --dir apps/web discord:sync-commands
   ```

4. Start the web app:

   ```bash
   pnpm --dir apps/web dev
   ```

5. Expose local Next.js with ngrok:

   ```bash
   pnpm --dir apps/web discord:ngrok
   ```

   If you have a fixed ngrok domain, set `DISCORD_NGROK_DOMAIN` in
   `apps/web/.env.local` first. For example:

   ```text
   DISCORD_NGROK_DOMAIN=your-fixed-domain.ngrok-free.dev
   ```

   The script forwards ngrok to local port `3000`. It does not start Next.js;
   keep `pnpm --dir apps/web dev` running in a separate terminal.

6. Set the Discord interaction endpoint to:

   ```text
   https://<ngrok-domain>/api/discord/interactions
   ```

7. Bind the Discord account from the web Settings page.

   - Open `http://localhost:3000`.
   - Sign in to the Arctic Aria account.
   - Open `Settings`.
   - Create a Discord binding code.
   - Run `/bind code:<code>` in Discord.

8. Run `/idea text:<raw text>` in Discord.

9. Check captured ideas in the web app under `Ideas`.

10. Verify outbound push with Settings -> Discord -> `Send Test`.

Expected Discord DM:

```text
Hello from Arctic Aria. Discord message push is working.
```

## Outbound Direct Messages

Outbound direct messages are implemented as an internal server-side service, not
as a private HTTP endpoint. Product features should use the shared Discord
notification service, which wraps the delivery service and keeps Settings,
routine reminders, and Today Review messages on the same outbound path.
Settings -> Discord -> `Send Test` is a thin manual caller of this shared
notification service.

Do not reintroduce a private message-push HTTP endpoint or shared message-push
secret unless a later feature moves message delivery into a separate runtime or
external caller. If that happens, design the service authentication at that
time.

Delivery records use `discord_message_deliveries`. The table stores delivery
state without raw message text.

Current server-side notification entry points:

- `apps/web/src/features/discord/server/notification-service.ts`
- `apps/web/src/features/discord/server/message-push.ts`
- `apps/web/src/features/discord/server/discord-api.ts`

Routine reminders and Daily Review messages use the same notification service.
The scheduled caller is the Cloudflare cron worker in `apps/cron`, which invokes
the web cron route `/api/cron/discord-notifications` with `CRON_SECRET`. The
older routine-only route `/api/cron/routine-reminders` remains available for
manual routine reminder checks.

The scheduled route is configured to run every 15 minutes. Routine reminders
use `routine_instances.remind_at`, not exact preferred-time matching. Cron
ensures due routine instances, sends pending instances when `remind_at` is
inside the current due window, sets `reminded_at` after successful delivery, and
uses a `routine-reminder:<digest>` idempotency key derived from the grouped
routine instance ids, user ids, and `remind_at` values. Daily Review sends
during the local `23:48-00:12` window so the 15-minute cron cadence does not
need to hit midnight exactly. After-midnight sends still use the previous local
date, and the per-user idempotency key is `daily-review:<date>`. If timezone
preference is `system`, the server uses the last browser-resolved concrete
timezone stored in `user_settings.resolved_timezone`. If no concrete timezone is
available, scheduled Daily Review is skipped rather than falling back to UTC.

Implemented `discord_message_deliveries` fields:

- `id uuid PRIMARY KEY`
- `user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE`
- `discord_account_id uuid REFERENCES discord_accounts(id)`
- `idempotency_key text NOT NULL`
- `content_hash text NOT NULL`
- `source text NOT NULL`
- `metadata jsonb NOT NULL DEFAULT '{}'::jsonb`
- `delivery_status text NOT NULL DEFAULT 'pending'`
- `discord_message_id text`
- `error_code text`
- `created_at timestamptz NOT NULL DEFAULT now()`
- `sent_at timestamptz`
- `failed_at timestamptz`

Implemented constraints:

- `(user_id, idempotency_key)` is unique
- `source` is `web`, `scheduler`, `manual`, or `agent`
- `delivery_status` is `pending`, `sent`, `failed`, or `skipped`
- sent rows must set `sent_at` and not `failed_at`
- failed rows must set `failed_at` and not `sent_at`
- pending and skipped rows must not set `sent_at` or `failed_at`

Idempotency behavior:

- same user id, same idempotency key, same content hash: return the existing
  delivery result and do not send again
- same user id, same idempotency key, different content hash: return a conflict
- failed sends keep the idempotency row; a retry policy is future work

## Account Binding

Discord account binding uses a separate `discord_accounts` table, not columns on
`users`.

The `users` table is core Arctic Aria auth identity. Discord binding is
app-surface identity and may need Discord-specific metadata, status, revocation,
and audit fields later.

The implemented binding model enforces:

- one Arctic Aria user per active Discord user
- at most one active Discord user per Arctic Aria user
- a clear link to `users.id`

The implemented code flow:

```text
Settings page
  -> creates one-time binding code for signed-in Arctic Aria user
  -> user runs /bind code:<code> in Discord
  -> Discord POSTs to /api/discord/interactions
  -> web route verifies Discord request signature
  -> web route validates and consumes binding code
  -> web route upserts discord_accounts for the Arctic Aria user
  -> web route sends private acknowledgement
```

Implemented `discord_accounts` fields:

- `id uuid PRIMARY KEY`
- `user_id uuid NOT NULL REFERENCES users(id)`
- `discord_user_id text NOT NULL`
- `discord_username text`
- `dm_channel_id text`
- `binding_status text NOT NULL DEFAULT 'active'`
- `last_interaction_at timestamptz`
- `created_at timestamptz NOT NULL DEFAULT now()`
- `updated_at timestamptz NOT NULL DEFAULT now()`
- `revoked_at timestamptz`

Implemented constraints:

- active `discord_user_id` values are unique
- `user_id` is unique
- `binding_status` is one of `active` or `revoked`
- product command lookups require `binding_status = 'active'`

Implemented `discord_binding_codes` fields:

- `id uuid PRIMARY KEY`
- `user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE`
- `code_hash text NOT NULL UNIQUE`
- `expires_at timestamptz NOT NULL`
- `consumed_at timestamptz`
- `created_at timestamptz NOT NULL DEFAULT now()`

Binding-code rules:

- codes expire after 15 minutes
- codes can be consumed once
- raw codes are never stored
- creating a new code consumes previous unconsumed codes for the same user
- expired and consumed codes are ignored by normal binding lookups

## `/idea`

Inbound `/idea` flow:

```text
Discord slash command
  -> Discord POSTs to /api/discord/interactions
  -> web route verifies the Discord request signature
  -> web route validates Discord binding
  -> Ideas command validates raw text
  -> database stores an untriaged idea
  -> web route sends private acknowledgement
```

The command name is `/idea`, not `/capture`, so the Discord interaction matches
the product entity.

The first Discord workflow supports command chat only. It should reply
conversationally to slash commands, but normal direct messages are not
captured.

Do not add open AI conversation, message-content ingestion, or "every DM is an
idea" behavior without separate privacy, rate-limit, and intent rules.

## Troubleshooting

- Opening `/api/discord/interactions` in a browser is expected to return a
  method message because Discord uses signed `POST` requests.
- `This command is outdated` usually means Discord is using cached command
  metadata. Re-run `pnpm --dir apps/web discord:sync-commands`, refresh or
  restart Discord, and reinstall or re-authorize the user-installed app when
  command options changed.
- `The application did not respond` means Discord did not get a valid response
  from the interaction endpoint in time. Check that the web deployment is
  reachable, the endpoint URL ends with `/api/discord/interactions`, and
  `DISCORD_PUBLIC_KEY` is configured in the web environment.
- `Discord configuration is missing` from Settings `Send Test` means the web
  environment is missing `DISCORD_BOT_TOKEN`. The user-facing notification stays
  generic; check the web server log for the missing environment variable.

## Deferred Workflows

The following Discord workflows are future work:

- project task reminders
- `Done`, `Busy`, and `Skip` reminder buttons
- richer daily status messages
- daily review prompts
- updating existing reminder messages to avoid channel noise
- free-text DM capture
- AI chat

Reminder delivery will need Scheduler or reminder-job design before
implementation. Redis, queues, and event/dataflow should remain deferred until a
concrete delivery, retry, idempotency, or rate-limit need appears.

## Verification

Run from the repository root:

```bash
pnpm --dir apps/web test
pnpm --dir apps/web lint
pnpm --dir apps/web build
```
