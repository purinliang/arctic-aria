import assert from "node:assert/strict";
import test from "node:test";
import { createHash } from "node:crypto";
import { appliedMigrationMetadata } from "../migration-history.ts";

test("applied migration metadata hashes the ordered migration history", () => {
  const rows = [
    {
      name: "0001_create_users.sql",
      checksum: "checksum-a",
    },
    {
      name: "0002_create_memories.sql",
      checksum: "checksum-b",
    },
  ];
  const expectedHash = createHash("sha256")
    .update("0001_create_users.sql")
    .update("\0")
    .update("checksum-a")
    .update("\0")
    .update("0002_create_memories.sql")
    .update("\0")
    .update("checksum-b")
    .update("\0")
    .digest("hex")
    .slice(0, 12);

  assert.deepEqual(appliedMigrationMetadata(rows), {
    ok: true,
    migrationCount: 2,
    latestMigrationName: "0002_create_memories.sql",
    schemaHash: expectedHash,
  });
});

test("applied migration metadata rejects rows without checksums", () => {
  assert.deepEqual(
    appliedMigrationMetadata([
      {
        name: "0001_create_users.sql",
        checksum: null,
      },
    ]),
    { ok: false },
  );
});
