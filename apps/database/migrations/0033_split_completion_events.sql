CREATE TABLE IF NOT EXISTS project_task_completion_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES project_tasks(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  previous_completed_weight numeric(8, 3),
  new_completed_weight numeric(8, 3),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL DEFAULT 'web',
  CONSTRAINT project_task_completion_events_type_allowed CHECK (
    event_type IN ('completed', 'reopened', 'blocked', 'unblocked')
  )
);

CREATE INDEX IF NOT EXISTS project_task_completion_events_user_task_idx
  ON project_task_completion_events (user_id, task_id, occurred_at DESC);

CREATE TABLE IF NOT EXISTS routine_completion_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  routine_instance_id uuid NOT NULL REFERENCES routine_instances(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL DEFAULT 'web',
  CONSTRAINT routine_completion_events_type_allowed CHECK (
    event_type IN ('completed', 'skipped', 'reopened')
  )
);

CREATE INDEX IF NOT EXISTS routine_completion_events_user_instance_idx
  ON routine_completion_events (user_id, routine_instance_id, occurred_at DESC);

INSERT INTO project_task_completion_events (
  id,
  user_id,
  task_id,
  event_type,
  previous_completed_weight,
  new_completed_weight,
  occurred_at,
  source
)
SELECT
  completion_events.id,
  completion_events.user_id,
  completion_events.target_id,
  completion_events.event_type,
  completion_events.previous_completed_weight,
  completion_events.new_completed_weight,
  completion_events.occurred_at,
  completion_events.source
FROM completion_events
INNER JOIN project_tasks
  ON project_tasks.id = completion_events.target_id
  AND project_tasks.user_id = completion_events.user_id
WHERE completion_events.target_type = 'task'
  AND completion_events.event_type IN (
    'completed',
    'reopened',
    'blocked',
    'unblocked'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO routine_completion_events (
  id,
  user_id,
  routine_instance_id,
  event_type,
  occurred_at,
  source
)
SELECT
  completion_events.id,
  completion_events.user_id,
  completion_events.target_id,
  completion_events.event_type,
  completion_events.occurred_at,
  completion_events.source
FROM completion_events
INNER JOIN routine_instances
  ON routine_instances.id = completion_events.target_id
  AND routine_instances.user_id = completion_events.user_id
WHERE completion_events.target_type = 'routine_instance'
  AND completion_events.event_type IN ('completed', 'skipped', 'reopened')
ON CONFLICT (id) DO NOTHING;
