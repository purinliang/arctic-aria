import assert from "node:assert/strict";
import test from "node:test";
import { handleInboundDiscordInteraction } from "../server/interactions.ts";

const now = new Date("2026-07-18T10:00:00.000Z");

test("discord interaction handler replies to Discord ping", async () => {
  const result = await handleInboundDiscordInteraction({ type: 1 });

  assert.deepEqual(result, {
    status: 200,
    body: {
      type: 1,
    },
  });
});

test("discord interaction handler captures ideas for bound accounts", async () => {
  const repositories = createRepositories({
    binding: {
      userId: "user-1",
      discordUserId: "1234567890",
    },
  });

  const result = await handleInboundDiscordInteraction(
    commandPayload("idea", [{ name: "text", value: "Remember this" }]),
    repositories,
  );

  assert.equal(result.status, 200);
  assert.deepEqual(result.body, {
    type: 4,
    data: {
      content: "Idea captured.",
    },
  });
  assert.deepEqual(repositories.ideas.captured[0], {
    userId: "user-1",
    rawText: "Remember this",
    source: "discord",
    sourceMetadata: {
      discordUserId: "1234567890",
      discordUsername: "testdisplayname",
      dmChannelId: "channel-1",
    },
    occurredAt: repositories.ideas.captured[0]?.occurredAt,
  });
  assert.equal(repositories.discordAccounts.interactions.length, 1);
});

test("discord interaction handler rejects ideas before binding", async () => {
  const repositories = createRepositories({ binding: null });

  const result = await handleInboundDiscordInteraction(
    commandPayload("idea", [{ name: "text", value: "Remember this" }]),
    repositories,
  );

  assert.deepEqual(result.body, {
    type: 4,
    data: {
      content:
        "This Discord account is not linked to Arctic Aria yet. Open the web app settings before using /idea.",
    },
  });
  assert.equal(repositories.ideas.captured.length, 0);
});

test("discord interaction handler redeems binding codes", async () => {
  const repositories = createRepositories({ binding: null, redeemSucceeds: true });

  const result = await handleInboundDiscordInteraction(
    commandPayload("bind", [{ name: "code", value: "ABCD-2345-EFGH" }]),
    repositories,
  );

  assert.deepEqual(result.body, {
    type: 4,
    data: {
      content: "Discord connected to Arctic Aria.",
    },
  });
  assert.equal(repositories.discordAccounts.redeemed.length, 1);
  assert.equal(repositories.discordAccounts.redeemed[0]?.discordUserId, "1234567890");
});

function commandPayload(
  name: string,
  options: Array<{ name: string; value: string }>,
) {
  return {
    type: 2,
    data: {
      name,
      options,
    },
    user: {
      id: "1234567890",
      username: "testdisplayname",
    },
    channel_id: "channel-1",
  };
}

function createRepositories({
  binding,
  redeemSucceeds = false,
}: {
  binding: { userId: string; discordUserId: string } | null;
  redeemSucceeds?: boolean;
}) {
  const discordAccounts = {
    interactions: [] as unknown[],
    redeemed: [] as Array<{ discordUserId: string }>,
    async findActiveByDiscordUserId() {
      return binding;
    },
    async recordInteraction(input: unknown) {
      this.interactions.push(input);
    },
    async redeemBindingCode(input: { discordUserId: string }) {
      this.redeemed.push(input);

      return redeemSucceeds
        ? {
            userId: "user-1",
            discordUserId: input.discordUserId,
          }
        : null;
    },
  };
  const ideas = {
    captured: [] as Array<Record<string, unknown>>,
    async capture(input: Record<string, unknown>) {
      this.captured.push(input);

      return {
        id: "idea-1",
        userId: input.userId,
        rawText: input.rawText,
        source: input.source,
        sourceMetadata: input.sourceMetadata,
        createdAt: now,
        updatedAt: now,
        archivedAt: null,
      };
    },
  };

  return { discordAccounts, ideas };
}
