DROP TABLE IF EXISTS project_task_dependencies;
DROP TABLE IF EXISTS project_subtasks;
DROP TABLE IF EXISTS project_tasks;
DROP TABLE IF EXISTS project_milestones;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS plans;

ALTER TABLE completion_events
  DROP CONSTRAINT IF EXISTS completion_events_target_type_allowed;

ALTER TABLE completion_events
  ADD CONSTRAINT completion_events_target_type_allowed CHECK (
    target_type IN ('task', 'routine_instance')
  );

ALTER TABLE completion_events
  DROP CONSTRAINT IF EXISTS completion_events_event_type_allowed;

ALTER TABLE completion_events
  ADD CONSTRAINT completion_events_event_type_allowed CHECK (
    event_type IN (
      'completed',
      'partially_completed',
      'skipped',
      'reopened',
      'blocked',
      'unblocked'
    )
  );

CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  objective text NOT NULL,
  importance_reason text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active',
  priority text NOT NULL DEFAULT 'medium',
  start_date date NOT NULL,
  deadline_date date,
  expected_duration_days integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  archived_at timestamptz,
  CONSTRAINT projects_title_length CHECK (char_length(title) BETWEEN 1 AND 120),
  CONSTRAINT projects_objective_length CHECK (
    char_length(objective) BETWEEN 1 AND 500
  ),
  CONSTRAINT projects_importance_reason_length CHECK (
    char_length(importance_reason) <= 1000
  ),
  CONSTRAINT projects_status_allowed CHECK (
    status IN ('active', 'paused', 'completed', 'archived')
  ),
  CONSTRAINT projects_priority_allowed CHECK (
    priority IN ('high', 'medium', 'low')
  ),
  CONSTRAINT projects_duration_positive CHECK (
    expected_duration_days IS NULL OR expected_duration_days > 0
  ),
  CONSTRAINT projects_deadline_after_start CHECK (
    deadline_date IS NULL OR deadline_date >= start_date
  )
);

CREATE INDEX IF NOT EXISTS projects_user_status_idx
  ON projects (user_id, status, start_date DESC, created_at DESC);

CREATE TABLE IF NOT EXISTS project_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  objective text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active',
  sort_order integer NOT NULL DEFAULT 0,
  start_date date,
  deadline_date date,
  expected_duration_days integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  archived_at timestamptz,
  CONSTRAINT project_milestones_title_length CHECK (
    char_length(title) BETWEEN 1 AND 120
  ),
  CONSTRAINT project_milestones_objective_length CHECK (
    char_length(objective) <= 500
  ),
  CONSTRAINT project_milestones_status_allowed CHECK (
    status IN ('active', 'paused', 'completed', 'archived')
  ),
  CONSTRAINT project_milestones_duration_positive CHECK (
    expected_duration_days IS NULL OR expected_duration_days > 0
  ),
  CONSTRAINT project_milestones_deadline_after_start CHECK (
    start_date IS NULL OR deadline_date IS NULL OR deadline_date >= start_date
  )
);

CREATE INDEX IF NOT EXISTS project_milestones_project_order_idx
  ON project_milestones (project_id, status, sort_order, created_at);

CREATE TABLE IF NOT EXISTS project_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  milestone_id uuid NOT NULL REFERENCES project_milestones(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'todo',
  priority text NOT NULL DEFAULT 'medium',
  scheduled_date date,
  start_date date,
  deadline_date date,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  skipped_at timestamptz,
  blocked_at timestamptz,
  archived_at timestamptz,
  CONSTRAINT project_tasks_title_length CHECK (
    char_length(title) BETWEEN 1 AND 120
  ),
  CONSTRAINT project_tasks_description_length CHECK (
    char_length(description) <= 2000
  ),
  CONSTRAINT project_tasks_status_allowed CHECK (
    status IN ('todo', 'doing', 'blocked', 'skipped', 'done', 'archived')
  ),
  CONSTRAINT project_tasks_priority_allowed CHECK (
    priority IN ('high', 'medium', 'low')
  ),
  CONSTRAINT project_tasks_deadline_after_start CHECK (
    start_date IS NULL OR deadline_date IS NULL OR deadline_date >= start_date
  )
);

CREATE INDEX IF NOT EXISTS project_tasks_dashboard_idx
  ON project_tasks (user_id, status, scheduled_date, deadline_date, updated_at DESC);

CREATE INDEX IF NOT EXISTS project_tasks_milestone_order_idx
  ON project_tasks (milestone_id, status, sort_order, created_at);

CREATE TABLE IF NOT EXISTS project_task_dependencies (
  task_id uuid NOT NULL REFERENCES project_tasks(id) ON DELETE CASCADE,
  depends_on_task_id uuid NOT NULL REFERENCES project_tasks(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (task_id, depends_on_task_id),
  CONSTRAINT project_task_dependencies_no_self CHECK (
    task_id != depends_on_task_id
  )
);
