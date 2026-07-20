CREATE TABLE IF NOT EXISTS ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  raw_text text NOT NULL,
  source text NOT NULL,
  triage_status text NOT NULL DEFAULT 'untriaged',
  source_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  converted_target_type text,
  converted_target_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz,
  CONSTRAINT ideas_raw_text_length CHECK (
    char_length(btrim(raw_text)) BETWEEN 1 AND 2000
  ),
  CONSTRAINT ideas_source_valid CHECK (
    source IN ('web', 'discord', 'mobile', 'agent')
  ),
  CONSTRAINT ideas_triage_status_valid CHECK (
    triage_status IN ('untriaged', 'kept', 'converted', 'archived')
  ),
  CONSTRAINT ideas_converted_target_type_valid CHECK (
    converted_target_type IS NULL
    OR converted_target_type IN (
      'project',
      'task',
      'routine',
      'memory',
      'plugin_request'
    )
  ),
  CONSTRAINT ideas_converted_target_pair CHECK (
    (converted_target_type IS NULL AND converted_target_id IS NULL)
    OR (converted_target_type IS NOT NULL AND converted_target_id IS NOT NULL)
  ),
  CONSTRAINT ideas_archive_status_consistent CHECK (
    (triage_status = 'archived' AND archived_at IS NOT NULL)
    OR (triage_status <> 'archived' AND archived_at IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS ideas_user_created_at_idx
  ON ideas (user_id, created_at DESC)
  WHERE archived_at IS NULL;

CREATE TABLE IF NOT EXISTS discord_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  discord_user_id text NOT NULL UNIQUE,
  discord_username text,
  dm_channel_id text,
  binding_status text NOT NULL DEFAULT 'active',
  last_interaction_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  CONSTRAINT discord_accounts_user_unique UNIQUE (user_id),
  CONSTRAINT discord_accounts_discord_user_id_valid CHECK (
    discord_user_id ~ '^[0-9]{5,32}$'
  ),
  CONSTRAINT discord_accounts_dm_channel_id_valid CHECK (
    dm_channel_id IS NULL OR dm_channel_id ~ '^[0-9]{5,32}$'
  ),
  CONSTRAINT discord_accounts_binding_status_valid CHECK (
    binding_status IN ('active', 'revoked')
  ),
  CONSTRAINT discord_accounts_revoked_status_consistent CHECK (
    (binding_status = 'revoked' AND revoked_at IS NOT NULL)
    OR (binding_status = 'active' AND revoked_at IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS discord_accounts_active_discord_user_idx
  ON discord_accounts (discord_user_id)
  WHERE binding_status = 'active';
