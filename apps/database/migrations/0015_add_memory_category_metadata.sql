ALTER TABLE memory_categories
  ADD COLUMN IF NOT EXISTS built_in_key text,
  ADD COLUMN IF NOT EXISTS icon_name text NOT NULL DEFAULT 'bookmark',
  ADD COLUMN IF NOT EXISTS shown_on_dashboard boolean NOT NULL DEFAULT false;

ALTER TABLE memory_categories
  DROP CONSTRAINT IF EXISTS memory_categories_built_in_key_allowed;

ALTER TABLE memory_categories
  ADD CONSTRAINT memory_categories_built_in_key_allowed CHECK (
    built_in_key IS NULL
    OR built_in_key IN ('cuisine', 'sightseeing')
  );

INSERT INTO memory_categories (
  user_id,
  name,
  description,
  built_in_key,
  icon_name,
  shown_on_dashboard
)
SELECT
  users.id,
  default_categories.name,
  '',
  default_categories.built_in_key,
  default_categories.icon_name,
  true
FROM users
CROSS JOIN (
  VALUES
    ('Cuisine', 'cuisine', 'utensils'),
    ('Sightseeing', 'sightseeing', 'landmark')
) AS default_categories(name, built_in_key, icon_name)
ON CONFLICT (user_id, name) DO UPDATE
SET built_in_key = EXCLUDED.built_in_key,
  icon_name = EXCLUDED.icon_name,
  shown_on_dashboard = EXCLUDED.shown_on_dashboard,
  updated_at = memory_categories.updated_at;

CREATE UNIQUE INDEX IF NOT EXISTS memory_categories_user_built_in_key_unique
  ON memory_categories (user_id, built_in_key)
  WHERE built_in_key IS NOT NULL;
