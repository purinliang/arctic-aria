ALTER TABLE daily_life_entries ADD COLUMN duration_minutes integer;

ALTER TABLE daily_life_entries DROP CONSTRAINT daily_life_activity_allowed;
ALTER TABLE daily_life_entries ADD CONSTRAINT daily_life_activity_allowed
  CHECK (activity IN ('work', 'study', 'exercise', 'meal', 'shower', 'sleep'));

-- Preserve legacy occurrence records without inventing durations for them.
ALTER TABLE daily_life_entries ADD CONSTRAINT daily_life_duration_valid
  CHECK (
    (activity IN ('meal', 'shower', 'sleep', 'exercise') AND duration_minutes IS NULL)
    OR (activity IN ('work', 'study', 'exercise') AND duration_minutes IS NOT NULL
        AND duration_minutes BETWEEN 1 AND 1440)
  );
