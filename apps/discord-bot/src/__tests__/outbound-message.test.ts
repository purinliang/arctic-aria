import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type {
  DiscordDirectMessageInput,
  DiscordMessageSender,
} from "../infrastructure/discord-api.ts";
import { handleOutboundDiscordMessage } from "../features/outbound-messages/outbound-message.ts";
import type { QueryExecutor } from "../infrastructure/query-executor.ts";

const now = new Date("2026-07-17T10:30:00.000Z");
const validUserId = "123e4567-e89b-12d3-a456-426614174000";

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

class FakeSender implements DiscordMessageSender {
  readonly messages: DiscordDirectMessageInput[] = [];
  private readonly error?: Error & { code?: string };

  constructor(error?: Error & { code?: string }) {
    this.error = error;
  }

  async sendDirectMessage(input: DiscordDirectMessageInput) {
    this.messages.push(input);

    if (this.error) {
      throw this.error;
    }

    return {
      discordMessageId: "5555555555",
      dmChannelId: input.dmChannelId ?? "9999999999",
    };
  }
}

describe("handleOutboundDiscordMessage", () => {
  it("validates outbound message input before database access", async () => {
    const sql = new FakeSql([]);

    const result = await handleOutboundDiscordMessage(
      sql,
      {
        userId: "not-a-uuid",
        idempotencyKey: "message-1",
        text: "Hello",
        source: "web",
      },
      new FakeSender(),
      now,
    );

    assert.equal(result.status, 400);
    assert.equal(sql.queries.length, 0);
  });

  it("returns not found when the Arctic Aria user has no Discord binding", async () => {
    const result = await handleOutboundDiscordMessage(
      new FakeSql([[]]),
      validInput(),
      new FakeSender(),
      now,
    );

    assert.deepEqual(result.body, { error: "No active Discord binding." });
    assert.equal(result.status, 404);
  });

  it("records and sends a new outbound Discord message", async () => {
    const sql = new FakeSql([
      [bindingRow()],
      [deliveryRow({ delivery_status: "pending" })],
      [
        deliveryRow({
          delivery_status: "sent",
          discord_message_id: "5555555555",
        }),
      ],
    ]);
    const sender = new FakeSender();

    const result = await handleOutboundDiscordMessage(
      sql,
      validInput(),
      sender,
      now,
    );

    assert.equal(result.status, 200);
    assert.deepEqual(sender.messages, [
      {
        discordUserId: "123456789",
        dmChannelId: null,
        text: "Review the routine plan.",
      },
    ]);
    assert.equal(result.body.status, "sent");
    assert.match(
      sql.queries[1]?.sql ?? "",
      /INSERT INTO discord_message_deliveries/,
    );
    assert.match(sql.queries[2]?.sql ?? "", /delivery_status = 'sent'/);
  });

  it("rejects idempotency key reuse with different content", async () => {
    const result = await handleOutboundDiscordMessage(
      new FakeSql([
        [bindingRow()],
        [],
        [deliveryRow({ content_hash: "a".repeat(64) })],
      ]),
      validInput(),
      new FakeSender(),
      now,
    );

    assert.equal(result.status, 409);
    assert.deepEqual(result.body, {
      error: "Idempotency key reused for different content.",
    });
  });

  it("records a failed delivery when Discord sending fails", async () => {
    const error = new Error("Discord unavailable") as Error & { code: string };
    error.code = "discord_http_502";
    const result = await handleOutboundDiscordMessage(
      new FakeSql([
        [bindingRow()],
        [deliveryRow({ delivery_status: "pending" })],
        [deliveryRow({ delivery_status: "failed", error_code: error.code })],
      ]),
      validInput(),
      new FakeSender(error),
      now,
    );

    assert.equal(result.status, 502);
    assert.equal(result.body.status, "failed");
    assert.equal(result.body.errorCode, "discord_http_502");
  });
});

function validInput() {
  return {
    userId: validUserId,
    idempotencyKey: "routine-reminder-1",
    text: "Review the routine plan.",
    source: "web",
    metadata: {
      feature: "routine",
    },
  };
}

function bindingRow() {
  return {
    id: "binding-1",
    discord_user_id: "123456789",
    dm_channel_id: null,
  };
}

function deliveryRow(
  overrides: Partial<{
    id: string;
    content_hash: string;
    delivery_status: string;
    discord_message_id: string | null;
    error_code: string | null;
  }> = {},
) {
  return {
    id: "delivery-1",
    content_hash: "b".repeat(64),
    delivery_status: "pending",
    discord_message_id: null,
    error_code: null,
    ...overrides,
  };
}
