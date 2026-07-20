import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { neon } from "@neondatabase/serverless";
import { resolveAppMetadata } from "./app-metadata.mjs";
import { readMigrationFiles } from "../../database/scripts/migration-metadata.mjs";
import { runDatabaseMigrations } from "../../database/scripts/migration-runner.mjs";

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

loadEnvFiles();

const sql = neon(getMigrationDatabaseUrl());
const appMetadata = resolveAppMetadata(appRoot);
const migrations = readMigrationFiles(appRoot);

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

const result = await runDatabaseMigrations({
  sql,
  migrations,
  appMetadata,
  onProgress(event) {
    if (event.type === "checksum_backfilled") {
      console.log(`Recorded checksum for ${event.name}`);
    } else if (event.type === "skipped") {
      console.log(`Skipping ${event.name}`);
    } else if (event.type === "applied") {
      console.log(`Applied ${event.name}`);
    }
  },
});

if (result.ok) {
  console.log(
    `Recorded migration run metadata: status=success, applied=${result.appliedCount}, skipped=${result.skippedCount}`,
  );
} else {
  console.error(
    `Migration failed: stage=${result.failure.stage}, migration=${result.failure.migrationName ?? "none"}, message=${result.failure.message}`,
  );

  if (result.failure.recorded) {
    console.error("Recorded migration run metadata: status=failed");
  } else if (result.failure.recordMessage) {
    console.error(
      `Failed to record migration failure metadata: ${result.failure.recordMessage}`,
    );
  }

  process.exit(1);
}
