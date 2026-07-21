CREATE TABLE IF NOT EXISTS routine_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT routine_groups_name_length
    CHECK (char_length(name) BETWEEN 1 AND 80),
  CONSTRAINT routine_groups_description_length
    CHECK (description IS NULL OR char_length(description) <= 500)
);

CREATE UNIQUE INDEX IF NOT EXISTS routine_groups_user_name_active_unique
  ON routine_groups (user_id, lower(name))
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS routine_groups_user_active_idx
  ON routine_groups (user_id, name)
  WHERE deleted_at IS NULL;

ALTER TABLE routines
  ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES routine_groups(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS routines_group_active_idx
  ON routines (user_id, group_id, first_start_date)
  WHERE deleted_at IS NULL;
