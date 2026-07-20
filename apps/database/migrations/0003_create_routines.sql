CREATE TABLE IF NOT EXISTS routines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active',
  first_start_date date NOT NULL,
  end_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT routines_title_length CHECK (char_length(title) BETWEEN 1 AND 120),
  CONSTRAINT routines_description_length CHECK (char_length(description) <= 2000),
  CONSTRAINT routines_status_allowed CHECK (status IN ('active', 'deleted')),
  CONSTRAINT routines_end_date_after_start CHECK (
    end_date IS NULL OR end_date >= first_start_date
  )
);

CREATE INDEX IF NOT EXISTS routines_user_status_idx
  ON routines (user_id, status, first_start_date);

CREATE TABLE IF NOT EXISTS routine_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id uuid NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  rule_type text NOT NULL,
  interval_value integer,
  weekdays jsonb,
  day_of_month integer,
  preferred_time time,
  timezone text NOT NULL DEFAULT 'UTC',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT routine_rules_type_allowed CHECK (
    rule_type IN (
      'daily',
      'weekly',
      'bi_weekly',
      'monthly_by_date',
      'day_interval'
    )
  ),
  CONSTRAINT routine_rules_interval_positive CHECK (
    interval_value IS NULL OR interval_value > 0
  ),
  CONSTRAINT routine_rules_day_of_month_range CHECK (
    day_of_month IS NULL OR day_of_month BETWEEN 1 AND 31
  ),
  CONSTRAINT routine_rules_one_per_routine UNIQUE (routine_id)
);

CREATE TABLE IF NOT EXISTS routine_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  routine_id uuid NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  scheduled_date date NOT NULL,
  scheduled_time time,
  status text NOT NULL DEFAULT 'pending',
  completed_at timestamptz,
  skipped_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT routine_instances_status_allowed CHECK (
    status IN ('pending', 'completed', 'skipped')
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS routine_instances_unique_schedule_idx
  ON routine_instances (
    routine_id,
    scheduled_date,
    COALESCE(scheduled_time, time '00:00')
  );

CREATE INDEX IF NOT EXISTS routine_instances_user_day_idx
  ON routine_instances (user_id, scheduled_date, scheduled_time);

CREATE TABLE IF NOT EXISTS completion_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  event_type text NOT NULL,
  previous_completed_weight numeric(8, 3),
  new_completed_weight numeric(8, 3),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL DEFAULT 'web',
  CONSTRAINT completion_events_target_type_allowed CHECK (
    target_type IN ('task', 'routine_instance')
  ),
  CONSTRAINT completion_events_event_type_allowed CHECK (
    event_type IN ('completed', 'partially_completed', 'skipped')
  )
);

CREATE INDEX IF NOT EXISTS completion_events_user_target_idx
  ON completion_events (user_id, target_type, target_id, occurred_at DESC);
