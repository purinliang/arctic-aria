import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import {
  readMigrationFiles,
  resolveMigrationsDir,
  schemaHashForMigrations,
  validateAppliedMigrationHistory,
} from "../../../../scripts/migration-metadata.mjs";

const expectedMigrations = [
  {
    name: "0001_create_users.sql",
    checksum: "checksum-a",
  },
  {
    name: "0002_create_memories.sql",
    checksum: "checksum-b",
  },
];

test("migration validation accepts an applied prefix", () => {
  assert.deepEqual(
    validateAppliedMigrationHistory([expectedMigrations[0]], expectedMigrations),
    {
      ok: true,
      checksumBackfills: [],
    },
  );
});

test("migration validation backfills legacy rows without checksums", () => {
  assert.deepEqual(
    validateAppliedMigrationHistory(
      [
        {
          name: "0001_create_users.sql",
          checksum: null,
        },
      ],
      expectedMigrations,
    ),
    {
      ok: true,
      checksumBackfills: [expectedMigrations[0]],
    },
  );
});

test("migration validation rejects a database ahead of local files", () => {
  const result = validateAppliedMigrationHistory(
    [
      ...expectedMigrations,
      {
        name: "0003_unknown.sql",
        checksum: "checksum-c",
      },
    ],
    expectedMigrations,
  );

  assert.equal(result.ok, false);
  assert.match(result.message, /ahead of this app/);
});

test("migration validation rejects changed migration file content", () => {
  const result = validateAppliedMigrationHistory(
    [
      {
        name: "0001_create_users.sql",
        checksum: "changed",
      },
    ],
    expectedMigrations,
  );

  assert.equal(result.ok, false);
  assert.match(result.message, /Migration drift detected/);
});

test("schema hash represents the ordered whole migration history", () => {
  const originalHash = schemaHashForMigrations(expectedMigrations);
  const reorderedHash = schemaHashForMigrations([
    expectedMigrations[1],
    expectedMigrations[0],
  ]);
  const changedHash = schemaHashForMigrations([
    expectedMigrations[0],
    {
      name: "0002_create_memories.sql",
      checksum: "changed",
    },
  ]);

  assert.notEqual(originalHash, reorderedHash);
  assert.notEqual(originalHash, changedHash);
});

test("migration directory resolves to shared infrastructure from web app root", () => {
  const repoRoot = mkdtempSync(path.join(tmpdir(), "arctic-aria-"));
  const webRoot = path.join(repoRoot, "apps", "web");
  const migrationsDir = path.join(
    repoRoot,
    "apps",
    "infrastructure",
    "database",
    "migrations",
  );

  mkdirSync(webRoot, { recursive: true });
  mkdirSync(migrationsDir, { recursive: true });

  try {
    assert.equal(resolveMigrationsDir(webRoot), migrationsDir);
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test("migration reader rejects a missing migration directory", () => {
  const repoRoot = mkdtempSync(path.join(tmpdir(), "arctic-aria-"));
  const webRoot = path.join(repoRoot, "apps", "web");

  mkdirSync(webRoot, { recursive: true });

  try {
    assert.throws(
      () => readMigrationFiles(webRoot),
      /Migration directory not found/,
    );
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test("migration reader rejects an empty migration directory", () => {
  const repoRoot = mkdtempSync(path.join(tmpdir(), "arctic-aria-"));
  const webRoot = path.join(repoRoot, "apps", "web");
  const migrationsDir = path.join(
    repoRoot,
    "apps",
    "infrastructure",
    "database",
    "migrations",
  );

  mkdirSync(webRoot, { recursive: true });
  mkdirSync(migrationsDir, { recursive: true });

  try {
    assert.throws(
      () => readMigrationFiles(webRoot),
      /Migration directory has no SQL files/,
    );
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});
