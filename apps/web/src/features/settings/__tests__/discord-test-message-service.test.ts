import assert from "node:assert/strict";
import test from "node:test";
import { createDiscordTestMessageService } from "../server/discord-test-message-service.ts";

const userId = "123e4567-e89b-12d3-a456-426614174000";

test("discord test message service sends a manual hello message directly", async () => {
  const sender = createSenderStub({ status: 200 });
  const service = createDiscordTestMessageService({
    config: {
      discordBotToken: "test-bot-token",
      missingEnvVars: [],
    },
    sender,
  });

  const result = await service.sendTestMessage(userId);

  assert.deepEqual(result, {
    ok: true,
    code: "settings_discord_test_sent",
  });
  assert.equal(sender.calls.length, 1);
  assert.deepEqual(sender.calls[0], {
    userId,
    idempotencyKey: sender.calls[0]?.idempotencyKey,
    text: "Hello from Arctic Aria. Discord message push is working.",
    source: "manual",
    metadata: {
      feature: "settings",
      action: "discord-test-message",
    },
  });
  assert.match(
    String(sender.calls[0]?.idempotencyKey),
    /^settings-discord-test-/,
  );
});

test("discord test message service reports missing bot token", async () => {
  const sender = createSenderStub({ status: 200 });
  const service = createDiscordTestMessageService({
    config: {
      discordBotToken: null,
      missingEnvVars: ["DISCORD_BOT_TOKEN"],
    },
    sender,
  });

  const result = await service.sendTestMessage(userId);

  assert.deepEqual(result, {
    ok: false,
    code: "settings_discord_test_config_missing",
    message: "Server internal error.",
  });
  assert.equal(sender.calls.length, 0);
});

test("discord test message service reports missing binding", async () => {
  const service = createDiscordTestMessageService({
    config: {
      discordBotToken: "test-bot-token",
      missingEnvVars: [],
    },
    sender: createSenderStub({ status: 404 }),
  });

  const result = await service.sendTestMessage(userId);

  assert.deepEqual(result, {
    ok: false,
    code: "settings_discord_test_no_binding",
    message: "No active Discord binding.",
  });
});

test("discord test message service reports unconfigured bot sender", async () => {
  const service = createDiscordTestMessageService({
    config: {
      discordBotToken: "test-bot-token",
      missingEnvVars: [],
    },
    sender: createSenderStub({ status: 503 }),
  });

  const result = await service.sendTestMessage(userId);

  assert.deepEqual(result, {
    ok: false,
    code: "settings_discord_test_bot_unavailable",
    message: "Server internal error.",
  });
});

test("discord test message service reports delivery failure", async () => {
  const service = createDiscordTestMessageService({
    config: {
      discordBotToken: "test-bot-token",
      missingEnvVars: [],
    },
    sender: createSenderStub({ status: 502 }),
  });

  const result = await service.sendTestMessage(userId);

  assert.deepEqual(result, {
    ok: false,
    code: "settings_discord_test_delivery_failed",
    message: "Server internal error.",
  });
});

test("discord test message service reports sender errors as delivery failures", async () => {
  const service = createDiscordTestMessageService({
    config: {
      discordBotToken: "test-bot-token",
      missingEnvVars: [],
    },
    sender: createSenderStub(new Error("send failed")),
  });

  const result = await service.sendTestMessage(userId);

  assert.deepEqual(result, {
    ok: false,
    code: "settings_discord_test_delivery_failed",
    message: "Server internal error.",
  });
});

function createSenderStub(response: { status: number } | Error) {
  const calls: Array<Record<string, unknown>> = [];
  const sender = async (input: unknown) => {
    calls.push(input as Record<string, unknown>);

    if (response instanceof Error) {
      throw response;
    }

    return {
      status: response.status,
      body: {},
      log: {
        deliveryId: "test-delivery",
        status: response.status,
      },
    };
  };

  return Object.assign(sender, { calls });
}
