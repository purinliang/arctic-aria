import assert from "node:assert/strict";
import test from "node:test";
import { PostgresDiscordAccountRepository } from "../discord-account-repository.ts";

type QueryRecord = {
  text: string;
  params: unknown[];
};

const now = new Date("2026-07-17T10:30:00.000Z");

test("discord account repository looks up active bindings by discord user id", async () => {
  const { records, sql } = createSqlStub([
    row({ user_id: "user-1", discord_user_id: "1234567890" }),
  ]);
  const repository = new PostgresDiscordAccountRepository(sql as never);

  const binding = await repository.findActiveByDiscordUserId("1234567890");

  assert.equal(binding?.userId, "user-1");
  assert.equal(binding?.discordUserId, "1234567890");
  assert.match(records[0]?.text ?? "", /binding_status = 'active'/);
  assert.deepEqual(records[0]?.params, ["1234567890"]);
});

test("discord account repository upserts developer binding by user id", async () => {
  const { records, sql } = createSqlStub([]);
  const repository = new PostgresDiscordAccountRepository(sql as never);

  const binding = await repository.upsertDeveloperBinding({
    userId: "user-1",
    discordUserId: "1234567890",
    discordUsername: "testdiscordusername",
    dmChannelId: "9999999999",
    occurredAt: now,
  });

  assert.equal(binding.userId, "user-1");
  assert.equal(binding.discordUsername, "testdiscordusername");
  assert.match(records[0]?.text ?? "", /ON CONFLICT \(user_id\)/);
  assert.deepEqual(records[0]?.params, [
    "user-1",
    "1234567890",
    "testdiscordusername",
    "9999999999",
    now,
  ]);
});

function createSqlStub(findRows: unknown[]) {
  const records: QueryRecord[] = [];
  const sql = {
    query: async (text: string, params: unknown[] = []) => {
      records.push({ text, params });

      if (text.includes("INSERT INTO discord_accounts")) {
        return [
          row({
            user_id: params[0] as string,
            discord_user_id: params[1] as string,
            discord_username: params[2] as string | null,
            dm_channel_id: params[3] as string | null,
          }),
        ];
      }

      return findRows;
    },
  };

  return { records, sql };
}

function row(
  overrides: Partial<{
    id: string;
    user_id: string;
    discord_user_id: string;
    discord_username: string | null;
    dm_channel_id: string | null;
    binding_status: string;
    last_interaction_at: Date;
    created_at: Date;
    updated_at: Date;
    revoked_at: Date | null;
  }>,
) {
  return {
    id: "binding-1",
    user_id: "user-1",
    discord_user_id: "1234567890",
    discord_username: null,
    dm_channel_id: null,
    binding_status: "active",
    last_interaction_at: now,
    created_at: now,
    updated_at: now,
    revoked_at: null,
    ...overrides,
  };
}
