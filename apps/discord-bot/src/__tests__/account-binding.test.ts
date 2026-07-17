import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { bindDiscordAccount } from "../account-binding.ts";
import { hashDiscordBindingCode } from "../binding-code.ts";
import type { QueryExecutor } from "../query-executor.ts";

const now = new Date("2026-07-17T10:30:00.000Z");

class FakeSql implements QueryExecutor {
  readonly queries: Array<{ sql: string; parameters: unknown[] | undefined }> =
    [];
  private readonly response: unknown[] | Error;

  constructor(response: unknown[] | Error) {
    this.response = response;
  }

  async query(sql: string, parameters?: unknown[]) {
    this.queries.push({ sql, parameters });

    if (this.response instanceof Error) {
      throw this.response;
    }

    return this.response;
  }
}

describe("bindDiscordAccount", () => {
  it("consumes a valid binding code and links the Discord account", async () => {
    const sql = new FakeSql([{ user_id: "user-1" }]);

    const result = await bindDiscordAccount(sql, {
      discordUserId: "123456789",
      discordUsername: "testdiscordusername",
      dmChannelId: "987654321",
      rawCode: "ABCD-EFGH-JKLM",
      occurredAt: now,
    });

    assert.deepEqual(result, {
      ok: true,
      code: "discord_account_bound",
      reply: "Discord connected to Arctic Aria.",
    });
    assert.match(sql.queries[0]?.sql ?? "", /discord_binding_codes/);
    assert.match(sql.queries[0]?.sql ?? "", /INSERT INTO discord_accounts/);
    assert.deepEqual(sql.queries[0]?.parameters, [
      hashDiscordBindingCode("ABCDEFGHJKLM"),
      "123456789",
      "testdiscordusername",
      "987654321",
      now,
    ]);
  });

  it("rejects an invalid or expired binding code", async () => {
    const result = await bindDiscordAccount(new FakeSql([]), {
      discordUserId: "123456789",
      discordUsername: null,
      dmChannelId: null,
      rawCode: "expired",
      occurredAt: now,
    });

    assert.deepEqual(result, {
      ok: false,
      code: "discord_binding_code_invalid",
      reply: "This connection code is invalid or expired.",
    });
  });

  it("returns a clear message when the Discord account is already claimed", async () => {
    const error = new Error("duplicate key");
    (error as Error & { code: string }).code = "23505";

    const result = await bindDiscordAccount(new FakeSql(error), {
      discordUserId: "123456789",
      discordUsername: null,
      dmChannelId: null,
      rawCode: "ABCD-EFGH-JKLM",
      occurredAt: now,
    });

    assert.deepEqual(result, {
      ok: false,
      code: "discord_account_claimed",
      reply:
        "This Discord account is already linked to another Arctic Aria account.",
    });
  });
});
