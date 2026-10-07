BEGIN;
INSERT INTO users VALUES ('11111111-1111-4111-8111-111111111111'),('22222222-2222-4222-8222-222222222222');
DO $$
DECLARE owner_id uuid := '11111111-1111-4111-8111-111111111111';
  target_id uuid := '33333333-3333-4333-8333-333333333333'; request_id uuid := gen_random_uuid(); result jsonb;
BEGIN
  IF NOT save_supply_stock(owner_id,target_id,true,1,'food','Rice',NULL,1.5,'kg',0.5,2,1,0) THEN RAISE EXCEPTION 'Create quantity'; END IF;
  PERFORM adjust_supply_quantity(owner_id,target_id,1,request_id,-1);
  PERFORM adjust_supply_quantity(owner_id,target_id,1,request_id,-1);
  IF (SELECT quantity FROM supply_items WHERE id = target_id) != 1 OR (SELECT version FROM supply_items WHERE id = target_id) != 2 THEN RAISE EXCEPTION 'Exact step and replay'; END IF;
  result := adjust_supply_quantity(owner_id,target_id,1,gen_random_uuid(),1);
  IF result->>'error' != 'stale' THEN RAISE EXCEPTION 'Stale version'; END IF;
  result := adjust_supply_quantity('22222222-2222-4222-8222-222222222222',target_id,2,gen_random_uuid(),1);
  IF result->>'error' != 'missing' THEN RAISE EXCEPTION 'Owner isolation'; END IF;
  IF NOT save_supply_stock(owner_id,target_id,false,2,'food','Rice',NULL,2,'kg',0.5,2,1,0) THEN RAISE EXCEPTION 'Edit stock config'; END IF;
  PERFORM adjust_supply_quantity(owner_id,target_id,3,gen_random_uuid(),1);
  IF (SELECT quantity FROM supply_items WHERE id = target_id) != 2.5 THEN RAISE EXCEPTION 'Target not maximum'; END IF;
  IF save_supply_stock(owner_id,target_id,false,2,'food','Rice',NULL,2,'kg',0.5,2,1,0) THEN RAISE EXCEPTION 'No stale config edit'; END IF;
  BEGIN
    UPDATE supply_items SET increment = 0 WHERE id = target_id;
    RAISE EXCEPTION 'Expected increment check';
  EXCEPTION WHEN check_violation THEN NULL; END;
  BEGIN
    UPDATE supply_items SET low_stock_threshold = 3 WHERE id = target_id;
    RAISE EXCEPTION 'Expected threshold check';
  EXCEPTION WHEN check_violation THEN NULL; END;
  PERFORM save_supply_stock(owner_id,target_id,false,4,'food','Rice',NULL,0.2,'kg',0.5,2,1,0);
  PERFORM adjust_supply_quantity(owner_id,target_id,5,gen_random_uuid(),-1);
  IF (SELECT quantity FROM supply_items WHERE id = target_id) != 0 THEN RAISE EXCEPTION 'Clamp at zero'; END IF;
END $$;
ROLLBACK;
