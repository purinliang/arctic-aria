CREATE TABLE IF NOT EXISTS memory_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  base_weight numeric(6, 3) NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT memory_categories_name_length CHECK (
    char_length(name) BETWEEN 1 AND 40
  ),
  CONSTRAINT memory_categories_base_weight_positive CHECK (base_weight > 0),
  CONSTRAINT memory_categories_user_name_unique UNIQUE (user_id, name)
);

CREATE TABLE IF NOT EXISTS memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES memory_categories(id) ON DELETE RESTRICT,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  last_done_at timestamptz,
  done_count integer NOT NULL DEFAULT 0,
  last_pinned_at timestamptz,
  last_ignored_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT memories_title_length CHECK (char_length(title) BETWEEN 1 AND 120),
  CONSTRAINT memories_description_length CHECK (char_length(description) <= 2000),
  CONSTRAINT memories_done_count_non_negative CHECK (done_count >= 0)
);

CREATE INDEX IF NOT EXISTS memories_user_category_idx
  ON memories (user_id, category_id, created_at DESC);

CREATE TABLE IF NOT EXISTS memory_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  memory_id uuid NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT memory_events_type_allowed CHECK (
    event_type IN (
      'pinned',
      'unpinned',
      'ignored',
      'completed',
      'completed_canceled',
      'replaced',
      'deleted'
    )
  )
);

CREATE INDEX IF NOT EXISTS memory_events_user_memory_idx
  ON memory_events (user_id, memory_id, occurred_at DESC);

CREATE TABLE IF NOT EXISTS pinned_memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  memory_id uuid NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
  position integer NOT NULL,
  pinned_at timestamptz NOT NULL DEFAULT now(),
  last_shown_at timestamptz NOT NULL DEFAULT now(),
  visible_until timestamptz NOT NULL,
  completed_at timestamptz,
  completed_cleanup_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pinned_memories_position_positive CHECK (position > 0),
  CONSTRAINT pinned_memories_cleanup_after_completed CHECK (
    completed_at IS NULL
    OR completed_cleanup_at IS NULL
    OR completed_cleanup_at >= completed_at
  ),
  CONSTRAINT pinned_memories_user_memory_unique UNIQUE (user_id, memory_id)
);

CREATE INDEX IF NOT EXISTS pinned_memories_user_position_idx
  ON pinned_memories (user_id, position);
