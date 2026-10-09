BEGIN;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM money_expenses expense JOIN money_categories category ON category.id = expense.category_id
    WHERE expense.id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee' AND category.seed_key = 'other' AND expense.amount_minor = 1234)
    OR NOT EXISTS (SELECT 1 FROM money_categories WHERE user_id = 'edededed-eded-4ded-8ded-edededededed' AND seed_key = 'subscription')
    OR NOT EXISTS (SELECT 1 FROM money_categories WHERE id = 'efefefef-efef-4fef-8fef-efefefefefef' AND seed_key IS NULL AND name = 'Subscription') THEN
    RAISE EXCEPTION 'Migration must preserve historical associations and custom names';
  END IF;
END $$;
DO $$
DECLARE
  owner_id uuid := 'abababab-abab-4bab-8bab-abababababab';
  other_id uuid;
  subscription_id uuid;
  custom_id uuid := 'cdcdcdcd-cdcd-4dcd-8dcd-cdcdcdcdcdcd';
BEGIN
  INSERT INTO users VALUES (owner_id);
  PERFORM initialize_money(owner_id);
  SELECT id INTO other_id FROM money_categories WHERE user_id = owner_id AND seed_key = 'other';
  SELECT id INTO subscription_id FROM money_categories WHERE user_id = owner_id AND seed_key = 'subscription';
  PERFORM initialize_money(owner_id);
  IF (SELECT count(*) FROM money_categories WHERE user_id = owner_id AND seed_key IS NOT NULL) <> 8 THEN
    RAISE EXCEPTION 'Eight idempotent built-ins required';
  END IF;
  IF NOT save_money_category(owner_id,custom_id,'Subscription',true) THEN
    RAISE EXCEPTION 'Custom names must remain independent of built-ins';
  END IF;
  IF save_money_category(owner_id,subscription_id,'Renamed',false) OR archive_money_category(owner_id,subscription_id) THEN
    RAISE EXCEPTION 'Subscription must be immutable';
  END IF;
  BEGIN
    UPDATE money_categories SET name = 'Renamed' WHERE id = subscription_id;
    RAISE EXCEPTION 'Subscription rename unexpectedly allowed';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  INSERT INTO money_expenses (id,user_id,category_id,amount_minor,currency,recorded_date,note)
    VALUES (gen_random_uuid(),owner_id,other_id,100,'AUD','2026-09-01','Original Other fixture'),
      (gen_random_uuid(),owner_id,custom_id,200,'CNY','2026-10-01','Custom fixture');
  PERFORM initialize_money(owner_id);
  IF NOT EXISTS (SELECT 1 FROM money_expenses WHERE user_id = owner_id AND category_id = other_id)
    OR NOT EXISTS (SELECT 1 FROM money_expenses WHERE user_id = owner_id AND category_id = custom_id) THEN
    RAISE EXCEPTION 'Historical category associations changed';
  END IF;
END $$;
ROLLBACK;
