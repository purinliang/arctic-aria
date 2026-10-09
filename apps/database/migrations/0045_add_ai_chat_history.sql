CREATE TABLE ai_chat_exchanges (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_text text NOT NULL CHECK (length(btrim(user_text)) BETWEEN 1 AND 4000),
  assistant_text text CHECK (length(assistant_text) BETWEEN 1 AND 16000),
  model text NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'complete', 'failed')),
  lease_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((status = 'complete') = (assistant_text IS NOT NULL))
);
CREATE INDEX ai_chat_history ON ai_chat_exchanges (user_id, created_at DESC, id DESC);
CREATE UNIQUE INDEX ai_chat_one_pending ON ai_chat_exchanges (user_id) WHERE status = 'pending';
CREATE INDEX ai_chat_retention ON ai_chat_exchanges (created_at);
