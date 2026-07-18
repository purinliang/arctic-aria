# Ideas Data Model

Ideas persistence stores quick-captured thoughts for later triage.

The first table is implemented by
`apps/infrastructure/database/migrations/0012_create_ideas_and_discord_accounts.sql`.

## `ideas`

`ideas` stores one captured thought.

Current columns:

- `id uuid PRIMARY KEY`
- `user_id uuid NOT NULL REFERENCES users(id)`
- `raw_text text NOT NULL`
- `source text NOT NULL`
- `triage_status text NOT NULL DEFAULT 'untriaged'`
- `source_metadata jsonb NOT NULL DEFAULT '{}'::jsonb`
- `converted_target_type text`
- `converted_target_id uuid`
- `created_at timestamptz NOT NULL DEFAULT now()`
- `updated_at timestamptz NOT NULL DEFAULT now()`
- `archived_at timestamptz`

Current source values:

- `web`
- `discord`
- `mobile`
- `agent`

Current triage statuses:

- `untriaged`: captured but not reviewed.
- `kept`: intentionally kept as an idea or note.
- `converted`: converted into another product entity.
- `archived`: hidden from normal idea review.

## Backend Rules

Capture and edit commands should:

- require an authenticated or bound user
- trim raw text before validation
- reject empty or blank-only text
- reject text longer than 2,000 characters
- store `source = 'discord'` for Discord `/idea` captures
- store `source = 'web'` for web-created ideas
- scope every update or archive query by both `user_id` and `id`
- store safe source metadata, such as Discord user id, interaction id, and
  timestamp

Source metadata must not store Discord tokens, auth cookies, database URLs,
or other secrets.

## Database Constraints

The database should provide final consistency with:

- foreign key ownership through `user_id`
- allowed values for `source`
- allowed values for `triage_status`
- raw text length from 1 to 2,000 characters after trimming
- archive timestamp used only for hidden rows

Ideas are user-owned data. Queries must always scope ideas by `user_id`.

## Deletion

The user-visible delete behavior archives an idea by setting
`triage_status = 'archived'` and `archived_at`. Normal Ideas page queries hide
archived rows.

Hard delete may be reserved for account deletion, where the owning `users` row
can cascade cleanup if the migration chooses `ON DELETE CASCADE`.

## Discord Capture Metadata

For a Discord `/idea` capture, `source_metadata` should include only safe audit
context:

- `discordUserId`
- `interactionId`
- `channelKind`, such as `dm`
- `createdAt`

Do not store full message content in `source_metadata`; the canonical captured
text is `raw_text`.
