import { readFile } from "node:fs/promises";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { neon } from "@neondatabase/serverless";

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

await sql.query(`
  CREATE TABLE IF NOT EXISTS schema_migrations (
    name text PRIMARY KEY,
    applied_at timestamptz NOT NULL DEFAULT now()
  )
`);

const migrations = readdirSync(migrationsDir)
  .filter((file) => file.endsWith(".sql"))
  .sort();

for (const migration of migrations) {
  const existing = await sql.query(
    "SELECT name FROM schema_migrations WHERE name = $1",
    [migration],
  );

  if (existing.length > 0) {
    console.log(`Skipping ${migration}`);
    continue;
  }

  const sqlText = await readFile(path.join(migrationsDir, migration), "utf8");

  for (const statement of splitStatements(sqlText)) {
    await sql.query(statement);
  }

  await sql.query("INSERT INTO schema_migrations (name) VALUES ($1)", [migration]);
  console.log(`Applied ${migration}`);
}
