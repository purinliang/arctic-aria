ALTER TABLE projects
  ALTER COLUMN objective SET DEFAULT '';

ALTER TABLE projects
  DROP CONSTRAINT IF EXISTS projects_objective_length;

ALTER TABLE projects
  ADD CONSTRAINT projects_objective_length CHECK (
    char_length(objective) <= 500
  );
