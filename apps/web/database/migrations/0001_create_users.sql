CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  display_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_username_length CHECK (char_length(username) BETWEEN 4 AND 16),
  CONSTRAINT users_username_visible_ascii CHECK (username ~ '^[!-~]+$'),
  CONSTRAINT users_display_name_length CHECK (
    char_length(display_name) BETWEEN 1 AND 24
  )
);
