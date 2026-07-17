import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  InteractionResponseFlags,
  InteractionResponseType,
  InteractionType,
} from "discord-interactions";
import { handleDiscordInteraction } from "../interaction-handler.ts";
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

describe("handleDiscordInteraction", () => {
  it("responds to Discord ping verification", async () => {
    const result = await handleDiscordInteraction(new FakeSql([]), {
      type: InteractionType.PING,
    });

    assert.deepEqual(result, {
      status: 200,
      body: {
        type: InteractionResponseType.PONG,
      },
    });
  });

  it("captures an idea from an app DM slash command", async () => {
    const sql = new FakeSql([[{ user_id: "user-1" }], [{ id: "idea-1" }], []]);
    const result = await handleDiscordInteraction(sql, {
      type: InteractionType.APPLICATION_COMMAND,
      context: 1,
      data: {
        name: "idea",
        options: [{ name: "text", value: "Review Discord HTTP flow" }],
      },
      user: {
        id: "123456789",
        username: "testdiscordusername",
      },
      channel_id: "channel-1",
    });

    assert.deepEqual(result, {
      status: 200,
      body: {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: "Idea captured.",
        },
      },
    });
    assert.equal(sql.queries.length, 3);
  });

  it("keeps slash command replies ephemeral in guild channels", async () => {
    const sql = new FakeSql([[{ user_id: "user-1" }], [{ id: "idea-1" }], []]);
    const result = await handleDiscordInteraction(sql, {
      type: InteractionType.APPLICATION_COMMAND,
      context: 0,
      data: {
        name: "idea",
        options: [{ name: "text", value: "Review Discord HTTP flow" }],
      },
      member: {
        user: {
          id: "123456789",
          username: "testdiscordusername",
        },
      },
      channel_id: "channel-1",
    });

    assert.deepEqual(result, {
      status: 200,
      body: {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: "Idea captured.",
          flags: InteractionResponseFlags.EPHEMERAL,
        },
      },
    });
    assert.equal(sql.queries.length, 3);
  });

  it("returns an ephemeral reply when the Discord account is not bound", async () => {
    const result = await handleDiscordInteraction(new FakeSql([[]]), {
      type: InteractionType.APPLICATION_COMMAND,
      context: 0,
      data: {
        name: "idea",
        options: [{ name: "text", value: "Unlinked idea" }],
      },
      user: {
        id: "123456789",
        username: "testdiscordusername",
      },
    });

    assert.deepEqual(result, {
      status: 200,
      body: {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content:
            "This Discord account is not linked to Arctic Aria yet. Open the web app settings before using /idea.",
          flags: InteractionResponseFlags.EPHEMERAL,
        },
      },
    });
  });
});
