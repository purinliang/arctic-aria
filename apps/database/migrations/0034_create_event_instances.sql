CREATE TABLE IF NOT EXISTS event_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT event_groups_name_length
    CHECK (char_length(name) BETWEEN 1 AND 80),
  CONSTRAINT event_groups_description_length
    CHECK (description IS NULL OR char_length(description) <= 500)
);

CREATE UNIQUE INDEX IF NOT EXISTS event_groups_user_name_active_unique
  ON event_groups (user_id, lower(name))
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS event_groups_user_active_idx
  ON event_groups (user_id, name)
  WHERE deleted_at IS NULL;

DROP INDEX IF EXISTS events_active_schedule_idx;

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES event_groups(id) ON DELETE SET NULL;

ALTER TABLE events
  RENAME COLUMN event_date TO start_date;

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS end_date date;

ALTER TABLE events
  ADD CONSTRAINT events_end_date_after_start CHECK (
    end_date IS NULL OR end_date >= start_date
  );

CREATE TABLE IF NOT EXISTS event_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  rule_type text NOT NULL,
  scheduled_time time NOT NULL,
  weekday integer,
  timezone text NOT NULL DEFAULT 'UTC',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT event_rules_type_allowed CHECK (
    rule_type IN ('once', 'daily', 'weekly')
  ),
  CONSTRAINT event_rules_weekday_range CHECK (
    weekday IS NULL OR weekday BETWEEN 0 AND 6
  ),
  CONSTRAINT event_rules_weekday_required CHECK (
    (rule_type = 'weekly' AND weekday IS NOT NULL)
    OR (rule_type != 'weekly' AND weekday IS NULL)
  ),
  CONSTRAINT event_rules_timezone_present CHECK (char_length(btrim(timezone)) > 0),
  CONSTRAINT event_rules_one_per_event UNIQUE (event_id)
);

INSERT INTO event_rules (
  event_id,
  rule_type,
  scheduled_time,
  weekday,
  timezone,
  created_at,
  updated_at
)
SELECT
  events.id,
  'once',
  events.event_time,
  NULL,
  'UTC',
  events.created_at,
  events.updated_at
FROM events
WHERE NOT EXISTS (
  SELECT 1
  FROM event_rules
  WHERE event_rules.event_id = events.id
);

CREATE TABLE IF NOT EXISTS event_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  rule_date date NOT NULL,
  rule_time time NOT NULL,
  scheduled_date date NOT NULL,
  scheduled_time time NOT NULL,
  location_override text,
  status text NOT NULL DEFAULT 'scheduled',
  canceled_at timestamptz,
  cancellation_reason text,
  rescheduled_at timestamptz,
  reschedule_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT event_instances_status_allowed CHECK (
    status IN ('scheduled', 'canceled')
  ),
  CONSTRAINT event_instances_location_override_length CHECK (
    location_override IS NULL OR char_length(location_override) <= 500
  ),
  CONSTRAINT event_instances_cancellation_reason_length CHECK (
    cancellation_reason IS NULL OR char_length(cancellation_reason) <= 500
  ),
  CONSTRAINT event_instances_reschedule_reason_length CHECK (
    reschedule_reason IS NULL OR char_length(reschedule_reason) <= 500
  ),
  CONSTRAINT event_instances_canceled_state_consistent CHECK (
    (status = 'canceled' AND canceled_at IS NOT NULL)
    OR (status = 'scheduled' AND canceled_at IS NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS event_instances_rule_slot_unique
  ON event_instances (event_id, rule_date, rule_time);

CREATE INDEX IF NOT EXISTS event_instances_user_schedule_idx
  ON event_instances (user_id, scheduled_date, scheduled_time, created_at);

CREATE INDEX IF NOT EXISTS event_instances_event_schedule_idx
  ON event_instances (event_id, scheduled_date, scheduled_time);

INSERT INTO event_instances (
  user_id,
  event_id,
  rule_date,
  rule_time,
  scheduled_date,
  scheduled_time,
  status,
  canceled_at,
  created_at,
  updated_at
)
SELECT
  events.user_id,
  events.id,
  events.start_date,
  event_rules.scheduled_time,
  events.start_date,
  event_rules.scheduled_time,
  CASE WHEN events.deleted_at IS NULL THEN 'scheduled' ELSE 'canceled' END,
  events.deleted_at,
  events.created_at,
  events.updated_at
FROM events
INNER JOIN event_rules ON event_rules.event_id = events.id
WHERE NOT EXISTS (
  SELECT 1
  FROM event_instances
  WHERE event_instances.event_id = events.id
    AND event_instances.rule_date = events.start_date
    AND event_instances.rule_time = event_rules.scheduled_time
);

ALTER TABLE events
  DROP COLUMN IF EXISTS event_time;

CREATE INDEX IF NOT EXISTS events_active_schedule_idx
  ON events (user_id, start_date, created_at)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS events_group_active_idx
  ON events (user_id, group_id, start_date)
  WHERE deleted_at IS NULL;
