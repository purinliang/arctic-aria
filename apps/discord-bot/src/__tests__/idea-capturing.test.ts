import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  captureDiscordIdea,
  ideaTextMaxLength,
  validateDiscordIdeaText,
} from "../features/idea-capturing.ts";
import type { QueryExecutor } from "../infrastructure/database.ts";

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

describe("validateDiscordIdeaText", () => {
  it("trims valid idea text", () => {
    assert.deepEqual(validateDiscordIdeaText("  remember this  "), {
      ok: true,
      text: "remember this",
    });
  });

  it("rejects blank idea text", () => {
    assert.deepEqual(validateDiscordIdeaText("   "), {
      ok: false,
      code: "idea_text_required",
      reply: "Please include idea text.",
    });
  });

  it("rejects text over the capture limit", () => {
    const result = validateDiscordIdeaText("x".repeat(ideaTextMaxLength + 1));

    assert.equal(result.ok, false);
    assert.equal(result.code, "idea_text_too_long");
  });
});

describe("captureDiscordIdea", () => {
  it("returns an unbound message when no active binding exists", async () => {
    const sql = new FakeSql([[]]);
    const result = await captureDiscordIdea(sql, {
      discordUserId: "123456789",
      discordUsername: "testdiscordusername",
      dmChannelId: "987654321",
      rawText: "check the visa list",
      occurredAt: new Date("2026-07-17T10:00:00.000Z"),
    });

    assert.equal(result.ok, false);
    assert.equal(result.code, "discord_account_not_bound");
    assert.equal(sql.queries.length, 1);
  });

  it("captures a bound Discord idea and updates interaction metadata", async () => {
    const occurredAt = new Date("2026-07-17T10:00:00.000Z");
    const sql = new FakeSql([
      [{ user_id: "user-1" }],
      [{ id: "idea-1" }],
      [],
    ]);

    const result = await captureDiscordIdea(sql, {
      discordUserId: "123456789",
      discordUsername: "testdiscordusername",
      dmChannelId: "987654321",
      rawText: "  check the visa list  ",
      occurredAt,
    });

    assert.deepEqual(result, {
      ok: true,
      code: "idea_captured",
      ideaId: "idea-1",
      reply: "Idea captured.",
    });
    assert.equal(sql.queries.length, 3);
    assert.deepEqual(sql.queries[1].parameters, [
      "user-1",
      "check the visa list",
      JSON.stringify({
        discordUserId: "123456789",
        discordUsername: "testdiscordusername",
        dmChannelId: "987654321",
      }),
      occurredAt,
    ]);
  });
});
