BEGIN;
INSERT INTO users VALUES ('11111111-1111-4111-8111-111111111111'), ('22222222-2222-4222-8222-222222222222');
DO $$
DECLARE owner_id uuid := '11111111-1111-4111-8111-111111111111'; other_id uuid := '22222222-2222-4222-8222-222222222222';
  target uuid := gen_random_uuid(); key uuid := gen_random_uuid(); first_cycle uuid; result jsonb;
BEGIN
  result := create_supply(owner_id,target,'household','Soap',NULL,5,2);
  first_cycle := (result->>'cycle_id')::uuid;
  PERFORM create_supply(owner_id,target,'food','Different',NULL,1,0);
  IF (SELECT count(*) FROM supply_observations WHERE item_id = target) != 1 THEN RAISE EXCEPTION 'Creation is replay-safe'; END IF;
  result := change_supply(other_id,target,1,key,'observe',3,false);
  IF result->>'error' != 'missing' THEN RAISE EXCEPTION 'Stock owner isolation'; END IF;
  result := change_supply(owner_id,target,1,key,'observe',3,false);
  IF (result->'item'->>'level')::integer != 3 THEN RAISE EXCEPTION 'Observation persists'; END IF;
  result := change_supply(owner_id,target,1,key,'observe',1,false);
  IF (result->'item'->>'version')::integer != 2 THEN RAISE EXCEPTION 'Retry must not modify'; END IF;
  result := change_supply(owner_id,target,1,gen_random_uuid(),'replace',5,true);
  IF result->>'error' != 'stale' THEN RAISE EXCEPTION 'Version guard'; END IF;
  result := change_supply(owner_id,target,NULL,gen_random_uuid(),'replace',5,true);
  IF result->>'error' != 'stale' THEN RAISE EXCEPTION 'Missing version guard'; END IF;
  result := change_supply(owner_id,target,2,gen_random_uuid(),'observe',4,false);
  IF result->>'error' != 'level_increase' THEN RAISE EXCEPTION 'Explicit replacement required'; END IF;
  key := gen_random_uuid();
  result := change_supply(owner_id,target,2,key,'replace',5,true);
  IF (result->'item'->>'spares')::integer != 1 OR (result->'item'->>'cycle_id')::uuid = first_cycle THEN RAISE EXCEPTION 'Replace atomic stock and cycle'; END IF;
  PERFORM change_supply(owner_id,target,2,key,'replace',5,true);
  IF (SELECT spares FROM supply_items WHERE id = target) != 1 THEN RAISE EXCEPTION 'No double consumption'; END IF;
  BEGIN
    INSERT INTO supply_wishlist (id,user_id,title,linked_supply_id) VALUES (gen_random_uuid(),other_id,'Fixture',target);
    RAISE EXCEPTION 'Expected linked owner foreign key';
  EXCEPTION WHEN foreign_key_violation THEN NULL; END;
  INSERT INTO supply_wishlist (id,user_id,title,linked_supply_id,status) VALUES (gen_random_uuid(),owner_id,'Fixture',target,'purchased');
  IF (SELECT spares FROM supply_items WHERE id = target) != 1 THEN RAISE EXCEPTION 'Wishlist does not alter stock'; END IF;
  UPDATE supply_items SET archived_at = now() WHERE id = target;
  result := change_supply(owner_id,target,3,key,'replace',5,true);
  IF result->>'error' != 'missing' THEN RAISE EXCEPTION 'Cannot revive archived stock'; END IF;
  IF (SELECT count(*) FROM supply_observations WHERE item_id = target) != 3 THEN RAISE EXCEPTION 'History retained'; END IF;
END $$;
ROLLBACK;
