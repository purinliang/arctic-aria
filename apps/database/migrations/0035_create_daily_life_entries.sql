CREATE TABLE IF NOT EXISTS daily_life_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  capture_key uuid NOT NULL,
  activity text NOT NULL,
  occurred_at timestamptz NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT daily_life_activity_allowed
    CHECK (activity IN ('meal', 'shower', 'sleep', 'exercise')),
  CONSTRAINT daily_life_note_length
    CHECK (note IS NULL OR char_length(note) <= 500),
  CONSTRAINT daily_life_capture_unique UNIQUE (user_id, capture_key)
);

CREATE INDEX IF NOT EXISTS daily_life_user_recent_idx
  ON daily_life_entries (user_id, occurred_at DESC, id)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS daily_life_chat_turns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  capture_key uuid NOT NULL,
  message text NOT NULL,
  response_code text NOT NULL DEFAULT 'chat_not_available',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT daily_life_chat_message_length CHECK (char_length(btrim(message)) BETWEEN 1 AND 2000),
  CONSTRAINT daily_life_chat_response_allowed CHECK (response_code = 'chat_not_available'),
  CONSTRAINT daily_life_chat_capture_unique UNIQUE (user_id, capture_key)
);

CREATE INDEX IF NOT EXISTS daily_life_chat_user_recent_idx
  ON daily_life_chat_turns (user_id, created_at DESC, id);
