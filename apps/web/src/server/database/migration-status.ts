import {
  appMetadataVersionText,
  defaultDatabaseVersionStatus,
  getAppMetadata,
  type AppMetadata,
  type DatabaseVersionStatus,
} from "@/components/app-metadata";
import { appliedMigrationMetadata } from "./migration-history";
import { getSql } from "./neon";
import type {
  AppliedMigrationMetadata,
  AppliedMigrationRow,
} from "./migration-history";

type MigrationRunRow = {
  app_version: string;
  app_commit: string;
  checked_at: string;
};

export async function getDatabaseVersionStatus(
  metadata: AppMetadata = getAppMetadata(),
): Promise<DatabaseVersionStatus> {
  const expectedVersionText = appMetadataVersionText(metadata);

  try {
    const [latestRun] = (await getSql().query(
      `SELECT app_version, app_commit, checked_at
       FROM schema_migration_runs
       ORDER BY checked_at DESC, id DESC
       LIMIT 1`,
    )) as MigrationRunRow[];
    const appliedRows = (await getSql().query(
      `SELECT name, checksum FROM schema_migrations ORDER BY name`,
    )) as AppliedMigrationRow[];

    if (!latestRun || appliedRows.length === 0) {
      return mismatchStatus(
        expectedVersionText,
        "Not recorded",
        metadata.expectedDatabase.schemaHash,
        expectedDatabaseMessage(metadata),
      );
    }

    const actualDatabaseMetadata = appliedMigrationMetadata(appliedRows);

    if (!actualDatabaseMetadata.ok) {
      return mismatchStatus(
        expectedVersionText,
        "Unknown",
        metadata.expectedDatabase.schemaHash,
        "database migration checksums are missing",
      );
    }

    const schemaMessage = schemaMismatchMessage(
      metadata,
      actualDatabaseMetadata,
    );

    if (schemaMessage) {
      return mismatchStatus(
        expectedVersionText,
        actualDatabaseMetadata.schemaHash,
        metadata.expectedDatabase.schemaHash,
        schemaMessage,
      );
    }

    return {
      appVersionText: expectedVersionText,
      actualDatabaseVersionText: actualDatabaseMetadata.schemaHash,
      expectedDatabaseVersionText: metadata.expectedDatabase.schemaHash,
      aligned: true,
      message: "",
    };
  } catch {
    return {
      ...defaultDatabaseVersionStatus(metadata),
      actualDatabaseVersionText: "Unavailable",
      aligned: false,
      message: "Database version unavailable.",
    };
  }
}

function mismatchStatus(
  expectedVersionText: string,
  actualVersionText: string,
  expectedDatabaseVersionText: string,
  message: string,
): DatabaseVersionStatus {
  return {
    appVersionText: expectedVersionText,
    actualDatabaseVersionText: actualVersionText,
    expectedDatabaseVersionText,
    aligned: false,
    message,
  };
}

function schemaMismatchMessage(
  metadata: AppMetadata,
  applied: Extract<AppliedMigrationMetadata, { ok: true }>,
) {
  const actualCount = applied.migrationCount;
  const expectedCount = metadata.expectedDatabase.migrationCount;

  if (actualCount < expectedCount) {
    return `${expectedDatabaseMessage(metadata)}; database schema is behind`;
  }

  if (actualCount > expectedCount) {
    return `${expectedDatabaseMessage(metadata)}; database schema is ahead`;
  }

  if (
    applied.latestMigrationName !== metadata.expectedDatabase.latestMigrationName
  ) {
    return `${expectedDatabaseMessage(metadata)}; database schema differs`;
  }

  if (applied.schemaHash !== metadata.expectedDatabase.schemaHash) {
    return `${expectedDatabaseMessage(metadata)}; database schema differs`;
  }

  return "";
}

function expectedDatabaseMessage(metadata: AppMetadata) {
  return `expected ${metadata.expectedDatabase.schemaHash}`;
}
