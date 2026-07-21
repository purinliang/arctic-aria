CREATE TABLE IF NOT EXISTS project_task_daily_selections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES project_tasks(id) ON DELETE CASCADE,
  scheduled_date date NOT NULL,
  source text NOT NULL DEFAULT 'scheduler',
  created_at timestamptz NOT NULL DEFAULT now(),
  moved_at timestamptz,
  moved_from_date date,
  CONSTRAINT project_task_daily_selections_source_allowed CHECK (
    source IN ('manual', 'scheduler')
  ),
  CONSTRAINT project_task_daily_selections_moved_date_valid CHECK (
    moved_from_date IS NULL OR moved_at IS NOT NULL
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS project_task_daily_selections_user_task_date_unique
  ON project_task_daily_selections (user_id, task_id, scheduled_date);

CREATE INDEX IF NOT EXISTS project_task_daily_selections_user_date_idx
  ON project_task_daily_selections (user_id, scheduled_date, created_at);
