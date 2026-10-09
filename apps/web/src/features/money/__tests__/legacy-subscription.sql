INSERT INTO users VALUES ('edededed-eded-4ded-8ded-edededededed');
SELECT initialize_money('edededed-eded-4ded-8ded-edededededed');
SELECT save_money_category('edededed-eded-4ded-8ded-edededededed','efefefef-efef-4fef-8fef-efefefefefef','Subscription',true);
INSERT INTO money_expenses (id,user_id,category_id,amount_minor,currency,recorded_date,note)
  SELECT 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',user_id,id,1234,'AUD','2026-09-01','Legacy Other fixture'
  FROM money_categories WHERE user_id = 'edededed-eded-4ded-8ded-edededededed' AND seed_key = 'other';
