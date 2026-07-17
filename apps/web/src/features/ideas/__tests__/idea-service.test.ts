import assert from "node:assert/strict";
import test from "node:test";
import { createIdeaService } from "../server/idea-service.ts";
import { InMemoryIdeaRepository } from "../server/idea-repository.ts";
import { ideaRawTextMaxLength } from "../idea-validation.ts";

const userId = "user-1";
const now = new Date("2026-07-17T10:30:00.000Z");

test("captures trimmed untriaged idea text", async () => {
  const repository = new InMemoryIdeaRepository();
  const service = createIdeaService({
    ideas: repository,
    now: () => now,
  });

  const result = await service.captureIdea({
    userId,
    rawText: "  apply for visa documents  ",
    source: "discord",
    sourceMetadata: { discordUserId: "12345" },
  });

  assert.equal(result.ok, true);

  if (!result.ok) {
    return;
  }

  assert.equal(result.idea.rawText, "apply for visa documents");
  assert.equal(result.idea.source, "discord");
  assert.equal(result.idea.triageStatus, "untriaged");
  assert.deepEqual(result.idea.sourceMetadata, { discordUserId: "12345" });
  assert.deepEqual(await service.listIdeas(userId), [result.idea]);
});

test("rejects blank idea text", async () => {
  const service = createIdeaService({ ideas: new InMemoryIdeaRepository() });

  const result = await service.captureIdea({
    userId,
    rawText: "   ",
    source: "web",
  });

  assert.deepEqual(result, {
    ok: false,
    code: "idea_text_required",
    message: "Idea text can't be empty.",
  });
});

test("rejects overlong idea text", async () => {
  const service = createIdeaService({ ideas: new InMemoryIdeaRepository() });

  const result = await service.captureIdea({
    userId,
    rawText: "x".repeat(ideaRawTextMaxLength + 1),
    source: "web",
  });

  assert.deepEqual(result, {
    ok: false,
    code: "idea_text_too_long",
    message: `Idea text must be ${ideaRawTextMaxLength} characters or fewer.`,
  });
});
