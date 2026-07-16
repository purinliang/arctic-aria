# Discord Bot

The Discord bot is an Arctic Aria app surface. It exists for quick interaction
when the user is away from the web app, but it must not own product planning,
routine, idea, scheduler, or review rules.

The first bot is planned and not implemented yet.

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

The first implementation should be a separate TypeScript app, likely
`apps/discord-bot`, using `discord.js`.

Do not implement the bot inside the Next.js web app unless a later deployment
review decides that webhooks are a better first runtime. The bot should share
product contracts or services only after there is enough duplication to justify
extracting shared packages.

Planned environment variables:

- `DISCORD_BOT_TOKEN`
- `DISCORD_CLIENT_ID`
- `DISCORD_OWNER_USER_ID`
- `ARCTIC_ARIA_OWNER_USERNAME` or a stable owner user id setting
- `NEON_POSTGRES_URL`

Do not commit Discord tokens, application secrets, database URLs, or generated
command credentials.

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

The first personal prototype can use an owner environment setting to bind the
configured Discord user to one existing Arctic Aria user. Token-based binding
can be added later when the bot needs normal multi-user setup.

Planned `discord_accounts` fields:

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

Planned constraints:

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

## Data Flow

First `/idea` flow:

```text
Discord slash command
  -> bot validates Discord binding
  -> bot calls Ideas capture command
  -> Ideas validates raw text
  -> database stores an untriaged idea
  -> bot sends private acknowledgement
```

The bot should not write planning, routine, memory, or review tables directly.
It should call product commands that own validation and state transitions.
