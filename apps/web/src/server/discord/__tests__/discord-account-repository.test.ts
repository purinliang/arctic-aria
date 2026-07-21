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

test("discord account repository looks up active bindings by user id", async () => {
  const { records, sql } = createSqlStub([
    row({ user_id: "user-1", discord_user_id: "1234567890" }),
  ]);
  const repository = new PostgresDiscordAccountRepository(sql as never);

  const binding = await repository.findActiveByUserId("user-1");

  assert.equal(binding?.userId, "user-1");
  assert.equal(binding?.discordUserId, "1234567890");
  assert.match(records[0]?.text ?? "", /WHERE user_id = \$1/);
  assert.match(records[0]?.text ?? "", /binding_status = 'active'/);
  assert.deepEqual(records[0]?.params, ["user-1"]);
});

test("discord account repository lists active daily review targets", async () => {
  const { records, sql } = createSqlStub([
    {
      user_id: "user-1",
      timezone_preference: "Australia/Sydney",
      resolved_timezone: "Asia/Shanghai",
    },
    {
      user_id: "user-2",
      timezone_preference: "system",
      resolved_timezone: "Australia/Melbourne",
    },
    {
      user_id: "user-3",
      timezone_preference: null,
      resolved_timezone: null,
    },
  ]);
  const repository = new PostgresDiscordAccountRepository(sql as never);

  const targets = await repository.listActiveDailyReviewTargets();

  assert.deepEqual(targets, [
    { userId: "user-1", timeZone: "Australia/Sydney" },
    { userId: "user-2", timeZone: "Australia/Melbourne" },
    { userId: "user-3", timeZone: null },
  ]);
  assert.match(records[0]?.text ?? "", /FROM discord_accounts/);
  assert.match(records[0]?.text ?? "", /LEFT JOIN user_settings/);
  assert.match(records[0]?.text ?? "", /binding_status = 'active'/);
  assert.deepEqual(records[0]?.params, []);
});

test("discord account repository creates a one-time binding code", async () => {
  const { records, sql } = createSqlStub([]);
  const repository = new PostgresDiscordAccountRepository(sql as never);

  await repository.createBindingCode({
    userId: "user-1",
    codeHash: "a".repeat(64),
    expiresAt: new Date("2026-07-17T10:40:00.000Z"),
    createdAt: now,
  });

  assert.match(records[0]?.text ?? "", /UPDATE discord_binding_codes/);
  assert.match(records[0]?.text ?? "", /INSERT INTO discord_binding_codes/);
  assert.deepEqual(records[0]?.params, [
    "user-1",
    "a".repeat(64),
    new Date("2026-07-17T10:40:00.000Z"),
    now,
  ]);
});

test("discord account repository redeems a binding code", async () => {
  const { records, sql } = createSqlStub([
    row({ user_id: "user-1", discord_user_id: "1234567890" }),
  ]);
  const repository = new PostgresDiscordAccountRepository(sql as never);

  const binding = await repository.redeemBindingCode({
    codeHash: "a".repeat(64),
    discordUserId: "1234567890",
    discordUsername: "testdisplayname",
    dmChannelId: "channel-1",
    occurredAt: now,
  });

  assert.equal(binding?.userId, "user-1");
  assert.match(records[0]?.text ?? "", /UPDATE discord_binding_codes/);
  assert.match(records[0]?.text ?? "", /INSERT INTO discord_accounts/);
  assert.deepEqual(records[0]?.params, [
    "a".repeat(64),
    "1234567890",
    "testdisplayname",
    "channel-1",
    now,
  ]);
});

test("discord account repository cancels active binding codes by user id", async () => {
  const { records, sql } = createSqlStub([]);
  const repository = new PostgresDiscordAccountRepository(sql as never);

  await repository.cancelBindingCodesByUserId("user-1", now);

  assert.match(records[0]?.text ?? "", /UPDATE discord_binding_codes/);
  assert.match(records[0]?.text ?? "", /consumed_at IS NULL/);
  assert.deepEqual(records[0]?.params, ["user-1", now]);
});

test("discord account repository records interaction metadata", async () => {
  const { records, sql } = createSqlStub([]);
  const repository = new PostgresDiscordAccountRepository(sql as never);

  await repository.recordInteraction({
    discordUserId: "1234567890",
    discordUsername: "testdisplayname",
    dmChannelId: "channel-1",
    occurredAt: now,
  });

  assert.match(records[0]?.text ?? "", /UPDATE discord_accounts/);
  assert.match(records[0]?.text ?? "", /last_interaction_at/);
  assert.deepEqual(records[0]?.params, [
    "1234567890",
    now,
    "testdisplayname",
    "channel-1",
  ]);
});

test("discord account repository revokes active bindings by user id", async () => {
  const { records, sql } = createSqlStub([]);
  const repository = new PostgresDiscordAccountRepository(sql as never);

  const binding = await repository.revokeActiveByUserId("user-1", now);

  assert.equal(binding?.bindingStatus, "revoked");
  assert.match(records[0]?.text ?? "", /UPDATE discord_accounts/);
  assert.match(records[0]?.text ?? "", /binding_status = 'active'/);
  assert.deepEqual(records[0]?.params, ["user-1", now]);
});

function createSqlStub(findRows: unknown[]) {
  const records: QueryRecord[] = [];
  const sql = {
    query: async (text: string, params: unknown[] = []) => {
      records.push({ text, params });

      if (text.includes("INSERT INTO discord_accounts")) {
        return [
          row({
            user_id: text.includes("discord_binding_codes")
              ? "user-1"
              : (params[0] as string),
            discord_user_id: params[1] as string,
            discord_username: params[2] as string | null,
            dm_channel_id: params[3] as string | null,
          }),
        ];
      }

      if (text.includes("UPDATE discord_accounts")) {
        return [
          row({
            user_id: params[0] as string,
            binding_status: "revoked",
            revoked_at: params[1] as Date,
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
