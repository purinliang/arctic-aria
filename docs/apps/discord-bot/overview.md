# Discord Bot

The Discord bot is an Arctic Aria app surface. It exists for quick interaction
when the user is away from the web app, but it must not own product planning,
routine, idea, scheduler, or review rules.

The first bot runtime scaffold is implemented under `apps/discord-bot`.

## First Workflow

The first Discord workflow is quick idea capture:

```text
/idea text:<raw text>
```

The bot should:

- accept the command in a direct-message oriented personal workflow
- validate that the Discord user is bound to an Arctic Aria user
- pass the raw text to an Ideas command or service
- store the idea as `untriaged`
- reply with a concise private acknowledgement

The command name is `/idea`, not `/capture`, so the app surface matches the
product entity.

## First Runtime Direction

The first implementation is a separate TypeScript app under
`apps/discord-bot`, using Discord HTTP Interactions.

Do not run a long-lived Gateway connection for the first `/idea` workflow. The
runtime should expose a public `/interactions` HTTP endpoint, verify Discord
request signatures with `DISCORD_PUBLIC_KEY`, respond to Discord `PING`
verification, and handle slash commands synchronously. Local development needs a
public tunnel such as ngrok so Discord can reach the local endpoint.

The first `/idea` command should support personal use without adding the app to
a server. Register it with `integration_types = [USER_INSTALL]` and
`contexts = [GUILD, BOT_DM, PRIVATE_CHANNEL]`. `GUILD` here still uses the
personal user install; it lets the developer invoke `/idea` from a server
channel without installing Arctic Aria into that server.

`discord.js` is still used for command registration. It should not be used for
`client.login()` unless a later feature genuinely needs Gateway events.

Planned environment variables:

- `DISCORD_BOT_TOKEN`
- `DISCORD_APP_ID`
- `DISCORD_PUBLIC_KEY`
- `DISCORD_DEVELOPER_USER_ID`
- `ARCTIC_ARIA_DEVELOPER_USERNAME`
- `NEON_POSTGRES_URL`
- optional `PORT`, defaulting to `3001`

Do not commit Discord tokens, application secrets, database URLs, or generated
command credentials.

Use `DISCORD_APP_ID` consistently for the Discord app id. Discord OAuth2 calls
the same value `client_id`, but Arctic Aria should not configure a second env
name unless a later OAuth implementation has a concrete provider constraint.

Local scripts read `apps/discord-bot/.env.local`. Use
`apps/discord-bot/.env.example` as the non-secret template.

## Code Locations

- Runtime: `apps/discord-bot/src/index.ts`
- HTTP interaction server: `apps/discord-bot/src/interaction-server.ts`
- HTTP interaction handler: `apps/discord-bot/src/interaction-handler.ts`
- Command registration: `apps/discord-bot/src/register-commands.ts`
- Slash command metadata: `apps/discord-bot/src/discord-commands.ts`
- `/idea` capture command: `apps/discord-bot/src/idea-capture.ts`
- Developer prototype binding: `apps/discord-bot/src/developer-binding.ts`
- Database URL helper: `apps/discord-bot/src/database.ts`

## Account Binding

Discord account binding should use a separate `discord_accounts` table, not
columns on `users`.

The `users` table is core Arctic Aria auth identity. Discord binding is
app-surface identity and may need Discord-specific metadata, status, revocation,
and audit fields later.

The first binding model should enforce:

- one Arctic Aria user per Discord user
- at most one Discord user per Arctic Aria user
- a clear link to `users.id`

The first developer prototype uses environment settings to bind the
developer's Discord account to one existing Arctic Aria user. Token-based
binding can be added later when the bot needs normal multi-user setup.

For personal local testing in Discord Developer Portal:

- Installation -> Installation Contexts: enable `User Install`.
- Installation -> Default Install Settings -> User Install: add
  `applications.commands`.
- Installation -> Install Link: use Discord Provided Link.
- Open the install link and choose `Add to my apps`.
- After install, run `/idea` from the app DM if Discord exposes it. If the app
  DM is not available, run `/idea` from any server channel; it is still the
  personal user-installed command, not a server-installed bot command.

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

- `discord_user_id` is unique.
- `user_id` is unique.
- `binding_status` is one of `active` or `revoked`.
- queries that load a binding for product commands must require
  `binding_status = 'active'`.

## Chat Scope

The first bot supports command chat only. It should reply conversationally to
slash commands, but normal direct messages are not captured.

Do not add open AI conversation, message-content ingestion, or "every DM is an
idea" behavior in the first bot implementation. Those behaviors need separate
privacy, rate-limit, and intent rules.

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

Future notification pushes from the web app should be implemented as an
explicit HTTP/job interface into the Discord app surface, then the Discord app
can send messages through the Discord HTTP API. Do not add a long-running
Gateway listener just to receive internal Arctic Aria notification work.

## Data Flow

First `/idea` flow:

```text
Discord slash command
  -> Discord POSTs to /interactions
  -> bot verifies the Discord request signature
  -> bot validates Discord binding
  -> bot calls Ideas capture command
  -> Ideas validates raw text
  -> database stores an untriaged idea
  -> bot sends private acknowledgement
```

The bot should not write planning, routine, memory, or review tables directly.
It should call product commands that own validation and state transitions.

## Local Runbook

1. Configure `apps/discord-bot/.env.local`.

   Required keys:

   - `DISCORD_BOT_TOKEN`
   - `DISCORD_APP_ID`
   - `DISCORD_PUBLIC_KEY`
   - `DISCORD_DEVELOPER_USER_ID`
   - `ARCTIC_ARIA_DEVELOPER_USERNAME`
   - `NEON_POSTGRES_URL`

   Optional key:

   - `PORT`, defaulting to `3001`

2. Apply web database migrations from the repo root:

   ```bash
   pnpm --dir apps/web db:migrate
   ```

3. Register slash commands after command metadata changes:

   ```bash
   pnpm --dir apps/discord-bot register-commands
   ```

4. Run the interaction HTTP server:

   ```bash
   pnpm --dir apps/discord-bot dev
   ```

   A healthy startup prints one concise `ready` log:

   ```text
   [discord-bot] ready {
     port: 3001,
     localBaseUrl: 'http://localhost:3001'
   }
   ```

5. Check the local health endpoint:

   ```bash
   curl http://localhost:3001/health
   ```

   Expected response:

   ```json
   {"ok":true}
   ```

   `/health` is an Arctic Aria liveness check, not a Discord endpoint. It is
   useful for checking that the local server or a deployed host is running.

6. Expose the local server with ngrok during local development:

   ```bash
   ngrok http 3001
   ```

   If using a reserved ngrok domain:

   ```bash
   ngrok http --url=<your-ngrok-domain> 3001
   ```

7. Set Discord Developer Portal -> General Information ->
   Interactions Endpoint URL to:

   ```text
   https://<your-ngrok-domain>/interactions
   ```

   Use `/interactions`, not `/` or `/health`. Discord sends `POST` requests to
   this path. Opening `/interactions` directly in a browser sends `GET`, so the
   server explains that it is not a browser page.

8. In Discord Developer Portal -> Installation:

   - Installation Contexts: enable `User Install`.
   - Default Install Settings -> User Install: add `applications.commands`.
   - Install Link: use Discord Provided Link.
   - Open the install link and choose `Add to my apps`.

9. Run `/idea text:<raw text>` in Discord.

   Prefer the Arctic Aria app DM if Discord exposes it. If the app DM is not
   available, run `/idea` from any server channel; because the command is
   registered as `USER_INSTALL`, this still uses the developer's personal app
   install and does not require installing Arctic Aria into that server.

10. Confirm the bot server logs:

    ```text
    [discord-bot] interaction_handled { command: '/idea', status: 200 }
    ```

11. Check captured ideas in the web app:

    - Run `pnpm --dir apps/web dev` if needed.
    - Open `http://localhost:3000`.
    - Sign in as `ARCTIC_ARIA_DEVELOPER_USERNAME`.
    - Click `Ideas` in the left sidebar.

## Troubleshooting

- `{"error":"Not found."}` at the ngrok root URL is expected. Use `/health`
  for liveness checks and configure `/interactions` for Discord.
- Opening `/interactions` in a browser is expected to return a method message
  because the Discord endpoint only accepts signed `POST` requests.
- `This command is outdated` usually means Discord is using cached command
  metadata after `register-commands`. Refresh/restart Discord or wait a few
  minutes.
- `The application did not respond` means Discord did not get a valid response
  from the interaction endpoint in time. Check that `pnpm --dir
  apps/discord-bot dev` is still running, ngrok is still online, the Discord
  endpoint URL ends with `/interactions`, and the bot terminal prints
  `interaction_handled { command: '/idea', status: 200 }`.
- `startup_failed` with `code: 'EADDRINUSE'` means another local process is
  already using the configured `PORT`. Stop the existing bot process or set a
  different `PORT` in `apps/discord-bot/.env.local` and update the ngrok
  command to the same port.
- If `/idea` does not appear in the app DM, run it from a server channel after
  user-installing the app. The command is intentionally registered for
  `GUILD`, `BOT_DM`, and `PRIVATE_CHANNEL` contexts.

## Deployment Direction

ngrok is appropriate for local development because Discord needs a public HTTPS
URL while the server is running on the developer's machine. It is not the
production design.

To avoid ngrok, deploy the Discord interaction server to a public HTTPS Node.js
host and set Discord Developer Portal -> General Information -> Interactions
Endpoint URL to:

```text
https://<deployed-discord-app-host>/interactions
```

The deployment must provide the same env values as local development and share
the same Neon database. Possible hosting directions include a small Node service
on a platform such as Railway, Fly.io, Render, or Google Cloud Run. A later
review can also decide whether to move `/interactions` into the existing web
deployment if keeping the Discord surface inside the Next.js app becomes more
practical.

## Verification

Run from `apps/discord-bot`:

```bash
pnpm test
pnpm build
```
