import assert from "node:assert/strict";
import test from "node:test";
import { createDiscordTestMessageService } from "../server/discord-test-message-service.ts";

const userId = "123e4567-e89b-12d3-a456-426614174000";

test("discord test message service posts a manual hello message", async () => {
  const fetcher = createFetchStub({ ok: true, status: 200 });
  const service = createDiscordTestMessageService({
    config: {
      messagePushSecret: "test-secret",
      messagePushUrl: "http://localhost:3001/internal/discord/messages",
    },
    fetcher,
  });

  const result = await service.sendTestMessage(userId);

  assert.deepEqual(result, {
    ok: true,
    code: "settings_discord_test_sent",
  });
  assert.equal(fetcher.calls.length, 1);
  assert.equal(
    String(fetcher.calls[0]?.input),
    "http://localhost:3001/internal/discord/messages",
  );
  assert.equal(
    fetcher.calls[0]?.init.headers.authorization,
    "Bearer test-secret",
  );
  assert.deepEqual(JSON.parse(fetcher.calls[0]?.init.body ?? "{}"), {
    userId,
    idempotencyKey: JSON.parse(fetcher.calls[0]?.init.body ?? "{}")
      .idempotencyKey,
    text: "Hello from Arctic Aria. Discord message push is working.",
    source: "manual",
    metadata: {
      feature: "settings",
      action: "discord-test-message",
    },
  });
  assert.match(
    JSON.parse(fetcher.calls[0]?.init.body ?? "{}").idempotencyKey,
    /^settings-discord-test-/,
  );
});

test("discord test message service reports missing web secret", async () => {
  const fetcher = createFetchStub({ ok: true, status: 200 });
  const service = createDiscordTestMessageService({
    config: {
      messagePushSecret: null,
      messagePushUrl: "http://localhost:3001/internal/discord/messages",
    },
    fetcher,
  });

  const result = await service.sendTestMessage(userId);

  assert.deepEqual(result, {
    ok: false,
    code: "settings_discord_test_config_missing",
    message:
      "Set DISCORD_MESSAGE_PUSH_SECRET in apps/web/.env.local and restart the web server.",
  });
  assert.equal(fetcher.calls.length, 0);
});

test("discord test message service reports missing message push url", async () => {
  const fetcher = createFetchStub({ ok: true, status: 200 });
  const service = createDiscordTestMessageService({
    config: {
      messagePushSecret: "test-secret",
      messagePushUrl: null,
    },
    fetcher,
  });

  const result = await service.sendTestMessage(userId);

  assert.deepEqual(result, {
    ok: false,
    code: "settings_discord_test_config_missing",
    message:
      "Set DISCORD_MESSAGE_PUSH_URL to the Discord bot message endpoint and restart the web server.",
  });
  assert.equal(fetcher.calls.length, 0);
});

test("discord test message service reports missing binding", async () => {
  const service = createDiscordTestMessageService({
    config: {
      messagePushSecret: "test-secret",
      messagePushUrl: "http://localhost:3001/internal/discord/messages",
    },
    fetcher: createFetchStub({ ok: false, status: 404 }),
  });

  const result = await service.sendTestMessage(userId);

  assert.deepEqual(result, {
    ok: false,
    code: "settings_discord_test_no_binding",
    message: "No active Discord binding.",
  });
});

test("discord test message service reports mismatched secret", async () => {
  const service = createDiscordTestMessageService({
    config: {
      messagePushSecret: "test-secret",
      messagePushUrl: "http://localhost:3001/internal/discord/messages",
    },
    fetcher: createFetchStub({ ok: false, status: 401 }),
  });

  const result = await service.sendTestMessage(userId);

  assert.deepEqual(result, {
    ok: false,
    code: "settings_discord_test_secret_rejected",
    message:
      "Discord message-push secret was rejected. Use the same DISCORD_MESSAGE_PUSH_SECRET in web and bot env files, then restart both servers.",
  });
});

test("discord test message service reports unconfigured bot endpoint", async () => {
  const service = createDiscordTestMessageService({
    config: {
      messagePushSecret: "test-secret",
      messagePushUrl: "http://localhost:3001/internal/discord/messages",
    },
    fetcher: createFetchStub({ ok: false, status: 503 }),
  });

  const result = await service.sendTestMessage(userId);

  assert.deepEqual(result, {
    ok: false,
    code: "settings_discord_test_bot_unavailable",
    message:
      "Discord bot message push is not configured. Set DISCORD_BOT_TOKEN and DISCORD_MESSAGE_PUSH_SECRET in apps/discord-bot/.env.local, then restart the bot server.",
  });
});

test("discord test message service reports delivery failure", async () => {
  const service = createDiscordTestMessageService({
    config: {
      messagePushSecret: "test-secret",
      messagePushUrl: "http://localhost:3001/internal/discord/messages",
    },
    fetcher: createFetchStub({ ok: false, status: 502 }),
  });

  const result = await service.sendTestMessage(userId);

  assert.deepEqual(result, {
    ok: false,
    code: "settings_discord_test_delivery_failed",
    message:
      "Discord test message could not be delivered. Check the bot log for the outbound_message_handled status.",
  });
});

test("discord test message service reports unreachable bot endpoint", async () => {
  const service = createDiscordTestMessageService({
    config: {
      messagePushSecret: "test-secret",
      messagePushUrl: "http://localhost:3001/internal/discord/messages",
    },
    fetcher: createFetchStub(new Error("connect failed")),
  });

  const result = await service.sendTestMessage(userId);

  assert.deepEqual(result, {
    ok: false,
    code: "settings_discord_test_unreachable",
    message:
      "Discord bot message endpoint is unreachable. Start apps/discord-bot or check DISCORD_MESSAGE_PUSH_URL.",
  });
});

function createFetchStub(response: { ok: boolean; status: number } | Error) {
  const calls: Array<{
    input: string | URL;
    init: {
      body: string;
      headers: Record<string, string>;
      method: "POST";
    };
  }> = [];
  const fetcher = async (
    input: string | URL,
    init: {
      body: string;
      headers: Record<string, string>;
      method: "POST";
    },
  ) => {
    calls.push({ input, init });

    if (response instanceof Error) {
      throw response;
    }

    return response;
  };

  return Object.assign(fetcher, { calls });
}
