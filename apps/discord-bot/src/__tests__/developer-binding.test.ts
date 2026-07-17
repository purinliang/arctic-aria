import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ensureDeveloperDiscordBinding } from "../developer-binding.ts";
import type { QueryExecutor } from "../query-executor.ts";

class FakeSql implements QueryExecutor {
  readonly queries: Array<{ sql: string; parameters: unknown[] | undefined }> =
    [];
  private readonly responses: unknown[][];

  constructor(responses: unknown[][]) {
    this.responses = responses;
  }

  async query(sql: string, parameters?: unknown[]) {
    this.queries.push({ sql, parameters });

    return this.responses.shift() ?? [];
  }
}

describe("ensureDeveloperDiscordBinding", () => {
  it("skips when developer binding env values are missing", async () => {
    const sql = new FakeSql([]);
    const result = await ensureDeveloperDiscordBinding(sql, {
      discordUserId: null,
      developerUsername: null,
      occurredAt: new Date("2026-07-17T10:00:00.000Z"),
    });

    assert.equal(result.ok, false);
    assert.equal(result.code, "developer_binding_not_configured");
    assert.equal(sql.queries.length, 0);
  });

  it("upserts the developer binding when the configured user exists", async () => {
    const occurredAt = new Date("2026-07-17T10:00:00.000Z");
    const sql = new FakeSql([[{ id: "user-1" }], []]);
    const result = await ensureDeveloperDiscordBinding(sql, {
      discordUserId: "123456789",
      developerUsername: "purin",
      occurredAt,
    });

    assert.deepEqual(result, {
      ok: true,
      code: "developer_binding_ready",
      userId: "user-1",
    });
    assert.equal(sql.queries.length, 2);
    assert.deepEqual(sql.queries[1].parameters, [
      "user-1",
      "123456789",
      occurredAt,
    ]);
  });
});
