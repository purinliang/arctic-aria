import assert from "node:assert/strict";
import test from "node:test";
import {
  appliedRowsMetadata,
  finishMigrationRun,
  safeMigrationFailureMessage,
  startMigrationRun,
} from "../../../../../database/scripts/migration-run-audit.mjs";

const appMetadata = {
  version: "v0.9.0-dev",
  commit: "abc123def456",
  sourceState: "clean",
  expectedDatabase: {
    migrationCount: 2,
    latestMigrationName: "0002_create_memories.sql",
    schemaHash: "expectedhash",
  },
};

test("migration run audit starts a running row", async () => {
  const sql = new RecordingSql([{ id: 42 }]);
  const runId = await startMigrationRun(sql, appMetadata);

  assert.equal(runId, 42);
  assert.match(sql.records[0]?.text ?? "", /INSERT INTO schema_migration_runs/);
  assert.match(sql.records[0]?.text ?? "", /'running'/);
  assert.deepEqual(sql.records[0]?.params, [
    "v0.9.0-dev",
    "abc123def456",
    "clean",
    2,
    "0002_create_memories.sql",
    "expectedhash",
  ]);
});

test("migration run audit records failed run details", async () => {
  const sql = new RecordingSql();

  await finishMigrationRun(sql, {
    runId: 42,
    status: "failed",
    appMetadata,
    actualMetadata: {
      migrationCount: 1,
      latestMigrationName: "0001_create_users.sql",
      schemaHash: "actualhash",
    },
    appliedCount: 0,
    skippedCount: 1,
    failure: {
      stage: "apply_migration",
      message: "relation already exists",
      migrationName: "0002_create_memories.sql",
    },
  });

  assert.match(sql.records[0]?.text ?? "", /UPDATE schema_migration_runs/);
  assert.deepEqual(sql.records[0]?.params, [
    42,
    "failed",
    "v0.9.0-dev",
    "abc123def456",
    "clean",
    2,
    "0002_create_memories.sql",
    "expectedhash",
    1,
    "0001_create_users.sql",
    "actualhash",
    0,
    1,
    "apply_migration",
    "relation already exists",
    "0002_create_memories.sql",
  ]);
});

test("migration run audit reports unknown schema hash for legacy rows", () => {
  assert.deepEqual(
    appliedRowsMetadata([
      {
        name: "0001_create_users.sql",
        checksum: null,
      },
    ]),
    {
      migrationCount: 1,
      latestMigrationName: "0001_create_users.sql",
      schemaHash: "unknown",
    },
  );
});

test("migration run audit redacts database urls from failure messages", () => {
  assert.equal(
    safeMigrationFailureMessage(
      new Error(
        "failed for postgresql://testusername:testpassword@example.test/db more",
      ),
    ),
    "failed for [redacted-database-url] more",
  );
});

class RecordingSql {
  records: { text: string; params?: unknown[] }[] = [];
  private readonly response: unknown[];

  constructor(response: unknown[] = []) {
    this.response = response;
  }

  async query(text: string, params?: unknown[]) {
    this.records.push({ text, params });

    return this.response;
  }
}
