CREATE TABLE IF NOT EXISTS plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active',
  priority text NOT NULL DEFAULT 'medium',
  deadline_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz,
  CONSTRAINT plans_title_length CHECK (char_length(title) BETWEEN 1 AND 120),
  CONSTRAINT plans_description_length CHECK (char_length(description) <= 2000),
  CONSTRAINT plans_status_allowed CHECK (
    status IN ('active', 'paused', 'completed', 'archived')
  ),
  CONSTRAINT plans_priority_allowed CHECK (priority IN ('high', 'medium', 'low'))
);

CREATE INDEX IF NOT EXISTS plans_user_status_idx
  ON plans (user_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES plans(id) ON DELETE SET NULL,
  parent_task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'todo',
  priority text NOT NULL DEFAULT 'medium',
  weight numeric(8, 3) NOT NULL DEFAULT 1,
  completed_weight numeric(8, 3) NOT NULL DEFAULT 0,
  deadline_at timestamptz,
  scheduled_date date,
  sort_order integer NOT NULL DEFAULT 0,
  completed_at timestamptz,
  skipped_at timestamptz,
  blocked_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tasks_title_length CHECK (char_length(title) BETWEEN 1 AND 120),
  CONSTRAINT tasks_description_length CHECK (char_length(description) <= 2000),
  CONSTRAINT tasks_status_allowed CHECK (
    status IN ('todo', 'doing', 'blocked', 'skipped', 'done', 'archived')
  ),
  CONSTRAINT tasks_priority_allowed CHECK (priority IN ('high', 'medium', 'low')),
  CONSTRAINT tasks_weight_positive CHECK (weight > 0),
  CONSTRAINT tasks_completed_weight_range CHECK (
    completed_weight >= 0 AND completed_weight <= weight
  ),
  CONSTRAINT tasks_no_self_parent CHECK (parent_task_id IS NULL OR parent_task_id != id)
);

CREATE INDEX IF NOT EXISTS tasks_user_status_idx
  ON tasks (user_id, status, scheduled_date, deadline_at);

CREATE INDEX IF NOT EXISTS tasks_user_parent_idx
  ON tasks (user_id, parent_task_id, sort_order, created_at);

CREATE INDEX IF NOT EXISTS tasks_user_plan_idx
  ON tasks (user_id, plan_id, status);
