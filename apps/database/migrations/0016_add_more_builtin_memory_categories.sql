ALTER TABLE memory_categories
  DROP CONSTRAINT IF EXISTS memory_categories_built_in_key_allowed;

ALTER TABLE memory_categories
  ADD CONSTRAINT memory_categories_built_in_key_allowed CHECK (
    built_in_key IS NULL
    OR built_in_key IN (
      'cuisine',
      'sightseeing',
      'movie',
      'anime',
      'book',
      'music',
      'game',
      'shopping'
    )
  );

WITH default_categories(name, built_in_key, icon_name) AS (
  VALUES
    ('Cuisine', 'cuisine', 'utensils'),
    ('Sightseeing', 'sightseeing', 'trees'),
    ('Movie', 'movie', 'film'),
    ('Anime', 'anime', 'book-open-text'),
    ('Book', 'book', 'book-open-text'),
    ('Music', 'music', 'music'),
    ('Game', 'game', 'gamepad-2'),
    ('Shopping', 'shopping', 'shopping-cart')
),
updated_by_key AS (
  UPDATE memory_categories
  SET name = default_categories.name,
    icon_name = default_categories.icon_name,
    shown_on_dashboard = true
  FROM default_categories
  WHERE memory_categories.built_in_key = default_categories.built_in_key
  RETURNING memory_categories.user_id, memory_categories.built_in_key
)
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
CROSS JOIN default_categories
WHERE NOT EXISTS (
  SELECT 1
  FROM updated_by_key
  WHERE updated_by_key.user_id = users.id
    AND updated_by_key.built_in_key = default_categories.built_in_key
)
ON CONFLICT (user_id, name) DO UPDATE
SET built_in_key = EXCLUDED.built_in_key,
  icon_name = EXCLUDED.icon_name,
  shown_on_dashboard = EXCLUDED.shown_on_dashboard,
  updated_at = memory_categories.updated_at;
