BEGIN;
INSERT INTO users VALUES ('11111111-1111-4111-8111-111111111111'), ('22222222-2222-4222-8222-222222222222');
SELECT initialize_money('11111111-1111-4111-8111-111111111111');
SELECT initialize_money('11111111-1111-4111-8111-111111111111');
SELECT initialize_money('22222222-2222-4222-8222-222222222222');
DO $$ DECLARE owner_id uuid := '11111111-1111-4111-8111-111111111111'; category uuid;
BEGIN
  IF (SELECT count(*) FROM money_categories WHERE user_id = owner_id) != 7 THEN RAISE EXCEPTION 'Seed categories must be idempotent'; END IF;
  IF (SELECT count(*) FROM money_quick_categories WHERE user_id = owner_id) != 5 THEN RAISE EXCEPTION 'Seed five quick categories'; END IF;
  SELECT id INTO category FROM money_categories WHERE user_id = owner_id AND seed_key = 'food';
  INSERT INTO money_expenses (id,user_id,category_id,amount_minor,currency,recorded_date) VALUES (gen_random_uuid(),owner_id,category,10,'AUD','2026-10-07');
  BEGIN
    INSERT INTO money_expenses (id,user_id,category_id,amount_minor,currency,recorded_date) VALUES (gen_random_uuid(),'22222222-2222-4222-8222-222222222222',category,10,'AUD','2026-10-07');
    RAISE EXCEPTION 'Expected owner foreign key';
  EXCEPTION WHEN foreign_key_violation THEN NULL; END;
  BEGIN
    INSERT INTO money_expenses (id,user_id,category_id,amount_minor,currency,recorded_date) VALUES (gen_random_uuid(),owner_id,category,10,'GBP','2026-10-07');
    RAISE EXCEPTION 'Expected currency check';
  EXCEPTION WHEN check_violation THEN NULL; END;
  IF save_money_settings(owner_id,ARRAY['AUD','AUD'],ARRAY[category]) THEN RAISE EXCEPTION 'Duplicate currencies rejected'; END IF;
  IF NOT save_money_settings(owner_id,ARRAY['CNY','AUD'],ARRAY[category]) THEN RAISE EXCEPTION 'Preferences saved'; END IF;
  IF (SELECT preferred_currencies[1] FROM money_settings WHERE user_id = owner_id) != 'CNY' THEN RAISE EXCEPTION 'Ordered default'; END IF;
  PERFORM archive_money_category(owner_id,category);
  IF NOT EXISTS (SELECT 1 FROM money_expenses WHERE category_id = category) THEN RAISE EXCEPTION 'Keep history'; END IF;
  IF EXISTS (SELECT 1 FROM money_quick_categories WHERE category_id = category) THEN RAISE EXCEPTION 'Remove archived quick category'; END IF;
  IF save_money_settings(owner_id,ARRAY['AUD'],ARRAY[category]) THEN RAISE EXCEPTION 'Archived category rejected'; END IF;
END $$;
ROLLBACK;
