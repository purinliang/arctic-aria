INSERT INTO users VALUES ('66666666-6666-4666-8666-666666666666');
SELECT initialize_money('66666666-6666-4666-8666-666666666666');
UPDATE money_categories SET name = 'Legacy food',archived_at = now()
  WHERE user_id = '66666666-6666-4666-8666-666666666666' AND seed_key = 'food';
INSERT INTO money_expenses (id,user_id,category_id,amount_minor,currency,recorded_date)
  SELECT gen_random_uuid(),user_id,id,1234,'AUD','2026-10-07' FROM money_categories
  WHERE user_id = '66666666-6666-4666-8666-666666666666' AND seed_key = 'food';
