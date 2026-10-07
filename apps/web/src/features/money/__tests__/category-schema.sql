BEGIN;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM money_expenses expense JOIN money_categories category ON category.id = expense.category_id
    WHERE expense.user_id = '66666666-6666-4666-8666-666666666666' AND category.seed_key = 'food'
      AND category.name = 'Legacy food' AND category.archived_at IS NULL AND expense.amount_minor = 1234) THEN
    RAISE EXCEPTION 'Migration must restore builtins without discarding names or expense references';
  END IF;
END $$;
INSERT INTO users VALUES ('11111111-1111-4111-8111-111111111111'),('22222222-2222-4222-8222-222222222222');
SELECT initialize_money('11111111-1111-4111-8111-111111111111');
DO $$
DECLARE owner_id uuid := '11111111-1111-4111-8111-111111111111'; food uuid;
  a uuid := '33333333-3333-4333-8333-333333333333'; b uuid := '44444444-4444-4444-8444-444444444444';
BEGIN
  SELECT id INTO food FROM money_categories WHERE user_id = owner_id AND seed_key = 'food';
  IF save_money_category(owner_id,food,'Changed',false) THEN RAISE EXCEPTION 'No builtin rename'; END IF;
  IF archive_money_category(owner_id,food) THEN RAISE EXCEPTION 'No builtin archival'; END IF;
  BEGIN
    UPDATE money_categories SET name = 'Changed' WHERE id = food;
    RAISE EXCEPTION 'Expected immutable builtin';
  EXCEPTION WHEN check_violation THEN NULL; END;
  BEGIN
    DELETE FROM money_categories WHERE id = food;
    RAISE EXCEPTION 'Expected immutable builtin deletion';
  EXCEPTION WHEN check_violation THEN NULL; END;
  IF NOT save_money_category(owner_id,a,'Custom A',true) OR NOT save_money_category(owner_id,b,'Custom B',true) THEN RAISE EXCEPTION 'Custom creation'; END IF;
  INSERT INTO money_expenses (id,user_id,category_id,amount_minor,currency,recorded_date)
    VALUES (gen_random_uuid(),owner_id,a,1234,'AUD','2026-10-07');
  IF reorder_money_categories(owner_id,ARRAY[a,food]) OR reorder_money_categories(owner_id,ARRAY[a,a])
    OR reorder_money_categories('22222222-2222-4222-8222-222222222222',ARRAY[a,b]) THEN RAISE EXCEPTION 'Reject invalid order'; END IF;
  IF NOT reorder_money_categories(owner_id,ARRAY[b,a]) THEN RAISE EXCEPTION 'Save custom order'; END IF;
  IF (SELECT position FROM money_categories WHERE id = b) != 0 OR (SELECT position FROM money_categories WHERE id = a) != 1 THEN RAISE EXCEPTION 'Order applied'; END IF;
  IF NOT save_money_category(owner_id,a,'Renamed custom',false) OR NOT archive_money_category(owner_id,a) THEN RAISE EXCEPTION 'Custom edits allowed'; END IF;
  IF NOT EXISTS (SELECT 1 FROM money_expenses WHERE category_id = a) THEN RAISE EXCEPTION 'Keep category references'; END IF;
  IF NOT EXISTS (SELECT 1 FROM money_categories WHERE id = food AND seed_key = 'food' AND archived_at IS NULL) THEN RAISE EXCEPTION 'Builtin unchanged'; END IF;
END $$;
DELETE FROM users WHERE id = '11111111-1111-4111-8111-111111111111';
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM money_categories WHERE user_id = '11111111-1111-4111-8111-111111111111') THEN
    RAISE EXCEPTION 'Account removal must still cascade';
  END IF;
END $$;
ROLLBACK;
DELETE FROM users WHERE id = '66666666-6666-4666-8666-666666666666';
