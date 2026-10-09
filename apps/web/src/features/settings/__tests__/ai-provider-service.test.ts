import assert from "node:assert/strict";
import test from "node:test";
import { createAIProviderService } from "../server/ai-provider-service.ts";
import { createCredentialEncryption } from "../../../server/ai/credential-encryption.ts";
import { GeminiError } from "../../../server/ai/gemini-client.ts";
import type { AICredential } from "../server/ai-provider-repository.ts";

const userA = "00000000-0000-4000-8000-000000000001";
const userB = "00000000-0000-4000-8000-000000000002";
const keyA = "test-account-a-api-key", keyB = "test-account-b-api-key";

function fixture() {
  const rows = new Map<string, AICredential>();
  const claimed = new Set<string>();
  const calls: string[] = [];
  const encryption = createCredentialEncryption({ AI_CREDENTIAL_ENCRYPTION_KEY: Buffer.alloc(32, 9).toString("base64") });
  const repository = {
    async find(userId: string) { return rows.get(userId) ?? null; },
    async save(userId: string, enabled: boolean, encryptedKey: string | null, removeKey: boolean) {
      const value = { enabled, encrypted_api_key: removeKey ? null : encryptedKey ?? rows.get(userId)?.encrypted_api_key ?? null };
      rows.set(userId, value);
      return { enabled, hasKey: Boolean(value.encrypted_api_key), provider: "google_gemini" as const };
    },
    async claimTest(userId: string) {
      if (claimed.has(userId)) return false;
      claimed.add(userId); return true;
    },
  };
  const service = createAIProviderService({ repository, encryption, client: apiKey => ({
    async generateText(prompt: string) { assert.equal(prompt, "Reply with the word READY."); calls.push(apiKey); return { text: "READY", model: "gemini-2.5-flash" }; },
  }) });
  return { service, rows, calls, claimed, encryption, repository };
}

test("AI settings encrypt account-owned keys and return status only", async () => {
  const { service, rows, calls } = fixture();
  assert.deepEqual(await service.get(userA), { ok: true, data: { enabled: false, provider: "google_gemini", hasKey: false } });
  for (const [userId, key] of [[userA, keyA], [userB, keyB]]) {
    const result = await service.save(userId, { enabled: true, provider: "google_gemini", apiKey: key });
    assert.deepEqual(result, { ok: true, data: { enabled: true, provider: "google_gemini", hasKey: true } });
    assert.ok(!JSON.stringify(rows.get(userId)).includes(key));
    assert.ok((await service.test(userId, key)).ok);
  }
  assert.deepEqual(calls, [keyA, keyB]);
});

test("Blank keys preserve credentials; disable retains them; remove clears and disables", async () => {
  const { service, rows } = fixture();
  await service.save(userA, { enabled: true, provider: "google_gemini", apiKey: keyA });
  const ciphertext = rows.get(userA)!.encrypted_api_key;
  await service.save(userA, { enabled: false, provider: "google_gemini", apiKey: " " });
  assert.equal(rows.get(userA)!.encrypted_api_key, ciphertext);
  await service.save(userA, { enabled: true, provider: "google_gemini" });
  assert.equal(rows.get(userA)!.encrypted_api_key, ciphertext);
  await service.save(userA, { enabled: false, provider: "google_gemini", removeKey: true });
  assert.deepEqual(rows.get(userA), { enabled: false, encrypted_api_key: null });
});

test("AI tests have no app-key fallback and typed tests do not persist draft credentials", async () => {
  const { service, calls, rows, encryption } = fixture();
  process.env.GEMINI_API_KEY = "test-global-api-key";
  try {
    await service.save(userA, { enabled: true, provider: "google_gemini", apiKey: keyB });
    assert.equal((await service.test(userA, " ")).ok, false);
    assert.deepEqual(calls, []);
    assert.ok((await service.test(userA, keyA)).ok);
    assert.deepEqual(calls, [keyA]);
    assert.equal(encryption.decrypt(userA, rows.get(userA)!.encrypted_api_key!), keyB);
  } finally { delete process.env.GEMINI_API_KEY; }
});

test("AI validation rejects invalid owners, keys, providers and enabling without a key", async () => {
  const { service, rows } = fixture();
  assert.equal((await service.save(userA, { enabled: true, provider: "google_gemini" })).ok, false);
  for (const key of ["x", "a".repeat(257), "test-key\nextra", "测试密钥"]) {
    assert.equal((await service.save(userA, { enabled: true, provider: "google_gemini", apiKey: key })).ok, false);
  }
  assert.equal((await service.save("invalid", { enabled: false, provider: "google_gemini" })).ok, false);
  assert.equal((await service.test("invalid", keyA)).ok, false);
  assert.equal((await service.save(userA, { enabled: true, provider: "google_gemini", removeKey: true })).ok, false);
  assert.equal(rows.size, 0);
});

test("AI tests rate-limit each account independently and sanitize provider failures", async () => {
  const f = fixture();
  assert.ok((await f.service.test(userA, keyA)).ok);
  assert.equal((await f.service.test(userA, keyA)).ok, false);
  assert.ok((await f.service.test(userB, keyB)).ok);
  const service = createAIProviderService({ repository: f.repository, encryption: f.encryption, client: () => ({
    async generateText() { throw new GeminiError("request_failed", 403); },
  }) });
  f.claimed.clear();
  const result = await service.test(userA, keyA);
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.code, "ai_key_rejected");
  assert.ok(!JSON.stringify(result).includes(keyA));
  assert.ok((await service.save(userA, { enabled: true, provider: "google_gemini", apiKey: keyA })).ok,
    "Saving a key does not require a successful test");
});
