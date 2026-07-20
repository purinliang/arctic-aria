ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

UPDATE projects
SET deleted_at = COALESCE(deleted_at, archived_at, updated_at)
WHERE deleted_at IS NULL
  AND (archived_at IS NOT NULL OR status = 'archived');

UPDATE projects
SET completed_at = COALESCE(completed_at, updated_at)
WHERE completed_at IS NULL
  AND status = 'completed';

UPDATE projects
SET sidebar_pin_order = NULL,
    updated_at = COALESCE(deleted_at, updated_at)
WHERE deleted_at IS NOT NULL
  AND sidebar_pin_order IS NOT NULL;

ALTER TABLE projects
  DROP CONSTRAINT IF EXISTS projects_archived_not_pinned,
  DROP CONSTRAINT IF EXISTS projects_status_allowed,
  DROP CONSTRAINT IF EXISTS projects_priority_allowed;

DROP INDEX IF EXISTS projects_user_status_idx;

ALTER TABLE projects
  DROP COLUMN IF EXISTS status,
  DROP COLUMN IF EXISTS priority,
  DROP COLUMN IF EXISTS archived_at;

ALTER TABLE projects
  DROP CONSTRAINT IF EXISTS projects_deleted_not_pinned;

ALTER TABLE projects
  ADD CONSTRAINT projects_deleted_not_pinned CHECK (
    deleted_at IS NULL OR sidebar_pin_order IS NULL
  );

CREATE INDEX IF NOT EXISTS projects_user_active_idx
  ON projects (user_id, start_date DESC, created_at DESC)
  WHERE deleted_at IS NULL;

ALTER TABLE project_milestones
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

UPDATE project_milestones
SET deleted_at = COALESCE(deleted_at, archived_at, updated_at)
WHERE deleted_at IS NULL
  AND (archived_at IS NOT NULL OR status = 'archived');

DROP INDEX IF EXISTS project_milestones_project_order_idx;

ALTER TABLE project_milestones
  DROP CONSTRAINT IF EXISTS project_milestones_status_allowed;

ALTER TABLE project_milestones
  DROP COLUMN IF EXISTS status,
  DROP COLUMN IF EXISTS archived_at;

CREATE INDEX IF NOT EXISTS project_milestones_project_order_idx
  ON project_milestones (project_id, sort_order, created_at)
  WHERE deleted_at IS NULL;

DROP TABLE IF EXISTS project_task_dependencies;

ALTER TABLE project_tasks
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

UPDATE project_tasks
SET completed_at = COALESCE(completed_at, updated_at)
WHERE completed_at IS NULL
  AND status = 'done';

UPDATE project_tasks
SET deleted_at = COALESCE(deleted_at, archived_at, updated_at)
WHERE deleted_at IS NULL
  AND (archived_at IS NOT NULL OR status = 'archived');

DROP INDEX IF EXISTS project_tasks_dashboard_idx;
DROP INDEX IF EXISTS project_tasks_milestone_order_idx;

ALTER TABLE project_tasks
  DROP CONSTRAINT IF EXISTS project_tasks_status_allowed,
  DROP CONSTRAINT IF EXISTS project_tasks_priority_allowed;

ALTER TABLE project_tasks
  DROP COLUMN IF EXISTS status,
  DROP COLUMN IF EXISTS priority,
  DROP COLUMN IF EXISTS scheduled_date,
  DROP COLUMN IF EXISTS skipped_at,
  DROP COLUMN IF EXISTS blocked_at,
  DROP COLUMN IF EXISTS archived_at;

CREATE INDEX IF NOT EXISTS project_tasks_dashboard_idx
  ON project_tasks (user_id, deadline_date, start_date, updated_at DESC)
  WHERE deleted_at IS NULL AND completed_at IS NULL;

CREATE INDEX IF NOT EXISTS project_tasks_milestone_order_idx
  ON project_tasks (milestone_id, sort_order, created_at)
  WHERE deleted_at IS NULL;

ALTER TABLE routines
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

UPDATE routines
SET deleted_at = COALESCE(deleted_at, updated_at)
WHERE deleted_at IS NULL
  AND status = 'deleted';

DROP INDEX IF EXISTS routines_user_status_idx;

ALTER TABLE routines
  DROP CONSTRAINT IF EXISTS routines_status_allowed;

ALTER TABLE routines
  DROP COLUMN IF EXISTS status;

CREATE INDEX IF NOT EXISTS routines_user_active_idx
  ON routines (user_id, first_start_date)
  WHERE deleted_at IS NULL;
