import assert from "node:assert/strict";
import test from "node:test";
import {
  createDiscordMessageSender,
  DiscordApiError,
} from "../server/discord-api.ts";

test("discord sender retries with a fresh DM channel when a stored channel is stale", async () => {
  const fetchMock = createFetchMock([
    {
      status: 404,
      body: {
        message: "Unknown Channel",
      },
    },
    {
      status: 200,
      body: {
        id: "fresh-dm-channel",
      },
    },
    {
      status: 200,
      body: {
        id: "discord-message-1",
      },
    },
  ]);
  const restoreFetch = replaceFetch(fetchMock);

  try {
    const sender = createDiscordMessageSender("test-bot-token");
    const result = await sender.sendDirectMessage({
      discordUserId: "1234567890",
      dmChannelId: "stale-channel",
      text: "Test message.",
    });

    assert.deepEqual(result, {
      discordMessageId: "discord-message-1",
      dmChannelId: "fresh-dm-channel",
    });
    assert.deepEqual(fetchMock.calls.map((call) => call.path), [
      "/channels/stale-channel/messages",
      "/users/@me/channels",
      "/channels/fresh-dm-channel/messages",
    ]);
    assert.deepEqual(fetchMock.calls.map((call) => call.body), [
      {
        content: "Test message.",
      },
      {
        recipient_id: "1234567890",
      },
      {
        content: "Test message.",
      },
    ]);
  } finally {
    restoreFetch();
  }
});

test("discord sender does not hide bot token failures behind a DM retry", async () => {
  const fetchMock = createFetchMock([
    {
      status: 401,
      body: {
        message: "Unauthorized",
      },
    },
  ]);
  const restoreFetch = replaceFetch(fetchMock);

  try {
    const sender = createDiscordMessageSender("bad-bot-token");

    await assert.rejects(
      () =>
        sender.sendDirectMessage({
          discordUserId: "1234567890",
          dmChannelId: "stored-channel",
          text: "Test message.",
        }),
      (error) =>
        error instanceof DiscordApiError &&
        error.code === "discord_http_401",
    );
    assert.equal(fetchMock.calls.length, 1);
    assert.equal(fetchMock.calls[0]?.path, "/channels/stored-channel/messages");
  } finally {
    restoreFetch();
  }
});

type FetchMockResponse = {
  body: Record<string, unknown>;
  status: number;
};

function createFetchMock(responses: FetchMockResponse[]) {
  const calls: Array<{
    body: Record<string, unknown>;
    path: string;
  }> = [];
  let responseIndex = 0;

  const fetchMock = async (url: string | URL | Request, init?: RequestInit) => {
    const response = responses[responseIndex++];

    if (!response) {
      throw new Error("Unexpected Discord API call.");
    }

    const body = JSON.parse(String(init?.body ?? "{}")) as Record<
      string,
      unknown
    >;
    const requestUrl = new URL(String(url));
    calls.push({
      body,
      path: requestUrl.pathname.replace("/api/v10", ""),
    });

    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      async json() {
        return response.body;
      },
    } as Response;
  };

  return Object.assign(fetchMock, { calls });
}

function replaceFetch(fetchMock: typeof fetch) {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = fetchMock;

  return () => {
    globalThis.fetch = originalFetch;
  };
}
