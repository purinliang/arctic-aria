import assert from "node:assert/strict";
import test from "node:test";
import { AIProviderRepository } from "../server/ai-provider-repository.ts";

test("AI repository scopes credential reads/writes and preserves keys atomically", async () => {
  const records: { text: string; params: unknown[] }[] = [];
  const repository = new AIProviderRepository({ query: async (text: string, params: unknown[]) => {
    records.push({ text, params });
    return text.includes("RETURNING") ? [{ enabled: true, has_key: true, model: "gemini-3.5-flash-lite" }] : [];
  } } as never);
  assert.equal(await repository.find("owner"), null);
  assert.match(records[0].text, /WHERE user_id = \$1/);
  assert.deepEqual(records[0].params, ["owner"]);
  assert.deepEqual(await repository.save("owner", true, null, false), { enabled: true, hasKey: true, provider: "google_gemini", model: "gemini-3.5-flash-lite" });
  assert.deepEqual(records[1].params, ["owner", true, null, false, null, "gemini-3.5-flash-lite"]);
  assert.match(records[1].text, /COALESCE\(\$3, user_ai_settings.encrypted_api_key\)/);
  assert.match(records[1].text, /CASE WHEN \$4 THEN NULL/);
  assert.match(records[1].text, /model = COALESCE\(\$5, user_ai_settings.model\)/);
  await repository.save("owner", true, null, false, "gemini-3.5-flash-lite");
  assert.equal(records[2].params[4], "gemini-3.5-flash-lite");
  assert.ok(!records[1].text.includes("RETURNING enabled, encrypted_api_key,"));
});

test("AI test cooldown uses one atomic owner-scoped database claim", async () => {
  const records: string[] = [];
  let accepted = true;
  const repository = new AIProviderRepository({ query: async (text: string, params: unknown[]) => {
    records.push(text); assert.deepEqual(params, ["owner"]);
    return accepted ? [{ user_id: "owner" }] : [];
  } } as never);
  assert.equal(await repository.claimTest("owner"), true);
  accepted = false; assert.equal(await repository.claimTest("owner"), false);
  assert.match(records[0], /ON CONFLICT \(user_id\) DO UPDATE SET last_test_at/);
  assert.match(records[0], /interval '30 seconds'/);
  assert.ok(!records[0].includes("encrypted_api_key ="));
});
