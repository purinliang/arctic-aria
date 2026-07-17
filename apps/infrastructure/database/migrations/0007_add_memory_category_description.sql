ALTER TABLE memory_categories
  ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT '';

ALTER TABLE memory_categories
  DROP CONSTRAINT IF EXISTS memory_categories_description_length;

ALTER TABLE memory_categories
  ADD CONSTRAINT memory_categories_description_length CHECK (
    char_length(description) <= 500
  );
