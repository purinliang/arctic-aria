WITH default_categories(name, built_in_key, icon_name, description) AS (
  VALUES
    (
      'Cuisine',
      'cuisine',
      'utensils',
      'Restaurants, cafes, meals, and food experiences worth revisiting.'
    ),
    (
      'Sightseeing',
      'sightseeing',
      'trees',
      'Places, walks, views, and visits worth seeing again.'
    ),
    (
      'Movie',
      'movie',
      'film',
      'Films to watch, rewatch, or remember.'
    ),
    (
      'Anime',
      'anime',
      'wand-sparkles',
      'Anime series or films to continue or revisit.'
    ),
    (
      'Book',
      'book',
      'book-open-text',
      'Books and reading experiences worth returning to.'
    ),
    (
      'Music',
      'music',
      'music',
      'Songs, albums, concerts, and listening moments to revisit.'
    ),
    (
      'Game',
      'game',
      'gamepad-2',
      'Games and playful experiences worth returning to.'
    ),
    (
      'Shopping',
      'shopping',
      'shopping-cart',
      'Shops, items, and buying experiences worth remembering.'
    )
)
UPDATE memory_categories
SET name = default_categories.name,
  description = default_categories.description,
  icon_name = default_categories.icon_name,
  shown_on_dashboard = true
FROM default_categories
WHERE memory_categories.built_in_key = default_categories.built_in_key;
