ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS sidebar_pin_order integer;

ALTER TABLE projects
  DROP CONSTRAINT IF EXISTS projects_sidebar_pin_order_range;

ALTER TABLE projects
  ADD CONSTRAINT projects_sidebar_pin_order_range CHECK (
    sidebar_pin_order IS NULL OR sidebar_pin_order BETWEEN 1 AND 3
  );

ALTER TABLE projects
  DROP CONSTRAINT IF EXISTS projects_archived_not_pinned;

ALTER TABLE projects
  ADD CONSTRAINT projects_archived_not_pinned CHECK (
    status != 'archived' OR sidebar_pin_order IS NULL
  );

CREATE UNIQUE INDEX IF NOT EXISTS projects_sidebar_pin_order_unique
  ON projects (user_id, sidebar_pin_order)
  WHERE sidebar_pin_order IS NOT NULL;
