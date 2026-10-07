CREATE TABLE money_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text, seed_key text, archived_at timestamptz,
  CHECK (name IS NULL OR char_length(btrim(name)) BETWEEN 1 AND 100),
  CHECK (seed_key IS NULL OR seed_key IN ('food','transport','housing','bills','shopping','health','other')),
  CHECK (name IS NOT NULL OR seed_key IS NOT NULL), UNIQUE (user_id, seed_key), UNIQUE (user_id, id)
);
CREATE TABLE money_settings (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  preferred_currencies text[] NOT NULL DEFAULT ARRAY['AUD','CNY'],
  CHECK (cardinality(preferred_currencies) BETWEEN 1 AND 5),
  CHECK (preferred_currencies <@ ARRAY['AUD','CNY','USD','JPY','EUR']::text[]),
  CHECK (array_position(preferred_currencies, NULL) IS NULL)
);
CREATE TABLE money_quick_categories (
  user_id uuid NOT NULL REFERENCES money_settings(user_id) ON DELETE CASCADE,
  category_id uuid NOT NULL, position integer NOT NULL CHECK (position BETWEEN 0 AND 4),
  PRIMARY KEY (user_id, position), UNIQUE (user_id, category_id),
  FOREIGN KEY (user_id, category_id) REFERENCES money_categories(user_id, id)
);
CREATE TABLE money_expenses (
  id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id uuid NOT NULL, amount_minor bigint NOT NULL CHECK (amount_minor BETWEEN 1 AND 999999999999),
  currency text NOT NULL CHECK (currency IN ('AUD','CNY','USD','JPY','EUR')),
  recorded_date date NOT NULL CHECK (recorded_date >= DATE '1900-01-01'),
  note text CHECK (note IS NULL OR char_length(note) <= 500),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz,
  FOREIGN KEY (user_id, category_id) REFERENCES money_categories(user_id, id)
);
CREATE INDEX money_expenses_recent ON money_expenses (user_id, recorded_date DESC, created_at DESC) WHERE deleted_at IS NULL;

CREATE FUNCTION save_money_settings(owner_id uuid, currency_order text[], category_order uuid[]) RETURNS boolean LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO money_settings (user_id) VALUES (owner_id) ON CONFLICT DO NOTHING;
  PERFORM 1 FROM money_settings WHERE user_id = owner_id FOR UPDATE;
  IF cardinality(category_order) > 5 OR cardinality(category_order) != (SELECT count(DISTINCT value) FROM unnest(category_order) AS value)
    OR cardinality(currency_order) != (SELECT count(DISTINCT value) FROM unnest(currency_order) AS value)
    OR EXISTS (SELECT 1 FROM unnest(category_order) AS value WHERE NOT EXISTS
      (SELECT 1 FROM money_categories WHERE id = value AND user_id = owner_id AND archived_at IS NULL)) THEN RETURN false; END IF;
  UPDATE money_settings SET preferred_currencies = currency_order WHERE user_id = owner_id;
  DELETE FROM money_quick_categories WHERE user_id = owner_id;
  INSERT INTO money_quick_categories SELECT owner_id, value, ordinal - 1 FROM unnest(category_order) WITH ORDINALITY AS list(value, ordinal);
  RETURN true;
END $$;

CREATE FUNCTION initialize_money(owner_id uuid) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO money_categories (user_id, seed_key)
    SELECT owner_id, value FROM unnest(ARRAY['food','transport','housing','bills','shopping','health','other']) AS value
    ON CONFLICT (user_id, seed_key) DO NOTHING;
  INSERT INTO money_settings (user_id) VALUES (owner_id) ON CONFLICT DO NOTHING;
  IF FOUND THEN
    INSERT INTO money_quick_categories (user_id, category_id, position)
      SELECT owner_id, category.id, ordinal - 1 FROM unnest(ARRAY['food','transport','housing','bills','shopping'])
      WITH ORDINALITY AS list(value, ordinal) JOIN money_categories category ON category.user_id = owner_id AND category.seed_key = value;
  END IF;
END $$;

CREATE FUNCTION archive_money_category(owner_id uuid, target_id uuid) RETURNS boolean LANGUAGE plpgsql AS $$
BEGIN
  PERFORM 1 FROM money_settings WHERE user_id = owner_id FOR UPDATE;
  UPDATE money_categories SET archived_at = now() WHERE user_id = owner_id AND id = target_id AND archived_at IS NULL;
  IF NOT FOUND THEN RETURN false; END IF;
  DELETE FROM money_quick_categories WHERE user_id = owner_id AND category_id = target_id;
  RETURN true;
END $$;
