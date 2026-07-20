ALTER TABLE routine_instances
  ADD COLUMN IF NOT EXISTS remind_at timestamptz,
  ADD COLUMN IF NOT EXISTS reminded_at timestamptz,
  ADD COLUMN IF NOT EXISTS moved_at timestamptz,
  ADD COLUMN IF NOT EXISTS moved_from_date date;

UPDATE routine_instances
SET
  scheduled_time = time '18:00',
  updated_at = NOW()
WHERE routine_instances.scheduled_time IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM routine_instances existing_instance
    WHERE existing_instance.routine_id = routine_instances.routine_id
      AND existing_instance.scheduled_date = routine_instances.scheduled_date
      AND existing_instance.scheduled_time = time '18:00'
  );

UPDATE routine_instances
SET
  remind_at = (
    (
      routine_instances.scheduled_date::timestamp
      + COALESCE(routine_instances.scheduled_time, time '18:00')
    ) AT TIME ZONE routine_rules.timezone
  ) - interval '30 minutes',
  updated_at = NOW()
FROM routine_rules
WHERE routine_rules.routine_id = routine_instances.routine_id
  AND routine_instances.status = 'pending'
  AND routine_instances.remind_at IS NULL;

ALTER TABLE routine_instances
  DROP CONSTRAINT IF EXISTS routine_instances_moved_date_valid;

ALTER TABLE routine_instances
  ADD CONSTRAINT routine_instances_moved_date_valid CHECK (
    moved_from_date IS NULL OR moved_at IS NOT NULL
  );

CREATE INDEX IF NOT EXISTS routine_instances_due_reminder_idx
  ON routine_instances (remind_at)
  WHERE status = 'pending'
    AND remind_at IS NOT NULL
    AND reminded_at IS NULL;
