ALTER TABLE projects
  ALTER COLUMN objective DROP DEFAULT,
  ALTER COLUMN objective DROP NOT NULL,
  DROP CONSTRAINT IF EXISTS projects_importance_reason_length,
  DROP COLUMN IF EXISTS importance_reason;

UPDATE projects
SET objective = NULL
WHERE objective = '';

ALTER TABLE project_milestones
  ALTER COLUMN objective DROP DEFAULT,
  ALTER COLUMN objective DROP NOT NULL;

UPDATE project_milestones
SET objective = NULL
WHERE objective = '';

ALTER TABLE project_tasks
  ALTER COLUMN description DROP DEFAULT,
  ALTER COLUMN description DROP NOT NULL;

UPDATE project_tasks
SET description = NULL
WHERE description = '';

ALTER TABLE routines
  ALTER COLUMN description DROP DEFAULT,
  ALTER COLUMN description DROP NOT NULL;

UPDATE routines
SET description = NULL
WHERE description = '';

ALTER TABLE memory_categories
  ALTER COLUMN description DROP DEFAULT,
  ALTER COLUMN description DROP NOT NULL;

UPDATE memory_categories
SET description = NULL
WHERE description = '';

ALTER TABLE memories
  ALTER COLUMN description DROP DEFAULT,
  ALTER COLUMN description DROP NOT NULL;

UPDATE memories
SET description = NULL
WHERE description = '';
