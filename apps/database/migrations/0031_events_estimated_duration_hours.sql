ALTER TABLE events
  ADD COLUMN IF NOT EXISTS estimated_duration_hours numeric(5,2);

UPDATE events
SET estimated_duration_hours = ROUND(
  estimated_duration_minutes::numeric / 60,
  2
)
WHERE estimated_duration_hours IS NULL
  AND estimated_duration_minutes IS NOT NULL;

ALTER TABLE events
  DROP CONSTRAINT IF EXISTS events_estimated_duration_hours_positive;

ALTER TABLE events
  ADD CONSTRAINT events_estimated_duration_hours_positive CHECK (
    estimated_duration_hours IS NULL OR (
      estimated_duration_hours > 0
      AND estimated_duration_hours <= 24
    )
  );
