ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS resolved_timezone text;

ALTER TABLE user_settings
DROP CONSTRAINT IF EXISTS user_settings_resolved_timezone_valid;

ALTER TABLE user_settings
ADD CONSTRAINT user_settings_resolved_timezone_valid
  CHECK (
    resolved_timezone IS NULL OR (
      resolved_timezone = btrim(resolved_timezone)
      AND resolved_timezone <> ''
      AND resolved_timezone <> 'system'
      AND length(resolved_timezone) <= 64
    )
  );
