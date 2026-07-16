import { readFile } from "node:fs/promises";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { neon } from "@neondatabase/serverless";
import { resolveAppMetadata } from "./app-metadata.mjs";

const appRoot = process.cwd();
const migrationsDir = path.join(appRoot, "database", "migrations");
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

await sql.query(`
  CREATE TABLE IF NOT EXISTS schema_migrations (
    name text PRIMARY KEY,
    applied_at timestamptz NOT NULL DEFAULT now()
  )
`);

await sql.query(`
  ALTER TABLE schema_migrations
    ADD COLUMN IF NOT EXISTS app_version text,
    ADD COLUMN IF NOT EXISTS app_commit text,
    ADD COLUMN IF NOT EXISTS app_source_state text
`);

await sql.query(`
  CREATE TABLE IF NOT EXISTS schema_migration_runs (
    id bigserial PRIMARY KEY,
    checked_at timestamptz NOT NULL DEFAULT now(),
    app_version text NOT NULL,
    app_commit text NOT NULL,
    app_source_state text NOT NULL,
    applied_count integer NOT NULL DEFAULT 0,
    skipped_count integer NOT NULL DEFAULT 0
  )
`);

await sql.query(`
  ALTER TABLE schema_migration_runs
    ADD COLUMN IF NOT EXISTS expected_migration_count integer,
    ADD COLUMN IF NOT EXISTS expected_latest_migration text,
    ADD COLUMN IF NOT EXISTS expected_schema_hash text
`);

const migrations = readdirSync(migrationsDir)
  .filter((file) => file.endsWith(".sql"))
  .sort();
let appliedCount = 0;
let skippedCount = 0;

for (const migration of migrations) {
  const existing = await sql.query(
    "SELECT name FROM schema_migrations WHERE name = $1",
    [migration],
  );

  if (existing.length > 0) {
    skippedCount += 1;
    console.log(`Skipping ${migration}`);
    continue;
  }

  const sqlText = await readFile(path.join(migrationsDir, migration), "utf8");

  for (const statement of splitStatements(sqlText)) {
    await sql.query(statement);
  }

  await sql.query(
    `INSERT INTO schema_migrations (
       name, app_version, app_commit, app_source_state
     )
     VALUES ($1, $2, $3, $4)`,
    [
      migration,
      appMetadata.version,
      appMetadata.commit,
      appMetadata.sourceState,
    ],
  );
  appliedCount += 1;
  console.log(`Applied ${migration}`);
}

await sql.query(
  `INSERT INTO schema_migration_runs (
     app_version,
     app_commit,
     app_source_state,
     expected_migration_count,
     expected_latest_migration,
     expected_schema_hash,
     applied_count,
     skipped_count
   )
   VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
  [
    appMetadata.version,
    appMetadata.commit,
    appMetadata.sourceState,
    appMetadata.expectedDatabase.migrationCount,
    appMetadata.expectedDatabase.latestMigrationName,
    appMetadata.expectedDatabase.schemaHash,
    appliedCount,
    skippedCount,
  ],
);

console.log(
  `Recorded migration run metadata: applied=${appliedCount}, skipped=${skippedCount}`,
);
