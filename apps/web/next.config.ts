import type { NextConfig } from "next";
import { resolveAppMetadata } from "./scripts/app-metadata.mjs";

const appMetadata = resolveAppMetadata(process.cwd());

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: appMetadata.version,
    NEXT_PUBLIC_APP_COMMIT: appMetadata.commit,
    NEXT_PUBLIC_APP_SOURCE_STATE: appMetadata.sourceState,
    NEXT_PUBLIC_APP_BRANCH: appMetadata.branch,
    NEXT_PUBLIC_EXPECTED_DATABASE_MIGRATION_COUNT: String(
      appMetadata.expectedDatabase.migrationCount,
    ),
    NEXT_PUBLIC_EXPECTED_DATABASE_LATEST_MIGRATION:
      appMetadata.expectedDatabase.latestMigrationName,
    NEXT_PUBLIC_EXPECTED_DATABASE_SCHEMA_HASH:
      appMetadata.expectedDatabase.schemaHash,
  },
  logging: {
    serverFunctions: false,
  },
};

export default nextConfig;
