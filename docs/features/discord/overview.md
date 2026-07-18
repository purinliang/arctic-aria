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
- outbound Discord direct messages through the private message-push endpoint
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
- Message push route:
  `apps/web/src/app/api/internal/discord/messages/route.ts`
- Interaction endpoint:
  `apps/web/src/features/discord/server/interaction-endpoint.ts`
- Message push endpoint:
  `apps/web/src/features/discord/server/message-push-endpoint.ts`
- Slash command metadata:
  `apps/web/src/features/discord/server/commands.ts`
- Command registration:
  `apps/web/src/features/discord/server/register-commands.ts`
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

Private outbound message endpoint:

```text
POST /api/internal/discord/messages
```

The private endpoint requires:

```text
Authorization: Bearer <DISCORD_MESSAGE_PUSH_SECRET>
```

## Environment

All current Discord runtime variables belong in `apps/web/.env.local` locally
and in the Vercel web project environment for deployment:

- `DISCORD_BOT_TOKEN`
- `DISCORD_APP_ID`
- `DISCORD_PUBLIC_KEY`
- `DISCORD_MESSAGE_PUSH_SECRET`
- `NEON_POSTGRES_URL`

## Command Registration

After changing slash command metadata in
`apps/web/src/features/discord/server/commands.ts`, run:

```bash
pnpm --dir apps/web discord:register-commands
```

For user-installed Discord apps, registration updates Discord's global command
metadata, but an installed app can still show stale commands. After adding,
renaming, or changing slash-command options, reinstall or re-authorize the app
from Discord Developer Portal -> Installation -> Install Link, then refresh or
restart the Discord client.

Recommended Discord Developer Portal settings:

- Installation -> Installation Contexts: enable `User Install`
- Installation -> Default Install Settings -> User Install: add
  `applications.commands`
- Installation -> Install Link: use Discord Provided Link

## Local Runbook

1. Configure `apps/web/.env.local`.

2. Apply database migrations:

   ```bash
   pnpm --dir apps/web db:migrate
   ```

3. Register slash commands if metadata changed:

   ```bash
   pnpm --dir apps/web discord:register-commands
   ```

4. Start the web app:

   ```bash
   pnpm --dir apps/web dev
   ```

5. Expose local Next.js with ngrok:

   ```bash
   ngrok http 3000
   ```

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
  metadata. Re-run `pnpm --dir apps/web discord:register-commands`, refresh or
  restart Discord, and reinstall or re-authorize the user-installed app when
  command options changed.
- `The application did not respond` means Discord did not get a valid response
  from the interaction endpoint in time. Check that the web deployment is
  reachable, the endpoint URL ends with `/api/discord/interactions`, and
  `DISCORD_PUBLIC_KEY` is configured in the web environment.
- `Discord configuration is missing` from Settings `Send Test` means the web
  environment is missing `DISCORD_BOT_TOKEN`. The user-facing notification stays
  generic; check the web server log for the missing environment variable.
- `Discord message-push secret was rejected` means the caller and endpoint do
  not use the same `DISCORD_MESSAGE_PUSH_SECRET`. This applies to direct HTTP
  callers of `/api/internal/discord/messages`, not Settings `Send Test`.

## Deferred Workflows

The following Discord workflows are future work:

- routine reminders
- project task reminders
- `Done`, `Busy`, and `Skip` reminder buttons
- daily status messages
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
