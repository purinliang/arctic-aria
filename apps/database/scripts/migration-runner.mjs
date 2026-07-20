import { readFile } from "node:fs/promises";
import {
  appliedRowsMetadata,
  backfillMigrationChecksum,
  ensureMigrationAuditTables,
  finishMigrationRun,
  readAppliedMigrationRows,
  recordAppliedMigration,
  safeMigrationFailureMessage,
  startMigrationRun,
} from "./migration-run-audit.mjs";
import { validateAppliedMigrationHistory } from "./migration-metadata.mjs";

export async function runDatabaseMigrations(input) {
  const { sql, migrations, appMetadata, onProgress } = input;
  let migrationRunId;
  let failureStage = "startup";
  let activeMigrationName = null;
  let appliedRows = [];
  let appliedCount = 0;
  let skippedCount = 0;

  try {
    failureStage = "ensure_metadata_tables";
    await ensureMigrationAuditTables(sql);

    failureStage = "start_run";
    migrationRunId = await startMigrationRun(sql, appMetadata);

    failureStage = "read_applied_history";
    appliedRows = await readAppliedMigrationRows(sql);

    const migrationResult = await applyPendingMigrations({
      sql,
      migrations,
      appMetadata,
      appliedRows,
      onProgress,
    });

    appliedRows = migrationResult.appliedRows;
    appliedCount = migrationResult.appliedCount;
    skippedCount = migrationResult.skippedCount;

    if (!migrationResult.ok) {
      failureStage = migrationResult.stage;
      activeMigrationName = migrationResult.migrationName;
      throw new Error(migrationResult.message);
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

    return {
      ok: true,
      appliedCount,
      skippedCount,
      appliedRows,
    };
  } catch (error) {
    const failureMessage = safeMigrationFailureMessage(error);
    let failureRecordMessage = null;

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
      } catch (recordError) {
        failureRecordMessage = safeMigrationFailureMessage(recordError);
      }
    }

    return {
      ok: false,
      appliedCount,
      skippedCount,
      appliedRows,
      failure: {
        stage: failureStage,
        migrationName: activeMigrationName,
        message: failureMessage,
        recordMessage: failureRecordMessage,
        recorded: Boolean(migrationRunId) && failureRecordMessage === null,
      },
    };
  }
}

export async function applyPendingMigrations(input) {
  const { sql, migrations, appMetadata, appliedRows, onProgress } = input;
  const historyCheck = validateAppliedMigrationHistory(
    appliedRows,
    appMetadata.expectedDatabase.migrations,
  );

  if (!historyCheck.ok) {
    return {
      ok: false,
      stage: "validate_history",
      message: historyCheck.message,
      migrationName: null,
      appliedRows,
      appliedCount: 0,
      skippedCount: 0,
    };
  }

  for (const backfill of historyCheck.checksumBackfills) {
    await backfillMigrationChecksum(sql, backfill);
    const row = appliedRows.find((applied) => applied.name === backfill.name);

    if (row) {
      row.checksum = backfill.checksum;
    }

    onProgress?.({ type: "checksum_backfilled", name: backfill.name });
  }

  const appliedNames = new Set(appliedRows.map((row) => row.name));
  let appliedCount = 0;
  let skippedCount = 0;

  for (const migration of migrations) {
    if (appliedNames.has(migration.name)) {
      skippedCount += 1;
      onProgress?.({ type: "skipped", name: migration.name });
      continue;
    }

    const migrationResult = await applyMigration(sql, migration, appMetadata);

    if (!migrationResult.ok) {
      return {
        ok: false,
        stage: migrationResult.stage,
        message: migrationResult.message,
        migrationName: migration.name,
        appliedRows,
        appliedCount,
        skippedCount,
      };
    }

    appliedRows.push({
      name: migration.name,
      checksum: migration.checksum,
    });
    appliedNames.add(migration.name);
    appliedCount += 1;
    onProgress?.({ type: "applied", name: migration.name });
  }

  return {
    ok: true,
    appliedRows,
    appliedCount,
    skippedCount,
  };
}

export function splitStatements(sqlText) {
  return sqlText
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);
}

async function applyMigration(sql, migration, appMetadata) {
  let sqlText;

  try {
    sqlText = await readFile(migration.filePath, "utf8");
  } catch (error) {
    return {
      ok: false,
      stage: "read_migration_file",
      message: error instanceof Error ? error.message : String(error),
    };
  }

  try {
    for (const statement of splitStatements(sqlText)) {
      await sql.query(statement);
    }
  } catch (error) {
    return {
      ok: false,
      stage: "apply_migration",
      message: error instanceof Error ? error.message : String(error),
    };
  }

  try {
    await recordAppliedMigration(sql, { migration, appMetadata });
  } catch (error) {
    return {
      ok: false,
      stage: "record_migration",
      message: error instanceof Error ? error.message : String(error),
    };
  }

  return { ok: true };
}
