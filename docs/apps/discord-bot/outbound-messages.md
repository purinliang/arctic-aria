# Discord Outbound Messages

This document describes the internal API for sending Arctic Aria messages to a
user's Discord DM through the Discord bot service.

## Purpose

Outbound messages let Arctic Aria services ask the Discord bot to deliver a
plain DM to a Discord account already bound to an Arctic Aria user.

The first version supports plain text DM delivery only. Buttons, channel
messages, reminder workflows, retries, queues, and scheduling remain future
work.

Naming note:

- use `outbound messages` for this feature in docs
- use `inbound interactions` for Discord slash commands and interaction
  requests sent to Arctic Aria
- keep `/internal/discord/messages` as the private service-to-service endpoint
- use `secret`, not `key`, because the value must remain private and is used
  only to authorize this private endpoint

## API

Endpoint:

```text
POST /internal/discord/messages
```

Authentication:

- caller sends `Authorization: Bearer <DISCORD_MESSAGE_PUSH_SECRET>`
- bot compares the bearer token to `DISCORD_MESSAGE_PUSH_SECRET`
- reject missing or mismatched secrets with `401`
- never log the secret or raw request body

Request body:

```json
{
  "userId": "arctic-aria-user-id",
  "idempotencyKey": "stable-message-key",
  "text": "message text",
  "source": "web",
  "metadata": {
    "feature": "routine",
    "entityId": "optional-id"
  }
}
```

Fields:

- `userId`: Arctic Aria user id that owns the Discord binding
- `idempotencyKey`: stable key chosen by the caller for this logical message
- `text`: Discord DM body, trimmed, required, maximum 2000 characters
- `source`: `web`, `scheduler`, `manual`, or `agent`
- `metadata`: optional JSON object for safe routing context

Responses:

- `200`: message already delivered or accepted and delivered
- `400`: invalid request body
- `401`: invalid message-push secret
- `404`: no active Discord binding for the Arctic Aria user
- `409`: idempotency key reused for different content
- `502`: Discord API rejected or failed the send request

Successful responses should include only delivery metadata, not the raw
message text.

## Data Flow

```text
Arctic Aria service
  -> POST /internal/discord/messages
  -> bot validates message-push secret
  -> bot validates request body
  -> bot loads active discord_accounts row by Arctic Aria user id
  -> bot sends DM through Discord HTTP API
  -> bot records delivery status
  -> bot returns delivery result
```

The Discord bot may call Discord HTTP directly. It should not require a Gateway
connection for outbound messages.

## Delivery Records

Outbound messages use a delivery/idempotency table. The table stores delivery
state without raw message text.

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

Constraints:

- `(user_id, idempotency_key)` is unique
- `source` is `web`, `scheduler`, `manual`, or `agent`
- `delivery_status` is `pending`, `sent`, `failed`, or `skipped`
- sent rows must set `sent_at` and not `failed_at`
- failed rows must set `failed_at` and not `sent_at`
- pending and skipped rows must not set `sent_at` or `failed_at`

Idempotency behavior:

- same `userId`, same `idempotencyKey`, same `contentHash`: return the existing
  delivery result and do not send again
- same `userId`, same `idempotencyKey`, different `contentHash`: return `409`
- failed sends keep the idempotency row; the current endpoint returns the
  existing failed result for the same idempotency key

## Logging

Logs may include:

- command name
- status code
- Arctic Aria user id
- delivery id
- Discord API error code

Logs must not include:

- `DISCORD_MESSAGE_PUSH_SECRET`
- `DISCORD_BOT_TOKEN`
- raw message text
- full request body
- full Discord API response body if it may include message content

Successful delivery log shape:

```text
[discord-bot] outbound_message_handled { status: 200, deliveryId: "..." }
```

## Future Work

Deferred features:

- delivery retries and backoff
- scheduled reminder jobs
- Redis queue or database queue
- buttons such as Done, Busy, Skip
- updating old Discord messages instead of sending new messages
- channel or server destination management
