import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

export function readMigrationFiles(appRoot = process.cwd()) {
  const migrationsDir = path.join(appRoot, "database", "migrations");

  if (!existsSync(migrationsDir)) {
    return [];
  }

  return readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort()
    .map((name) => {
      const filePath = path.join(migrationsDir, name);
      const content = readFileSync(filePath, "utf8");

      return {
        name,
        checksum: sha256(content),
        filePath,
      };
    });
}

export function resolveExpectedDatabaseMetadata(appRoot = process.cwd()) {
  const migrations = readMigrationFiles(appRoot);

  return {
    migrationCount: migrations.length,
    latestMigrationName: migrations.at(-1)?.name ?? "none",
    schemaHash: schemaHashForMigrations(migrations),
    migrations: migrations.map(({ name, checksum }) => ({ name, checksum })),
  };
}

export function schemaHashForMigrations(migrations) {
  if (migrations.length === 0) {
    return "none";
  }

  const hash = createHash("sha256");

  for (const migration of migrations) {
    hash.update(migration.name);
    hash.update("\0");
    hash.update(migration.checksum);
    hash.update("\0");
  }

  return hash.digest("hex").slice(0, 12);
}

export function validateAppliedMigrationHistory(appliedRows, expectedMigrations) {
  const checksumBackfills = [];

  for (const [index, applied] of appliedRows.entries()) {
    const expected = expectedMigrations[index];

    if (!expected) {
      return {
        ok: false,
        message: `Database schema is ahead of this app. Applied migration ${applied.name} is not present in this source tree.`,
      };
    }

    if (applied.name !== expected.name) {
      return {
        ok: false,
        message: `Database migration history differs. Expected ${expected.name} at position ${index + 1}, but found ${applied.name}.`,
      };
    }

    if (!applied.checksum) {
      checksumBackfills.push({
        name: applied.name,
        checksum: expected.checksum,
      });
      continue;
    }

    if (applied.checksum !== expected.checksum) {
      return {
        ok: false,
        message: `Migration drift detected for ${applied.name}. The applied checksum does not match the local migration file.`,
      };
    }
  }

  return {
    ok: true,
    checksumBackfills,
  };
}

function sha256(content) {
  return createHash("sha256").update(content).digest("hex");
}
