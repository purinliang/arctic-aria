import {
  appMetadataVersionText,
  defaultDatabaseVersionStatus,
  getAppMetadata,
  type AppMetadata,
  type DatabaseVersionStatus,
} from "@/components/app-metadata";
import { getSql } from "./neon";

type MigrationRunRow = {
  app_version: string;
  app_commit: string;
  checked_at: string;
};

type AppliedMigrationRow = {
  migration_count: string | number;
  latest_migration_name: string | null;
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
    const [applied] = (await getSql().query(
      `SELECT COUNT(*) AS migration_count, MAX(name) AS latest_migration_name
       FROM schema_migrations`,
    )) as AppliedMigrationRow[];

    if (!latestRun || !applied) {
      return mismatchStatus(
        expectedVersionText,
        "Not recorded",
        expectedCommitMessage(metadata),
      );
    }

    const actualVersionText = latestRun.app_commit;
    const schemaMessage = schemaMismatchMessage(metadata, applied);

    if (schemaMessage) {
      return mismatchStatus(expectedVersionText, actualVersionText, schemaMessage);
    }

    if (actualVersionText !== metadata.commit) {
      return mismatchStatus(
        expectedVersionText,
        actualVersionText,
        expectedCommitMessage(metadata),
      );
    }

    return {
      appVersionText: expectedVersionText,
      actualDatabaseVersionText: actualVersionText,
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
  message: string,
): DatabaseVersionStatus {
  return {
    appVersionText: expectedVersionText,
    actualDatabaseVersionText: actualVersionText,
    aligned: false,
    message,
  };
}

function schemaMismatchMessage(
  metadata: AppMetadata,
  applied: AppliedMigrationRow,
) {
  const actualCount = Number(applied.migration_count);
  const expectedCount = metadata.expectedDatabase.migrationCount;

  if (actualCount < expectedCount) {
    return `${expectedCommitMessage(metadata)}; database schema is behind`;
  }

  if (actualCount > expectedCount) {
    return `${expectedCommitMessage(metadata)}; database schema is ahead`;
  }

  if (
    applied.latest_migration_name &&
    applied.latest_migration_name !== metadata.expectedDatabase.latestMigrationName
  ) {
    return `${expectedCommitMessage(metadata)}; database schema differs`;
  }

  return "";
}

function expectedCommitMessage(metadata: AppMetadata) {
  return `expected ${metadata.commit}`;
}
