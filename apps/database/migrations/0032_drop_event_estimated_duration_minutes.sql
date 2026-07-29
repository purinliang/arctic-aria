ALTER TABLE events
  DROP CONSTRAINT IF EXISTS events_estimated_duration_minutes_positive;

ALTER TABLE events
  DROP COLUMN IF EXISTS estimated_duration_minutes;
