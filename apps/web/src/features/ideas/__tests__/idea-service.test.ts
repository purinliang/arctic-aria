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
    category: "missing_parameter",
    subject: "idea",
    field: "text",
    reason: "required",
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
    category: "invalid_parameter",
    subject: "idea",
    field: "text",
    reason: "too_long",
    limit: ideaRawTextMaxLength,
  });
});

test("saves a web idea", async () => {
  const repository = new InMemoryIdeaRepository();
  const service = createIdeaService({
    ideas: repository,
    now: () => now,
  });

  const result = await service.saveWebIdea({
    userId,
    rawText: "  renew passport  ",
  });

  assert.equal(result.ok, true);

  if (!result.ok) {
    return;
  }

  assert.equal(result.idea.rawText, "renew passport");
  assert.equal(result.idea.source, "web");
  assert.equal(result.idea.triageStatus, "untriaged");
  assert.deepEqual(await service.listIdeas(userId), [result.idea]);
});

test("updates an existing idea for the same user", async () => {
  const repository = new InMemoryIdeaRepository();
  const service = createIdeaService({
    ideas: repository,
    now: () => now,
  });
  const created = await service.saveWebIdea({
    userId,
    rawText: "renew passport",
  });

  assert.equal(created.ok, true);

  if (!created.ok) {
    return;
  }

  const result = await service.saveWebIdea({
    userId,
    ideaId: created.idea.id,
    rawText: "  renew passport before visa appointment  ",
  });

  assert.equal(result.ok, true);

  if (!result.ok) {
    return;
  }

  assert.equal(result.idea.id, created.idea.id);
  assert.equal(result.idea.rawText, "renew passport before visa appointment");
});

test("does not update another user's idea", async () => {
  const repository = new InMemoryIdeaRepository();
  const service = createIdeaService({
    ideas: repository,
    now: () => now,
  });
  const created = await service.saveWebIdea({
    userId,
    rawText: "renew passport",
  });

  assert.equal(created.ok, true);

  if (!created.ok) {
    return;
  }

  const result = await service.saveWebIdea({
    userId: "user-2",
    ideaId: created.idea.id,
    rawText: "overwrite",
  });

  assert.deepEqual(result, {
    ok: false,
    code: "idea_not_found",
    message: "Idea was not found.",
    category: "not_found",
    subject: "idea",
  });
  assert.equal((await service.listIdeas(userId))[0]?.rawText, "renew passport");
});

test("archives an idea and hides it from normal lists", async () => {
  const repository = new InMemoryIdeaRepository();
  const service = createIdeaService({
    ideas: repository,
    now: () => now,
  });
  const created = await service.saveWebIdea({
    userId,
    rawText: "renew passport",
  });

  assert.equal(created.ok, true);

  if (!created.ok) {
    return;
  }

  assert.deepEqual(await service.archiveIdea({
    userId,
    ideaId: created.idea.id,
  }), {
    ok: true,
    code: "idea_archived",
  });
  assert.deepEqual(await service.listIdeas(userId), []);
});

test("does not archive another user's idea", async () => {
  const repository = new InMemoryIdeaRepository();
  const service = createIdeaService({
    ideas: repository,
    now: () => now,
  });
  const created = await service.saveWebIdea({
    userId,
    rawText: "renew passport",
  });

  assert.equal(created.ok, true);

  if (!created.ok) {
    return;
  }

  assert.deepEqual(await service.archiveIdea({
    userId: "user-2",
    ideaId: created.idea.id,
  }), {
    ok: false,
    code: "idea_not_found",
    message: "Idea was not found.",
    category: "not_found",
    subject: "idea",
  });
  assert.equal((await service.listIdeas(userId)).length, 1);
});
