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
