#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
container="arctic-aria-tools-schema-$$-$RANDOM"
docker run --rm -d --name "$container" -e POSTGRES_HOST_AUTH_METHOD=trust postgres:18 >/dev/null
trap 'docker stop "$container" >/dev/null 2>&1 || true' EXIT
for attempt in $(seq 1 30); do
  if docker exec "$container" pg_isready -U postgres >/dev/null 2>&1; then break; fi
  sleep 1
done
docker exec "$container" psql -U postgres -v ON_ERROR_STOP=1 -c 'CREATE TABLE users (id uuid PRIMARY KEY);' >/dev/null
docker exec -i "$container" psql -U postgres -v ON_ERROR_STOP=1 < "$root/apps/database/migrations/0037_create_money.sql" >/dev/null
docker exec -i "$container" psql -U postgres -v ON_ERROR_STOP=1 < "$root/apps/web/src/features/money/__tests__/schema.sql"
docker exec -i "$container" psql -U postgres -v ON_ERROR_STOP=1 < "$root/apps/database/migrations/0038_create_supplies.sql" >/dev/null
docker exec -i "$container" psql -U postgres -v ON_ERROR_STOP=1 < "$root/apps/web/src/features/supplies/__tests__/schema.sql"

docker exec "$container" psql -U postgres -v ON_ERROR_STOP=1 -c "INSERT INTO users VALUES ('11111111-1111-4111-8111-111111111111'); SELECT create_supply('11111111-1111-4111-8111-111111111111','33333333-3333-4333-8333-333333333333','household','Concurrent fixture',NULL,0,2);" >/dev/null
docker exec "$container" psql -U postgres -v ON_ERROR_STOP=1 -c "SELECT change_supply('11111111-1111-4111-8111-111111111111','33333333-3333-4333-8333-333333333333',1,'44444444-4444-4444-8444-444444444444','replace',5,true);" >/dev/null &
first=$!
docker exec "$container" psql -U postgres -v ON_ERROR_STOP=1 -c "SELECT change_supply('11111111-1111-4111-8111-111111111111','33333333-3333-4333-8333-333333333333',1,'55555555-5555-4555-8555-555555555555','replace',5,true);" >/dev/null &
second=$!
wait "$first"
wait "$second"
remaining="$(docker exec "$container" psql -U postgres -At -c "SELECT spares || ':' || version || ':' || (SELECT count(*) FROM supply_observations WHERE item_id = supply_items.id) FROM supply_items WHERE id = '33333333-3333-4333-8333-333333333333';")"
if [[ "$remaining" != "1:2:2" ]]; then
  printf 'Concurrent replacement failed: %s\n' "$remaining" >&2
  exit 1
fi
printf 'Concurrent replacement passed: one spare consumed, one new observation.\n'
