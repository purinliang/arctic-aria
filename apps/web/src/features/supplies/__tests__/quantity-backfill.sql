DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM supply_items WHERE id = '88888888-8888-4888-8888-888888888888'
    AND quantity = 3 AND level = 3 AND spares = 2 AND unit = 'unit' AND increment = 1 AND target_quantity = 5 AND low_stock_threshold = 1)
    OR (SELECT count(*) FROM supply_observations WHERE item_id = '88888888-8888-4888-8888-888888888888') != 1 THEN
    RAISE EXCEPTION 'Migration must preserve legacy levels, spares, and observations';
  END IF;
END $$;
