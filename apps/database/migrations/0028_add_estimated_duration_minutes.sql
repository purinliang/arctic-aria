ALTER TABLE project_tasks
  ADD COLUMN IF NOT EXISTS estimated_duration_minutes integer;

ALTER TABLE project_tasks
  DROP CONSTRAINT IF EXISTS project_tasks_estimated_duration_minutes_positive;

ALTER TABLE project_tasks
  ADD CONSTRAINT project_tasks_estimated_duration_minutes_positive CHECK (
    estimated_duration_minutes IS NULL OR (
      estimated_duration_minutes > 0
      AND estimated_duration_minutes <= 1440
    )
  );

ALTER TABLE routines
  ADD COLUMN IF NOT EXISTS estimated_duration_minutes integer;

ALTER TABLE routines
  DROP CONSTRAINT IF EXISTS routines_estimated_duration_minutes_positive;

ALTER TABLE routines
  ADD CONSTRAINT routines_estimated_duration_minutes_positive CHECK (
    estimated_duration_minutes IS NULL OR (
      estimated_duration_minutes > 0
      AND estimated_duration_minutes <= 1440
    )
  );
