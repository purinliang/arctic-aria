CREATE TABLE user_ai_settings (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'google_gemini' CHECK (provider = 'google_gemini'),
  enabled boolean NOT NULL DEFAULT false,
  encrypted_api_key text CHECK (
    encrypted_api_key IS NULL OR
    (encrypted_api_key LIKE 'v1:%' AND char_length(encrypted_api_key) BETWEEN 60 AND 512)
  ),
  last_test_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (NOT enabled OR encrypted_api_key IS NOT NULL)
);
