import { createHash } from "node:crypto";

export type AppliedMigrationRow = {
  name: string;
  checksum: string | null;
};

export type AppliedMigrationMetadata =
  | {
      ok: true;
      migrationCount: number;
      latestMigrationName: string;
      schemaHash: string;
    }
  | {
      ok: false;
    };

export function appliedMigrationMetadata(
  rows: AppliedMigrationRow[],
): AppliedMigrationMetadata {
  if (rows.some((row) => !row.checksum)) {
    return { ok: false };
  }

  if (rows.length === 0) {
    return {
      ok: true,
      migrationCount: 0,
      latestMigrationName: "none",
      schemaHash: "none",
    };
  }

  const hash = createHash("sha256");

  for (const row of rows) {
    hash.update(row.name);
    hash.update("\0");
    hash.update(row.checksum ?? "");
    hash.update("\0");
  }

  return {
    ok: true,
    migrationCount: rows.length,
    latestMigrationName: rows.at(-1)?.name ?? "none",
    schemaHash: hash.digest("hex").slice(0, 12),
  };
}
