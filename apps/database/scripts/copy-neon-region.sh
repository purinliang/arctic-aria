#!/usr/bin/env bash
set -euo pipefail

# Local Neon region data copy helper.
#
# Store these UNPOOLED Neon connection strings in `apps/database/.env.local`:
# SOURCE_NEON_UNPOOLED_URL="postgresql://..."
# DESTINATION_NEON_UNPOOLED_URL="postgresql://..."
#
# Do not use pooled PgBouncer URLs for pg_dump/pg_restore.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATABASE_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
REPO_ROOT="$(cd "${DATABASE_DIR}/../.." && pwd)"
ENV_FILE="${DATABASE_DIR}/.env.local"
DUMP_DIR="/tmp/arctic-aria-db-copy"
DUMP_FILE="${DUMP_DIR}/arctic-aria-$(date +%Y%m%d-%H%M%S).dump"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Missing ${ENV_FILE}. Add SOURCE_NEON_UNPOOLED_URL and DESTINATION_NEON_UNPOOLED_URL first."
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "${ENV_FILE}"
set +a

if [[ -z "${SOURCE_NEON_UNPOOLED_URL:-}" || -z "${DESTINATION_NEON_UNPOOLED_URL:-}" ]]; then
  echo "Fill SOURCE_NEON_UNPOOLED_URL and DESTINATION_NEON_UNPOOLED_URL in ${ENV_FILE} first."
  exit 1
fi

for command_name in pg_dump pg_restore psql; do
  if ! command -v "${command_name}" >/dev/null 2>&1; then
    echo "Missing ${command_name}. Install PostgreSQL client tools first."
    echo "Ubuntu/WSL with PostgreSQL Apt repo: sudo apt-get install -y postgresql-client-17"
    exit 1
  fi
done

echo "Checking PostgreSQL client/server versions."
source_server_version_num="$(psql "${SOURCE_NEON_UNPOOLED_URL}" -v ON_ERROR_STOP=1 -At -c "SHOW server_version_num;")"
destination_server_version_num="$(psql "${DESTINATION_NEON_UNPOOLED_URL}" -v ON_ERROR_STOP=1 -At -c "SHOW server_version_num;")"
source_server_major="$((source_server_version_num / 10000))"
destination_server_major="$((destination_server_version_num / 10000))"
required_client_major="${source_server_major}"

if (( destination_server_major > required_client_major )); then
  required_client_major="${destination_server_major}"
fi

pg_dump_major="$(pg_dump --version | sed -E 's/.* ([0-9]+)\..*/\1/')"
pg_restore_major="$(pg_restore --version | sed -E 's/.* ([0-9]+)\..*/\1/')"

if (( pg_dump_major < required_client_major || pg_restore_major < required_client_major )); then
  echo "PostgreSQL client version is too old."
  echo "Source server major: ${source_server_major}"
  echo "Destination server major: ${destination_server_major}"
  echo "pg_dump major: ${pg_dump_major}"
  echo "pg_restore major: ${pg_restore_major}"
  echo "Install PostgreSQL client ${required_client_major}, then rerun this script."
  echo "Ubuntu/WSL with PostgreSQL Apt repo: sudo apt-get install -y postgresql-client-${required_client_major}"
  exit 1
fi

mkdir -p "${DUMP_DIR}"

echo "Step 1/4: Dumping old/source public schema to ${DUMP_FILE}"
pg_dump \
  -Fc \
  -v \
  --schema=public \
  --no-owner \
  --no-privileges \
  -d "${SOURCE_NEON_UNPOOLED_URL}" \
  -f "${DUMP_FILE}"

echo
echo "Step 2/4: Resetting new/destination public schema."
echo "This is destructive for the DESTINATION database only."
read -r -p "Type RESET DESTINATION to continue: " confirmation

if [[ "${confirmation}" != "RESET DESTINATION" ]]; then
  echo "Canceled before destination reset."
  exit 1
fi

psql "${DESTINATION_NEON_UNPOOLED_URL}" \
  -v ON_ERROR_STOP=1 \
  -c "DROP SCHEMA IF EXISTS public CASCADE;"

echo
echo "Step 3/4: Restoring public schema dump into new/destination database."
pg_restore \
  -v \
  --exit-on-error \
  --no-owner \
  --no-privileges \
  -d "${DESTINATION_NEON_UNPOOLED_URL}" \
  "${DUMP_FILE}"

echo
echo "Step 4/4: Running Arctic Aria migration validation against apps/web/.env.local."
echo "Before continuing, make sure apps/web/.env.local NEON_POSTGRES_URL points at the destination database."
read -r -p "Type MIGRATE DESTINATION to continue: " migrate_confirmation

if [[ "${migrate_confirmation}" != "MIGRATE DESTINATION" ]]; then
  echo "Skipped migration validation."
  echo "Dump remains at ${DUMP_FILE}"
  exit 0
fi

pnpm --dir "${REPO_ROOT}/apps/web" database:migrate

echo
echo "Done. Dump remains at ${DUMP_FILE}"
