import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import {
  applyPendingMigrations,
  splitStatements,
} from "../../../../../database/scripts/migration-runner.mjs";

const appMetadata = {
  version: "v0.11.0-dev",
  commit: "abc123def456",
  sourceState: "clean",
  expectedDatabase: {
    migrationCount: 1,
    latestMigrationName: "0001_create_users.sql",
    schemaHash: "expectedhash",
    migrations: [
      {
        name: "0001_create_users.sql",
        checksum: "checksum-a",
      },
    ],
  },
};

test("migration runner applies SQL and records applied migration metadata", async () => {
  const tempDir = mkdtempSync(path.join(tmpdir(), "arctic-aria-migration-"));
  const filePath = path.join(tempDir, "0001_create_users.sql");
  const sql = new RecordingSql();
  const events: unknown[] = [];

  writeFileSync(
    filePath,
    "CREATE TABLE users (id text PRIMARY KEY); ALTER TABLE users ADD COLUMN username text;",
  );

  try {
    const result = await applyPendingMigrations({
      sql,
      migrations: [
        {
          name: "0001_create_users.sql",
          checksum: "checksum-a",
          filePath,
        },
      ],
      appMetadata,
      appliedRows: [],
      onProgress(event: unknown) {
        events.push(event);
      },
    });

    assert.equal(result.ok, true);
    assert.equal(result.appliedCount, 1);
    assert.equal(result.skippedCount, 0);
    assert.deepEqual(events, [
      { type: "applied", name: "0001_create_users.sql" },
    ]);
    assert.match(sql.records[0]?.text ?? "", /CREATE TABLE users/);
    assert.match(sql.records[1]?.text ?? "", /ALTER TABLE users/);
    assert.match(sql.records[2]?.text ?? "", /INSERT INTO schema_migrations/);
    assert.deepEqual(sql.records[2]?.params, [
      "0001_create_users.sql",
      "checksum-a",
      "v0.11.0-dev",
      "abc123def456",
      "clean",
    ]);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
});

test("migration runner splits simple SQL statements", () => {
  assert.deepEqual(splitStatements(" SELECT 1; ; SELECT 2;"), [
    "SELECT 1",
    "SELECT 2",
  ]);
});

class RecordingSql {
  records: { text: string; params?: unknown[] }[] = [];

  async query(text: string, params?: unknown[]) {
    this.records.push({ text, params });

    return [];
  }
}
