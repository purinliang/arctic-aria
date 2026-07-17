ALTER TABLE discord_accounts
  DROP CONSTRAINT IF EXISTS discord_accounts_discord_user_id_key;

DROP INDEX IF EXISTS discord_accounts_active_discord_user_idx;

CREATE UNIQUE INDEX IF NOT EXISTS discord_accounts_active_discord_user_unique
  ON discord_accounts (discord_user_id)
  WHERE binding_status = 'active';

CREATE TABLE IF NOT EXISTS discord_binding_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT discord_binding_codes_code_hash_valid CHECK (
    code_hash ~ '^[a-f0-9]{64}$'
  ),
  CONSTRAINT discord_binding_codes_expiry_valid CHECK (
    expires_at > created_at
  )
);

CREATE INDEX IF NOT EXISTS discord_binding_codes_active_hash_idx
  ON discord_binding_codes (code_hash)
  WHERE consumed_at IS NULL;

CREATE INDEX IF NOT EXISTS discord_binding_codes_user_active_idx
  ON discord_binding_codes (user_id, created_at DESC)
  WHERE consumed_at IS NULL;
