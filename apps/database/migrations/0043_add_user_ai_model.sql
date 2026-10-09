ALTER TABLE user_ai_settings
  ADD COLUMN model text NOT NULL DEFAULT 'gemini-2.5-flash'
    CHECK (model IN ('gemini-2.5-flash', 'gemini-3.5-flash-lite', 'gemini-3.8-flash'));

ALTER TABLE user_ai_settings
  ALTER COLUMN model SET DEFAULT 'gemini-3.5-flash-lite';
