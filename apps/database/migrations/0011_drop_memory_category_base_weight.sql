ALTER TABLE memory_categories
  DROP CONSTRAINT IF EXISTS memory_categories_base_weight_positive;

ALTER TABLE memory_categories
  DROP COLUMN IF EXISTS base_weight;
