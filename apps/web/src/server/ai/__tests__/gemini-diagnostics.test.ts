import assert from "node:assert/strict";
import test from "node:test";
import { GenerateContentResponse } from "@google/genai/node";
import { createGeminiClient } from "../gemini-client.ts";

const environment: Record<string, string | undefined> = process.env;

test("development Gemini failures log only safe model, status and code", async (t) => {
  const previous = environment.NODE_ENV;
  environment.NODE_ENV = "development";
  const warn = t.mock.method(console, "warn", () => {});
  try {
    const client = createGeminiClient({ env: { GEMINI_API_KEY: "test-api-key" }, generate: async () => {
      throw Object.assign(new Error("test-api-key private prompt https://example.test/?key=test-api-key"), {
        status: 404, response: { secret: "test-api-key" },
      });
    } });
    await assert.rejects(client.generateText("private prompt"), { code: "request_failed", status: 404 });
    assert.deepEqual(warn.mock.calls[0].arguments, ["[Gemini] generateContent failed", {
      model: "gemini-2.5-flash", status: 404, code: "request_failed",
    }]);
    assert.equal(warn.mock.callCount(), 1);
    assert.doesNotMatch(JSON.stringify(warn.mock.calls[0].arguments), /test-api-key|private prompt|https:/);
  } finally {
    if (previous === undefined) delete environment.NODE_ENV;
    else environment.NODE_ENV = previous;
  }
});

test("production and test Gemini failures do not log provider exceptions", async (t) => {
  const previous = environment.NODE_ENV;
  const warn = t.mock.method(console, "warn", () => {});
  try {
    for (const mode of ["production", "test"]) {
      environment.NODE_ENV = mode;
      const client = createGeminiClient({ env: { GEMINI_API_KEY: "test-api-key" }, generate: async () => {
        throw Object.assign(new Error("test-api-key"), { status: 429 });
      } });
      await assert.rejects(client.generateText("Hello"), { code: "request_failed", status: 429 });
    }
    assert.equal(warn.mock.callCount(), 0);
  } finally {
    if (previous === undefined) delete environment.NODE_ENV;
    else environment.NODE_ENV = previous;
  }
});

test("development diagnostics handle unknown status and empty responses safely", async (t) => {
  const previous = environment.NODE_ENV;
  environment.NODE_ENV = "development";
  const warn = t.mock.method(console, "warn", () => {});
  try {
    for (const status of [undefined, "test-api-key", 999, NaN, 404.5]) {
      const client = createGeminiClient({ env: { GEMINI_API_KEY: "test-api-key" }, generate: async () => {
        throw { status, message: "test-api-key private prompt" };
      } });
      await assert.rejects(client.generateText("Hello"), { code: "request_failed", status: undefined });
    }
    const client = createGeminiClient({ env: { GEMINI_API_KEY: "test-api-key" },
      generate: async () => new GenerateContentResponse() });
    await assert.rejects(client.generateText("Hello"), { code: "empty_response" });
    assert.equal(warn.mock.callCount(), 6);
    for (const call of warn.mock.calls) assert.equal(call.arguments[1].status, null);
    assert.equal(warn.mock.calls[5].arguments[1].code, "empty_response");
  } finally {
    if (previous === undefined) delete environment.NODE_ENV;
    else environment.NODE_ENV = previous;
  }
});
