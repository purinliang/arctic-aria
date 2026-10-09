import assert from "node:assert/strict";
import test from "node:test";
import { GenerateContentResponse } from "@google/genai/node";
import { geminiConfig, GeminiConfigError } from "../gemini-config.ts";
import { createGeminiClient, GeminiError } from "../gemini-client.ts";

const env = { GEMINI_API_KEY: "test-api-key" };
const response = () => {
  const result = new GenerateContentResponse();
  result.candidates = [{ content: { parts: [{ text: " READY " }] } }];
  return result;
};

test("Gemini configuration uses private variables and defaults to 2.5 Flash", () => {
  assert.deepEqual(geminiConfig(env), { apiKey: "test-api-key", model: "gemini-2.5-flash" });
  assert.deepEqual(geminiConfig({ GEMINI_API_KEY: " test-api-key ", GEMINI_MODEL: " gemini-2.5-flash-lite " }),
    { apiKey: "test-api-key", model: "gemini-2.5-flash-lite" });
  for (const value of [undefined, "", " "]) assert.throws(() => geminiConfig({ GEMINI_API_KEY: value }), GeminiConfigError);
  assert.throws(() => geminiConfig({ NEXT_PUBLIC_GEMINI_API_KEY: "test-api-key" }), GeminiConfigError);
  assert.throws(() => geminiConfig({ GOOGLE_API_KEY: "test-api-key" }), GeminiConfigError);
  assert.throws(() => geminiConfig({ ...env, GEMINI_MODEL: "https://example.com" }), GeminiConfigError);
});

test("Gemini cannot be configured in a browser", () => {
  Object.defineProperty(globalThis, "window", { value: {}, configurable: true });
  try { assert.throws(() => geminiConfig(env), /server-only/); }
  finally { Reflect.deleteProperty(globalThis, "window"); }
});

test("Gemini sends bounded text requests and returns text without credentials", async () => {
  const client = createGeminiClient({ env, generate: async (input) => {
    assert.equal(input.model, "gemini-2.5-flash");
    assert.equal(input.contents, "Hello");
    assert.deepEqual(input.config, { maxOutputTokens: 1_024, thinkingConfig: { thinkingBudget: 0 } });
    return response();
  } });
  assert.deepEqual(await client.generateText(" Hello "), { text: "READY", model: "gemini-2.5-flash" });
});

test("Gemini rejects invalid prompts before sending requests", async () => {
  let calls = 0;
  const client = createGeminiClient({ env, generate: async () => { calls++; return response(); } });
  for (const prompt of ["", " ", "x".repeat(8_001)]) await assert.rejects(client.generateText(prompt), { code: "invalid_input" });
  assert.equal(calls, 0);
});

test("Gemini provider failures are sanitized and are not retried by the adapter", async () => {
  let calls = 0;
  const client = createGeminiClient({ env, generate: async () => {
    calls++;
    throw Object.assign(new Error("test-api-key private prompt"), { status: 429 });
  } });
  await assert.rejects(client.generateText("Hello"), (error) => {
    assert.ok(error instanceof GeminiError);
    assert.equal(error.code, "request_failed"); assert.equal(error.status, 429);
    assert.ok(!String(error).includes("test-api-key")); assert.equal(error.cause, undefined);
    return true;
  });
  assert.equal(calls, 1);
});

test("Gemini empty or blocked output is not treated as a successful response", async () => {
  const client = createGeminiClient({ env, generate: async () => new GenerateContentResponse() });
  await assert.rejects(client.generateText("Hello"), { code: "empty_response" });
});

test('Gemini chat preserves explicit conversation roles and rejects malformed history', async () => {
  let calls = 0;
  const client = createGeminiClient({ env, generate: async input => {
    calls++;
    assert.deepEqual(input.contents, [
      { role: 'user', parts: [{ text: 'Hello' }] }, { role: 'model', parts: [{ text: 'Hi' }] },
      { role: 'user', parts: [{ text: 'Next' }] },
    ]);
    return response();
  } });
  await client.generateConversation([{ role: 'user', text: 'Hello' }, { role: 'model', text: 'Hi' }, { role: 'user', text: 'Next' }]);
  await assert.rejects(client.generateConversation([]), { code: 'invalid_input' });
  await assert.rejects(client.generateConversation([{ role: 'model', text: 'Bad' }]), { code: 'invalid_input' });
  assert.equal(calls, 1);
});

test('Gemini sanitizes network and timeout failures into stable adapter codes', async () => {
  for (const [error, code] of [[new TypeError('private content'), 'network_failure'],
    [Object.assign(new Error('private content'), { name: 'TimeoutError' }), 'timeout']] as const) {
    const client = createGeminiClient({ env, generate: async () => { throw error; } });
    await assert.rejects(client.generateText('Hello'), { code });
  }
});
