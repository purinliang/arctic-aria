CREATE TABLE IF NOT EXISTS user_settings (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  theme_preference text NOT NULL DEFAULT 'system',
  language_preference text NOT NULL DEFAULT 'en',
  time_format_preference text NOT NULL DEFAULT '12h',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_settings
  DROP CONSTRAINT IF EXISTS user_settings_theme_preference_valid;

ALTER TABLE user_settings
  ADD CONSTRAINT user_settings_theme_preference_valid CHECK (
    theme_preference IN ('system', 'light', 'dark')
  );

ALTER TABLE user_settings
  DROP CONSTRAINT IF EXISTS user_settings_language_preference_valid;

ALTER TABLE user_settings
  ADD CONSTRAINT user_settings_language_preference_valid CHECK (
    language_preference IN ('system', 'en', 'zh-CN')
  );

ALTER TABLE user_settings
  DROP CONSTRAINT IF EXISTS user_settings_time_format_preference_valid;

ALTER TABLE user_settings
  ADD CONSTRAINT user_settings_time_format_preference_valid CHECK (
    time_format_preference IN ('12h', '24h')
  );

INSERT INTO user_settings (user_id)
SELECT id
FROM users
ON CONFLICT (user_id) DO NOTHING;
