import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  browserInteractionHelpResponse,
  createInProgressInteractionResponse,
  handleInboundInteractionFollowup,
  shouldRaceInboundInteraction,
} from "../infrastructure/interaction-endpoint.ts";
import type { DiscordInteractionResponseEditor } from "../infrastructure/api.ts";
import type { QueryExecutor } from "../infrastructure/database.ts";

describe("interaction endpoint helpers", () => {
  it("explains that browser GET requests are not Discord interactions", () => {
    assert.deepEqual(browserInteractionHelpResponse(), {
      error:
        "Discord interactions use POST requests. Set the public Discord endpoint URL to this path, but do not open it directly in a browser.",
      expectedMethod: "POST",
    });
  });

  it("races idea and bind interactions before sending progress", () => {
    const payload = {
      type: 2,
      token: "interaction-token",
      context: 1,
      data: {
        name: "bind",
      },
    };

    assert.equal(shouldRaceInboundInteraction(payload), true);
    assert.equal(
      shouldRaceInboundInteraction({
        ...payload,
        data: {
          name: "idea",
        },
      }),
      true,
    );
    assert.equal(
      shouldRaceInboundInteraction({
        ...payload,
        data: {
          name: "unknown",
        },
      }),
      false,
    );
    assert.deepEqual(createInProgressInteractionResponse(payload), {
      type: 4,
      data: {
        content: "Arctic Aria received this command. Finishing database work...",
      },
    });
  });

  it("keeps slow guild interaction progress messages ephemeral", () => {
    assert.deepEqual(
      createInProgressInteractionResponse({
        type: 2,
        token: "interaction-token",
        context: 0,
        data: {
          name: "bind",
        },
      }),
      {
        type: 4,
        data: {
          content: "Arctic Aria received this command. Finishing database work...",
          flags: 64,
        },
      },
    );
  });

  it("edits the slow bind response after the database binding finishes", async () => {
    const sql = new FakeSql([[{ user_id: "user-1" }]]);
    const editor = new FakeInteractionResponseEditor();

    await handleInboundInteractionFollowup(
      handleInboundBind(sql),
      {
        type: 2,
        token: "interaction-token",
        context: 1,
        data: {
          name: "bind",
          options: [{ name: "code", value: "ABCD-EFGH-JKLM" }],
        },
        user: {
          id: "123456789",
          username: "testdiscordusername",
        },
        channel_id: "channel-1",
      },
      {
        discordAppId: "app-1",
        interactionResponseEditor: editor,
      },
    );

    assert.equal(sql.queries.length, 1);
    assert.deepEqual(editor.edits, [
      {
        applicationId: "app-1",
        interactionToken: "interaction-token",
        content: "Discord connected to Arctic Aria.",
      },
    ]);
  });
});

function handleInboundBind(sql: QueryExecutor) {
  return import("../interactions/interaction-handler.ts").then(
    ({ handleInboundDiscordInteraction }) =>
      handleInboundDiscordInteraction(sql, {
        type: 2,
        token: "interaction-token",
        context: 1,
        data: {
          name: "bind",
          options: [{ name: "code", value: "ABCD-EFGH-JKLM" }],
        },
        user: {
          id: "123456789",
          username: "testdiscordusername",
        },
        channel_id: "channel-1",
      }),
  );
}

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

class FakeInteractionResponseEditor
  implements DiscordInteractionResponseEditor
{
  readonly edits: Array<{
    applicationId: string;
    interactionToken: string;
    content: string;
  }> = [];

  async editOriginalInteractionResponse(
    input: Parameters<
      DiscordInteractionResponseEditor["editOriginalInteractionResponse"]
    >[0],
  ) {
    this.edits.push(input);
  }
}
