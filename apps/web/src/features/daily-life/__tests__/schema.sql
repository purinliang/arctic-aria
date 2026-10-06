BEGIN;
INSERT INTO users VALUES ('11111111-1111-4111-8111-111111111111'), ('22222222-2222-4222-8222-222222222222');
INSERT INTO daily_life_entries (user_id, capture_key, activity, occurred_at)
VALUES ('11111111-1111-4111-8111-111111111111', '33333333-3333-4333-8333-333333333333', 'meal', '2026-10-04T12:59:00Z');
INSERT INTO daily_life_entries (user_id, capture_key, activity, occurred_at)
VALUES ('11111111-1111-4111-8111-111111111111', '33333333-3333-4333-8333-333333333333', 'sleep', now())
ON CONFLICT (user_id, capture_key) DO UPDATE SET capture_key = EXCLUDED.capture_key
WHERE daily_life_entries.deleted_at IS NULL;
INSERT INTO daily_life_chat_turns (user_id, capture_key, message)
VALUES ('11111111-1111-4111-8111-111111111111', '33333333-3333-4333-8333-333333333333', 'Delete my projects');

DO $$
BEGIN
  IF (SELECT count(*) FROM daily_life_entries) != 1 OR (SELECT activity FROM daily_life_entries LIMIT 1) != 'meal' THEN
    RAISE EXCEPTION 'Capture retry must preserve one original activity';
  END IF;
  IF EXISTS (SELECT 1 FROM daily_life_entries WHERE user_id = '22222222-2222-4222-8222-222222222222') THEN
    RAISE EXCEPTION 'Owners must have separate records';
  END IF;
  IF (SELECT response_code FROM daily_life_chat_turns LIMIT 1) != 'chat_not_available' THEN
    RAISE EXCEPTION 'Chat must only save the development response';
  END IF;
  BEGIN
    INSERT INTO daily_life_entries (user_id, capture_key, activity, occurred_at)
    VALUES ('11111111-1111-4111-8111-111111111111', gen_random_uuid(), 'work', now());
    RAISE EXCEPTION 'Expected activity check';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO daily_life_chat_turns (user_id, capture_key, message, response_code)
    VALUES ('11111111-1111-4111-8111-111111111111', gen_random_uuid(), 'hello', 'executed');
    RAISE EXCEPTION 'Expected response check';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  IF (SELECT count(*) FROM daily_life_entries
      WHERE occurred_at >= (((('2026-10-05T01:00:00Z'::timestamptz AT TIME ZONE 'Australia/Sydney')::date - 6)::timestamp) AT TIME ZONE 'Australia/Sydney')
        AND occurred_at <= '2026-10-05T01:00:00Z'::timestamptz) != 1 THEN
    RAISE EXCEPTION 'Recent query must work across DST';
  END IF;
END $$;
UPDATE daily_life_entries SET deleted_at = now();
INSERT INTO daily_life_entries (user_id, capture_key, activity, occurred_at)
VALUES ('11111111-1111-4111-8111-111111111111', '33333333-3333-4333-8333-333333333333', 'sleep', now())
ON CONFLICT (user_id, capture_key) DO UPDATE SET capture_key = EXCLUDED.capture_key
WHERE daily_life_entries.deleted_at IS NULL;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM daily_life_entries WHERE deleted_at IS NULL) THEN
    RAISE EXCEPTION 'Retry must not revive deleted entries';
  END IF;
END $$;
ROLLBACK;
