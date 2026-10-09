UPDATE user_ai_settings SET model = 'gemini-3.5-flash-lite'
  WHERE model <> 'gemini-3.5-flash-lite';

ALTER TABLE user_ai_settings
  DROP CONSTRAINT user_ai_settings_model_check,
  ADD CONSTRAINT user_ai_settings_model_check CHECK (model = 'gemini-3.5-flash-lite');
