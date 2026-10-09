ALTER TABLE money_categories ADD COLUMN position integer NOT NULL DEFAULT 0 CHECK (position >= 0);
-- Account cascades may remove category rows before their other owned children.
ALTER TABLE money_quick_categories ALTER CONSTRAINT money_quick_categories_user_id_category_id_fkey DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE money_expenses ALTER CONSTRAINT money_expenses_user_id_category_id_fkey DEFERRABLE INITIALLY DEFERRED;
WITH ordered AS (
  SELECT id, row_number() OVER (PARTITION BY user_id ORDER BY name,id) - 1 AS position
  FROM money_categories WHERE seed_key IS NULL
) UPDATE money_categories category SET position = ordered.position FROM ordered WHERE category.id = ordered.id;
-- Restore built-ins without changing identifiers used by existing expenses.
UPDATE money_categories SET archived_at = NULL WHERE seed_key IS NOT NULL;

CREATE FUNCTION protect_money_builtin() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.seed_key IS NOT NULL AND EXISTS (SELECT 1 FROM users WHERE id = OLD.user_id) THEN
      RAISE EXCEPTION 'Built-in categories are immutable' USING ERRCODE = '23514';
    END IF;
    RETURN OLD;
  END IF;
  IF NEW.seed_key IS DISTINCT FROM OLD.seed_key OR (OLD.seed_key IS NOT NULL AND (
    NEW.name IS DISTINCT FROM OLD.name OR NEW.archived_at IS DISTINCT FROM OLD.archived_at
    OR NEW.position IS DISTINCT FROM OLD.position)) THEN
    RAISE EXCEPTION 'Built-in categories are immutable' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER money_builtin_immutable BEFORE UPDATE OR DELETE ON money_categories
  FOR EACH ROW EXECUTE FUNCTION protect_money_builtin();

CREATE FUNCTION save_money_category(owner_id uuid, target_id uuid, category_name text, is_new boolean)
RETURNS boolean LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO money_settings (user_id) VALUES (owner_id) ON CONFLICT DO NOTHING;
  PERFORM 1 FROM money_settings WHERE user_id = owner_id FOR UPDATE;
  IF is_new THEN
    INSERT INTO money_categories (user_id,id,name,position)
      SELECT owner_id,target_id,btrim(category_name),COALESCE(max(position) + 1,0)
      FROM money_categories WHERE user_id = owner_id AND seed_key IS NULL
      ON CONFLICT (id) DO NOTHING;
    RETURN EXISTS (SELECT 1 FROM money_categories WHERE user_id = owner_id AND id = target_id AND seed_key IS NULL AND archived_at IS NULL);
  END IF;
  UPDATE money_categories SET name = btrim(category_name)
    WHERE user_id = owner_id AND id = target_id AND seed_key IS NULL AND archived_at IS NULL;
  RETURN FOUND;
END $$;

CREATE OR REPLACE FUNCTION archive_money_category(owner_id uuid, target_id uuid) RETURNS boolean LANGUAGE plpgsql AS $$
BEGIN
  PERFORM 1 FROM money_settings WHERE user_id = owner_id FOR UPDATE;
  UPDATE money_categories SET archived_at = now()
    WHERE user_id = owner_id AND id = target_id AND seed_key IS NULL AND archived_at IS NULL;
  IF NOT FOUND THEN RETURN false; END IF;
  DELETE FROM money_quick_categories WHERE user_id = owner_id AND category_id = target_id;
  RETURN true;
END $$;

CREATE FUNCTION reorder_money_categories(owner_id uuid, category_order uuid[]) RETURNS boolean LANGUAGE plpgsql AS $$
BEGIN
  PERFORM 1 FROM money_settings WHERE user_id = owner_id FOR UPDATE;
  IF category_order IS NULL OR array_position(category_order,NULL) IS NOT NULL
    OR cardinality(category_order) != (SELECT count(DISTINCT value) FROM unnest(category_order) AS value)
    OR cardinality(category_order) != (SELECT count(*) FROM money_categories WHERE user_id = owner_id AND seed_key IS NULL AND archived_at IS NULL)
    OR EXISTS (SELECT 1 FROM unnest(category_order) AS value WHERE NOT EXISTS
      (SELECT 1 FROM money_categories WHERE user_id = owner_id AND id = value AND seed_key IS NULL AND archived_at IS NULL)) THEN RETURN false; END IF;
  UPDATE money_categories category SET position = list.ordinal - 1
    FROM unnest(category_order) WITH ORDINALITY AS list(value,ordinal)
    WHERE category.user_id = owner_id AND category.id = list.value;
  RETURN true;
END $$;
