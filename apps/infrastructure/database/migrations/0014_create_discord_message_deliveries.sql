CREATE TABLE IF NOT EXISTS discord_message_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  discord_account_id uuid REFERENCES discord_accounts(id),
  idempotency_key text NOT NULL,
  content_hash text NOT NULL,
  source text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  delivery_status text NOT NULL DEFAULT 'pending',
  discord_message_id text,
  error_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  failed_at timestamptz,
  CONSTRAINT discord_message_deliveries_key_length CHECK (
    char_length(btrim(idempotency_key)) BETWEEN 1 AND 160
  ),
  CONSTRAINT discord_message_deliveries_hash_valid CHECK (
    content_hash ~ '^[a-f0-9]{64}$'
  ),
  CONSTRAINT discord_message_deliveries_source_valid CHECK (
    source IN ('web', 'scheduler', 'manual', 'agent')
  ),
  CONSTRAINT discord_message_deliveries_status_valid CHECK (
    delivery_status IN ('pending', 'sent', 'failed', 'skipped')
  ),
  CONSTRAINT discord_message_deliveries_terminal_state_valid CHECK (
    (delivery_status = 'sent' AND sent_at IS NOT NULL AND failed_at IS NULL)
    OR (delivery_status = 'failed' AND failed_at IS NOT NULL AND sent_at IS NULL)
    OR (delivery_status IN ('pending', 'skipped') AND sent_at IS NULL AND failed_at IS NULL)
  ),
  CONSTRAINT discord_message_deliveries_message_id_valid CHECK (
    discord_message_id IS NULL OR discord_message_id ~ '^[0-9]{5,32}$'
  ),
  CONSTRAINT discord_message_deliveries_error_code_valid CHECK (
    error_code IS NULL OR char_length(error_code) <= 80
  ),
  CONSTRAINT discord_message_deliveries_user_key_unique UNIQUE (
    user_id,
    idempotency_key
  )
);

CREATE INDEX IF NOT EXISTS discord_message_deliveries_user_created_idx
  ON discord_message_deliveries (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS discord_message_deliveries_status_created_idx
  ON discord_message_deliveries (delivery_status, created_at);
