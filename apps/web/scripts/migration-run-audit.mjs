import { schemaHashForMigrations } from "./migration-metadata.mjs";

const statusValues = ["running", "success", "failed"];
const maxFailureMessageLength = 500;

export async function ensureMigrationAuditTables(sql) {
  await sql.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  await sql.query(`
    ALTER TABLE schema_migrations
      ADD COLUMN IF NOT EXISTS checksum text,
      ADD COLUMN IF NOT EXISTS app_version text,
      ADD COLUMN IF NOT EXISTS app_commit text,
      ADD COLUMN IF NOT EXISTS app_source_state text
  `);

  await sql.query(`
    CREATE TABLE IF NOT EXISTS schema_migration_runs (
      id bigserial PRIMARY KEY,
      checked_at timestamptz NOT NULL DEFAULT now(),
      finished_at timestamptz,
      status text NOT NULL DEFAULT 'success',
      app_version text NOT NULL,
      app_commit text NOT NULL,
      app_source_state text NOT NULL,
      applied_count integer NOT NULL DEFAULT 0,
      skipped_count integer NOT NULL DEFAULT 0,
      failure_stage text,
      failure_message text,
      failed_migration_name text
    )
  `);

  await sql.query(`
    ALTER TABLE schema_migration_runs
      ADD COLUMN IF NOT EXISTS expected_migration_count integer,
      ADD COLUMN IF NOT EXISTS expected_latest_migration text,
      ADD COLUMN IF NOT EXISTS expected_schema_hash text,
      ADD COLUMN IF NOT EXISTS actual_migration_count integer,
      ADD COLUMN IF NOT EXISTS actual_latest_migration text,
      ADD COLUMN IF NOT EXISTS actual_schema_hash text,
      ADD COLUMN IF NOT EXISTS finished_at timestamptz,
      ADD COLUMN IF NOT EXISTS status text,
      ADD COLUMN IF NOT EXISTS failure_stage text,
      ADD COLUMN IF NOT EXISTS failure_message text,
      ADD COLUMN IF NOT EXISTS failed_migration_name text
  `);

  await sql.query(`
    UPDATE schema_migration_runs
    SET status = 'success'
    WHERE status IS NULL
  `);

  await sql.query(`
    ALTER TABLE schema_migration_runs
      ALTER COLUMN status SET DEFAULT 'success',
      ALTER COLUMN status SET NOT NULL
  `);

  await sql.query(`
    ALTER TABLE schema_migration_runs
      DROP CONSTRAINT IF EXISTS schema_migration_runs_status_valid
  `);

  await sql.query(`
    ALTER TABLE schema_migration_runs
      ADD CONSTRAINT schema_migration_runs_status_valid CHECK (
        status IN ('running', 'success', 'failed')
      )
  `);
}

export async function startMigrationRun(sql, appMetadata) {
  const rows = await sql.query(
    `INSERT INTO schema_migration_runs (
       status,
       app_version,
       app_commit,
       app_source_state,
       expected_migration_count,
       expected_latest_migration,
       expected_schema_hash,
       applied_count,
       skipped_count
     )
     VALUES ('running', $1, $2, $3, $4, $5, $6, 0, 0)
     RETURNING id`,
    [
      appMetadata.version,
      appMetadata.commit,
      appMetadata.sourceState,
      appMetadata.expectedDatabase.migrationCount,
      appMetadata.expectedDatabase.latestMigrationName,
      appMetadata.expectedDatabase.schemaHash,
    ],
  );

  const runId = rows[0]?.id;

  if (!runId) {
    throw new Error("Migration run audit row was not created.");
  }

  return runId;
}

export async function finishMigrationRun(sql, input) {
  if (!isMigrationRunStatus(input.status)) {
    throw new Error(`Invalid migration run status: ${input.status}.`);
  }

  const failureStage = input.failure?.stage ?? null;
  const failureMessage = input.failure?.message ?? null;
  const failedMigrationName = input.failure?.migrationName ?? null;

  await sql.query(
    `UPDATE schema_migration_runs
     SET status = $2,
         finished_at = now(),
         app_version = $3,
         app_commit = $4,
         app_source_state = $5,
         expected_migration_count = $6,
         expected_latest_migration = $7,
         expected_schema_hash = $8,
         actual_migration_count = $9,
         actual_latest_migration = $10,
         actual_schema_hash = $11,
         applied_count = $12,
         skipped_count = $13,
         failure_stage = $14,
         failure_message = $15,
         failed_migration_name = $16
     WHERE id = $1`,
    [
      input.runId,
      input.status,
      input.appMetadata.version,
      input.appMetadata.commit,
      input.appMetadata.sourceState,
      input.appMetadata.expectedDatabase.migrationCount,
      input.appMetadata.expectedDatabase.latestMigrationName,
      input.appMetadata.expectedDatabase.schemaHash,
      input.actualMetadata.migrationCount,
      input.actualMetadata.latestMigrationName,
      input.actualMetadata.schemaHash,
      input.appliedCount,
      input.skippedCount,
      failureStage,
      failureMessage,
      failedMigrationName,
    ],
  );
}

export function appliedRowsMetadata(appliedRows) {
  const latestMigrationName = appliedRows.at(-1)?.name ?? "none";

  if (appliedRows.some((row) => !row.checksum)) {
    return {
      migrationCount: appliedRows.length,
      latestMigrationName,
      schemaHash: "unknown",
    };
  }

  return {
    migrationCount: appliedRows.length,
    latestMigrationName,
    schemaHash: schemaHashForMigrations(appliedRows),
  };
}

export function safeMigrationFailureMessage(error) {
  const rawMessage =
    error instanceof Error ? error.message : String(error ?? "unknown error");
  const collapsed = rawMessage
    .replace(/postgres(?:ql)?:\/\/\S+/gi, "[redacted-database-url]")
    .replace(/\s+/g, " ")
    .trim();

  if (collapsed.length <= maxFailureMessageLength) {
    return collapsed;
  }

  return `${collapsed.slice(0, maxFailureMessageLength - 3)}...`;
}

export function isMigrationRunStatus(status) {
  return statusValues.includes(status);
}
