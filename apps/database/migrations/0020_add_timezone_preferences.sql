ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS timezone_preference text NOT NULL DEFAULT 'system',
  ADD COLUMN IF NOT EXISTS multiple_timezones_enabled boolean NOT NULL DEFAULT false;

ALTER TABLE user_settings
  DROP CONSTRAINT IF EXISTS user_settings_timezone_preference_valid;

ALTER TABLE user_settings
  ADD CONSTRAINT user_settings_timezone_preference_valid CHECK (
    timezone_preference = 'system'
    OR (
      timezone_preference = btrim(timezone_preference)
      AND timezone_preference <> ''
      AND char_length(timezone_preference) <= 64
    )
  );
