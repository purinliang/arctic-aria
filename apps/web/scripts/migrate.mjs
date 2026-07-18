import { readFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { neon } from "@neondatabase/serverless";
import { resolveAppMetadata } from "./app-metadata.mjs";
import {
  appliedRowsMetadata,
  ensureMigrationAuditTables,
  finishMigrationRun,
  safeMigrationFailureMessage,
  startMigrationRun,
} from "./migration-run-audit.mjs";
import {
  readMigrationFiles,
  validateAppliedMigrationHistory,
} from "./migration-metadata.mjs";

const appRoot = process.cwd();
const envFiles = [".env.local", ".env.development.local"];
const databaseUrlKey = "NEON_POSTGRES_URL";

function loadEnvFiles() {
  for (const file of envFiles) {
    const filePath = path.join(appRoot, file);

    if (!existsSync(filePath)) {
      continue;
    }

    const content = readFileSync(filePath, "utf8");

    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);

      if (!match) {
        continue;
      }

      const [, key, rawValue] = match;

      if (process.env[key] !== undefined) {
        continue;
      }

      process.env[key] = rawValue.replace(/^["']|["']$/g, "");
    }
  }
}

function getMigrationDatabaseUrl() {
  if (process.env[databaseUrlKey]) {
    return process.env[databaseUrlKey];
  }

  throw new Error(`Missing database URL. Set ${databaseUrlKey}.`);
}

function splitStatements(sqlText) {
  return sqlText
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);
}

loadEnvFiles();

const sql = neon(getMigrationDatabaseUrl());
const appMetadata = resolveAppMetadata(appRoot);
const migrations = readMigrationFiles(appRoot);

let migrationRunId;
let failureStage = "startup";
let activeMigrationName = null;
let appliedRows = [];
let appliedCount = 0;
let skippedCount = 0;

try {
  console.log(
    `Migration app metadata: version=${appMetadata.version}, commit=${appMetadata.commit}, source=${appMetadata.sourceState}`,
  );
  console.log(
    `Expected database metadata: migrations=${appMetadata.expectedDatabase.migrationCount}, schema=${appMetadata.expectedDatabase.schemaHash}`,
  );

  if (appMetadata.sourceState === "dirty") {
    console.warn(
      "Warning: database migrations are running from a dirty working tree.",
    );
  }

  failureStage = "ensure_metadata_tables";
  await ensureMigrationAuditTables(sql);

  failureStage = "start_run";
  migrationRunId = await startMigrationRun(sql, appMetadata);

  failureStage = "read_applied_history";
  appliedRows = await sql.query(
    "SELECT name, checksum FROM schema_migrations ORDER BY name",
  );

  failureStage = "validate_history";
  const historyCheck = validateAppliedMigrationHistory(
    appliedRows,
    appMetadata.expectedDatabase.migrations,
  );

  if (!historyCheck.ok) {
    throw new Error(historyCheck.message);
  }

  failureStage = "backfill_checksums";
  for (const backfill of historyCheck.checksumBackfills) {
    await sql.query(
      "UPDATE schema_migrations SET checksum = $2 WHERE name = $1",
      [backfill.name, backfill.checksum],
    );
    const row = appliedRows.find((applied) => applied.name === backfill.name);

    if (row) {
      row.checksum = backfill.checksum;
    }

    console.log(`Recorded checksum for ${backfill.name}`);
  }

  const appliedNames = new Set(appliedRows.map((row) => row.name));

  for (const migration of migrations) {
    activeMigrationName = migration.name;

    if (appliedNames.has(migration.name)) {
      skippedCount += 1;
      console.log(`Skipping ${migration.name}`);
      continue;
    }

    failureStage = "read_migration_file";
    const sqlText = await readFile(migration.filePath, "utf8");

    failureStage = "apply_migration";
    for (const statement of splitStatements(sqlText)) {
      await sql.query(statement);
    }

    failureStage = "record_migration";
    await sql.query(
      `INSERT INTO schema_migrations (
         name, checksum, app_version, app_commit, app_source_state
       )
       VALUES ($1, $2, $3, $4, $5)`,
      [
        migration.name,
        migration.checksum,
        appMetadata.version,
        appMetadata.commit,
        appMetadata.sourceState,
      ],
    );
    appliedRows.push({
      name: migration.name,
      checksum: migration.checksum,
    });
    appliedNames.add(migration.name);
    appliedCount += 1;
    console.log(`Applied ${migration.name}`);
  }

  activeMigrationName = null;
  failureStage = "finish_success";
  await finishMigrationRun(sql, {
    runId: migrationRunId,
    status: "success",
    appMetadata,
    actualMetadata: appliedRowsMetadata(appliedRows),
    appliedCount,
    skippedCount,
  });

  console.log(
    `Recorded migration run metadata: status=success, applied=${appliedCount}, skipped=${skippedCount}`,
  );
} catch (error) {
  const failureMessage = safeMigrationFailureMessage(error);

  console.error(
    `Migration failed: stage=${failureStage}, migration=${activeMigrationName ?? "none"}, message=${failureMessage}`,
  );

  if (migrationRunId) {
    try {
      await finishMigrationRun(sql, {
        runId: migrationRunId,
        status: "failed",
        appMetadata,
        actualMetadata: appliedRowsMetadata(appliedRows),
        appliedCount,
        skippedCount,
        failure: {
          stage: failureStage,
          message: failureMessage,
          migrationName: activeMigrationName,
        },
      });
      console.error("Recorded migration run metadata: status=failed");
    } catch (recordError) {
      console.error(
        `Failed to record migration failure metadata: ${safeMigrationFailureMessage(recordError)}`,
      );
    }
  }

  process.exit(1);
}
