CREATE TABLE supply_items (
  id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('food','household')),
  title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 100),
  note text CHECK (note IS NULL OR char_length(note) <= 500),
  level integer NOT NULL CHECK (level BETWEEN 0 AND 5),
  spares integer NOT NULL DEFAULT 0 CHECK (spares BETWEEN 0 AND 999),
  version integer NOT NULL DEFAULT 1 CHECK (version >= 1), cycle_id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), archived_at timestamptz,
  UNIQUE (user_id,id)
);
CREATE TABLE supply_observations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id uuid NOT NULL, cycle_id uuid NOT NULL, level integer NOT NULL CHECK (level BETWEEN 0 AND 5),
  recorded_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (user_id,item_id) REFERENCES supply_items(user_id,id)
);
CREATE INDEX supply_observations_recent ON supply_observations (user_id,item_id,cycle_id,recorded_at DESC,id DESC);
CREATE TABLE supply_commands (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, command_key uuid NOT NULL, item_id uuid NOT NULL,
  PRIMARY KEY (user_id,command_key), FOREIGN KEY (user_id,item_id) REFERENCES supply_items(user_id,id)
);
CREATE TABLE supply_wishlist (
  id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 100),
  country text CHECK (country IS NULL OR char_length(country) <= 100),
  shop text CHECK (shop IS NULL OR char_length(shop) <= 200),
  url text CHECK (url IS NULL OR (char_length(url) <= 1000 AND url ~ '^https?://')),
  note text CHECK (note IS NULL OR char_length(note) <= 500), linked_supply_id uuid,
  status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','purchased')),
  version integer NOT NULL DEFAULT 1 CHECK (version >= 1),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), archived_at timestamptz,
  FOREIGN KEY (user_id,linked_supply_id) REFERENCES supply_items(user_id,id)
);
CREATE INDEX supply_items_active ON supply_items (user_id,kind,title) WHERE archived_at IS NULL;
CREATE INDEX supply_wishlist_active ON supply_wishlist (user_id,status,created_at DESC) WHERE archived_at IS NULL;

CREATE FUNCTION create_supply(owner_id uuid, target_id uuid, item_kind text, item_title text, item_note text, initial_level integer, initial_spares integer)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE item supply_items;
BEGIN
  INSERT INTO supply_items (user_id,id,kind,title,note,level,spares) VALUES (owner_id,target_id,item_kind,item_title,item_note,initial_level,initial_spares)
    ON CONFLICT (id) DO NOTHING;
  IF FOUND THEN
    INSERT INTO supply_observations (user_id,item_id,cycle_id,level)
      SELECT owner_id,id,cycle_id,level FROM supply_items WHERE id = target_id AND user_id = owner_id;
  END IF;
  SELECT * INTO item FROM supply_items WHERE user_id = owner_id AND id = target_id AND archived_at IS NULL;
  RETURN CASE WHEN FOUND THEN to_jsonb(item) ELSE NULL END;
END $$;

CREATE FUNCTION change_supply(owner_id uuid, target_id uuid, expected_version integer, request_key uuid, operation text, next_level integer, use_spare boolean)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE item supply_items; replay_target uuid;
BEGIN
  SELECT * INTO item FROM supply_items WHERE user_id = owner_id AND id = target_id AND archived_at IS NULL FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('error','missing'); END IF;
  SELECT item_id INTO replay_target FROM supply_commands WHERE user_id = owner_id AND command_key = request_key;
  IF FOUND THEN
    IF replay_target != target_id THEN RETURN jsonb_build_object('error','invalid'); END IF;
    RETURN jsonb_build_object('item',to_jsonb(item));
  END IF;
  IF expected_version IS NULL OR item.version != expected_version THEN RETURN jsonb_build_object('error','stale'); END IF;
  IF operation = 'observe' THEN
    IF next_level IS NULL OR next_level < 0 OR next_level > item.level THEN RETURN jsonb_build_object('error','level_increase'); END IF;
    item.level := next_level;
  ELSIF operation = 'replace' THEN
    IF use_spare IS NULL OR (use_spare AND item.spares = 0) THEN RETURN jsonb_build_object('error','invalid'); END IF;
    item.level := 5; item.cycle_id := gen_random_uuid();
    IF use_spare THEN item.spares := item.spares - 1; END IF;
  ELSE RETURN jsonb_build_object('error','invalid'); END IF;
  INSERT INTO supply_commands (user_id,command_key,item_id) VALUES (owner_id,request_key,target_id);
  UPDATE supply_items SET level = item.level, spares = item.spares, cycle_id = item.cycle_id, version = version + 1, updated_at = clock_timestamp()
    WHERE user_id = owner_id AND id = target_id RETURNING * INTO item;
  INSERT INTO supply_observations (user_id,item_id,cycle_id,level,recorded_at) VALUES (owner_id,target_id,item.cycle_id,item.level,item.updated_at);
  RETURN jsonb_build_object('item',to_jsonb(item));
END $$;
