import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createDeferredInteractionResponse,
  browserInteractionHelpResponse,
  browserOutboundMessageHelpResponse,
  handleDeferredInboundInteraction,
  readBearerToken,
  shouldDeferInboundInteraction,
} from "../discord-http-server.ts";
import type { DiscordInteractionResponseEditor } from "../discord-api.ts";
import type { QueryExecutor } from "../query-executor.ts";

describe("discord HTTP server route helpers", () => {
  it("explains that browser GET requests are not Discord interactions", () => {
    assert.deepEqual(browserInteractionHelpResponse(), {
      error:
        "Discord interactions use POST requests. Set the public Discord endpoint URL to this path, but do not open it directly in a browser.",
      expectedMethod: "POST",
    });
  });

  it("explains that browser GET requests are not outbound message calls", () => {
    assert.deepEqual(browserOutboundMessageHelpResponse(), {
      error:
        "Outbound Discord messages use POST requests with Authorization: Bearer <secret>.",
      expectedMethod: "POST",
    });
  });

  it("reads bearer tokens from authorization headers", () => {
    assert.equal(readBearerToken("Bearer test-secret"), "test-secret");
    assert.equal(readBearerToken("bearer   test-secret  "), "test-secret");
    assert.equal(readBearerToken("Basic test-secret"), null);
    assert.equal(readBearerToken(undefined), null);
  });

  it("defers bind interactions so Discord receives an immediate response", () => {
    const payload = {
      type: 2,
      token: "interaction-token",
      context: 1,
      data: {
        name: "bind",
      },
    };

    assert.equal(shouldDeferInboundInteraction(payload), true);
    assert.deepEqual(createDeferredInteractionResponse(payload), {
      type: 5,
    });
  });

  it("keeps deferred guild bind interactions ephemeral", () => {
    assert.deepEqual(
      createDeferredInteractionResponse({
        type: 2,
        token: "interaction-token",
        context: 0,
        data: {
          name: "bind",
        },
      }),
      {
        type: 5,
        data: {
          flags: 64,
        },
      },
    );
  });

  it("edits the deferred bind response after the database binding finishes", async () => {
    const sql = new FakeSql([[{ user_id: "user-1" }]]);
    const editor = new FakeInteractionResponseEditor();

    await handleDeferredInboundInteraction(
      sql,
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
