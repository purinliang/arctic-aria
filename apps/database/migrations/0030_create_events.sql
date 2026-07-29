CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  event_date date NOT NULL,
  event_time time NOT NULL,
  estimated_duration_minutes integer,
  location text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT events_title_length CHECK (
    char_length(btrim(title)) BETWEEN 1 AND 120
  ),
  CONSTRAINT events_description_length CHECK (
    description IS NULL OR char_length(description) <= 2000
  ),
  CONSTRAINT events_estimated_duration_minutes_positive CHECK (
    estimated_duration_minutes IS NULL OR (
      estimated_duration_minutes > 0
      AND estimated_duration_minutes <= 1440
    )
  ),
  CONSTRAINT events_location_length CHECK (
    location IS NULL OR char_length(location) <= 500
  )
);

CREATE INDEX IF NOT EXISTS events_active_schedule_idx
  ON events (user_id, event_date, event_time, created_at)
  WHERE deleted_at IS NULL;
