ALTER TABLE money_categories DROP CONSTRAINT money_categories_seed_key_check;
ALTER TABLE money_categories ADD CONSTRAINT money_categories_seed_key_check CHECK (
  seed_key IS NULL OR seed_key IN ('food','transport','shopping','housing','bills','health','subscription','other')
);

-- Add a built-in without renaming custom categories or changing expense links.
INSERT INTO money_categories (user_id,seed_key)
  SELECT user_id,'subscription' FROM money_settings
  ON CONFLICT (user_id,seed_key) DO NOTHING;

CREATE OR REPLACE FUNCTION initialize_money(owner_id uuid) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO money_categories (user_id,seed_key)
    SELECT owner_id,value FROM unnest(ARRAY['food','transport','shopping','housing','bills','health','subscription','other']) AS value
    ON CONFLICT (user_id,seed_key) DO NOTHING;
  INSERT INTO money_settings (user_id) VALUES (owner_id) ON CONFLICT DO NOTHING;
  IF FOUND THEN
    INSERT INTO money_quick_categories (user_id,category_id,position)
      SELECT owner_id,category.id,ordinal - 1 FROM unnest(ARRAY['food','transport','housing','bills','shopping'])
      WITH ORDINALITY AS list(value,ordinal) JOIN money_categories category ON category.user_id = owner_id AND category.seed_key = value;
  END IF;
END $$;
