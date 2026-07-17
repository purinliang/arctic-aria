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

test("discord test message service requires a message push secret", async () => {
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
    code: "settings_discord_test_unavailable",
    message: "Discord message push is unavailable.",
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

test("discord test message service reports endpoint failure", async () => {
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
    code: "settings_discord_test_failed",
    message: "Discord test message could not be sent.",
  });
});

function createFetchStub(response: { ok: boolean; status: number }) {
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

    return response;
  };

  return Object.assign(fetcher, { calls });
}
