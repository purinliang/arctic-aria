export type AppMetadata = {
  version: string;
  commit: string;
  sourceState: string;
  branch: string;
  expectedDatabase: ExpectedDatabaseMetadata;
};

export type ExpectedDatabaseMetadata = {
  migrationCount: number;
  latestMigrationName: string;
  schemaHash: string;
};

export type DatabaseVersionStatus = {
  appVersionText: string;
  actualDatabaseVersionText: string;
  expectedDatabaseVersionText: string;
  aligned: boolean;
  message: string;
};

export function getAppMetadata(): AppMetadata {
  return {
    version: readMetadata(process.env.NEXT_PUBLIC_APP_VERSION),
    commit: readMetadata(process.env.NEXT_PUBLIC_APP_COMMIT),
    sourceState: readMetadata(process.env.NEXT_PUBLIC_APP_SOURCE_STATE),
    branch: readMetadata(process.env.NEXT_PUBLIC_APP_BRANCH),
    expectedDatabase: {
      migrationCount: readNumber(
        process.env.NEXT_PUBLIC_EXPECTED_DATABASE_MIGRATION_COUNT,
      ),
      latestMigrationName: readMetadata(
        process.env.NEXT_PUBLIC_EXPECTED_DATABASE_LATEST_MIGRATION,
      ),
      schemaHash: readMetadata(
        process.env.NEXT_PUBLIC_EXPECTED_DATABASE_SCHEMA_HASH,
      ),
    },
  };
}

export function appMetadataLabel(metadata: AppMetadata) {
  return `App Version: ${appMetadataVersionText(metadata)}`;
}

export function appMetadataVersionText(metadata: AppMetadata) {
  if (
    metadata.commit === "unknown" ||
    isExactReleaseVersionText(metadata.version)
  ) {
    return metadata.version;
  }

  return `${metadata.version}-${metadata.commit}`;
}

export function shouldShowDatabaseVersion(status: DatabaseVersionStatus) {
  return !status.aligned || !isExactReleaseVersionText(status.appVersionText);
}

export function shouldShowExpectedDatabaseVersion(
  status: DatabaseVersionStatus,
) {
  return !isExactReleaseVersionText(status.appVersionText);
}

export function defaultDatabaseVersionStatus(
  metadata = getAppMetadata(),
): DatabaseVersionStatus {
  const versionText = appMetadataVersionText(metadata);

  return {
    appVersionText: versionText,
    actualDatabaseVersionText: "Checking...",
    expectedDatabaseVersionText: metadata.expectedDatabase.schemaHash,
    aligned: true,
    message: "",
  };
}

function readMetadata(rawValue: string | undefined) {
  const value = rawValue?.trim();
  return value && value.length > 0 ? value : "unknown";
}

function readNumber(rawValue: string | undefined) {
  const value = Number.parseInt(rawValue ?? "", 10);

  return Number.isFinite(value) ? value : 0;
}

function isExactReleaseVersionText(version: string) {
  return /^v\d+\.\d+\.\d+$/.test(version);
}
