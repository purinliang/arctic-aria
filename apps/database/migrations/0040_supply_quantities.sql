ALTER TABLE supply_items
  ADD COLUMN quantity numeric(12,3),
  ADD COLUMN unit text NOT NULL DEFAULT 'unit',
  ADD COLUMN increment numeric(12,3) NOT NULL DEFAULT 1,
  ADD COLUMN target_quantity numeric(12,3) NOT NULL DEFAULT 5,
  ADD COLUMN low_stock_threshold numeric(12,3) NOT NULL DEFAULT 1;
-- Legacy levels remain levels: do not infer pack sizes or count unopened spares.
UPDATE supply_items SET quantity = level;
ALTER TABLE supply_items ALTER COLUMN quantity SET NOT NULL;
ALTER TABLE supply_items ALTER COLUMN quantity SET DEFAULT 5;
ALTER TABLE supply_items ADD CONSTRAINT supply_quantity_valid CHECK (
  quantity BETWEEN 0 AND 999999.999 AND increment BETWEEN 0.001 AND 999999.999
  AND target_quantity BETWEEN 0.001 AND 999999.999
  AND low_stock_threshold BETWEEN 0 AND target_quantity
  AND char_length(btrim(unit)) BETWEEN 1 AND 40
);

CREATE FUNCTION save_supply_stock(owner_id uuid, target_id uuid, is_new boolean, expected_version integer,
  item_kind text, item_title text, item_note text, stock numeric, stock_unit text,
  stock_increment numeric, stock_target numeric, stock_threshold numeric, initial_spares integer)
RETURNS boolean LANGUAGE plpgsql AS $$
BEGIN
  IF is_new THEN
    INSERT INTO supply_items (user_id,id,kind,title,note,level,spares,quantity,unit,increment,target_quantity,low_stock_threshold)
      VALUES (owner_id,target_id,item_kind,btrim(item_title),item_note,LEAST(5,floor(stock / stock_target * 5)),initial_spares,
        stock,btrim(stock_unit),stock_increment,stock_target,stock_threshold)
      ON CONFLICT (id) DO NOTHING;
    RETURN EXISTS (SELECT 1 FROM supply_items WHERE user_id = owner_id AND id = target_id AND archived_at IS NULL);
  END IF;
  UPDATE supply_items SET kind = item_kind,title = btrim(item_title),note = item_note,quantity = stock,
    unit = btrim(stock_unit),increment = stock_increment,target_quantity = stock_target,low_stock_threshold = stock_threshold,
    spares = initial_spares,version = version + 1,updated_at = clock_timestamp()
    WHERE user_id = owner_id AND id = target_id AND version = expected_version AND archived_at IS NULL;
  RETURN FOUND;
END $$;

CREATE FUNCTION adjust_supply_quantity(owner_id uuid, target_id uuid, expected_version integer, request_key uuid, direction integer)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE item supply_items; replay_target uuid; next_quantity numeric;
BEGIN
  SELECT * INTO item FROM supply_items WHERE user_id = owner_id AND id = target_id AND archived_at IS NULL FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('error','missing'); END IF;
  SELECT item_id INTO replay_target FROM supply_commands WHERE user_id = owner_id AND command_key = request_key;
  IF FOUND THEN
    IF replay_target != target_id THEN RETURN jsonb_build_object('error','invalid'); END IF;
    RETURN jsonb_build_object('item',to_jsonb(item));
  END IF;
  IF expected_version IS NULL OR expected_version != item.version THEN RETURN jsonb_build_object('error','stale'); END IF;
  IF direction IS NULL OR direction NOT IN (-1,1) THEN RETURN jsonb_build_object('error','invalid'); END IF;
  next_quantity := GREATEST(0,item.quantity + direction * item.increment);
  IF next_quantity > 999999.999 THEN RETURN jsonb_build_object('error','invalid'); END IF;
  INSERT INTO supply_commands (user_id,command_key,item_id) VALUES (owner_id,request_key,target_id);
  UPDATE supply_items SET quantity = next_quantity,version = version + 1,updated_at = clock_timestamp()
    WHERE user_id = owner_id AND id = target_id;
  RETURN jsonb_build_object('saved',true);
END $$;
