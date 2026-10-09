import assert from "node:assert/strict";
import test from "node:test";
import { ApiError, GenerateContentResponse } from "@google/genai/node";
import { createGeminiClient } from "../gemini-client.ts";
import { geminiConnectionTestPrompt } from "../gemini-config.ts";

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
      const client = createGeminiClient({ env: { GEMINI_API_KEY: "test-api-key" }, logConnectionTestErrors: true, generate: async () => {
        throw Object.assign(new Error("test-api-key"), { status: 429 });
      } });
      await assert.rejects(client.generateText(geminiConnectionTestPrompt), { code: "request_failed", status: 429 });
    }
    assert.equal(warn.mock.callCount(), 0);
  } finally {
    if (previous === undefined) delete environment.NODE_ENV;
    else environment.NODE_ENV = previous;
  }
});

test("provider response logging is opt-in and limited to the neutral connection test", async (t) => {
  const previous = environment.NODE_ENV;
  environment.NODE_ENV = "development";
  const warn = t.mock.method(console, "warn", () => {});
  try {
    const generate = async () => {
      throw new ApiError({ status: 404, message: JSON.stringify({ error: {
        code: 404, status: "NOT_FOUND", message: "models/gemini-2.5-flash is not found. test-api-key",
        details: [{ metadata: { credential: "test-api-key" } }],
      } }) });
    };
    const client = createGeminiClient({ env: { GEMINI_API_KEY: "test-api-key" }, generate, logConnectionTestErrors: true });
    await assert.rejects(client.generateText(geminiConnectionTestPrompt), { status: 404 });
    assert.deepEqual(warn.mock.calls[1].arguments, ["[Gemini] provider error response (redacted)", {
      error: { code: 404, status: "NOT_FOUND", message: "models/gemini-2.5-flash is not found. [redacted]" },
    }]);
    await assert.rejects(client.generateText("private product prompt"), { status: 404 });
    const quiet = createGeminiClient({ env: { GEMINI_API_KEY: "test-api-key" }, generate });
    await assert.rejects(quiet.generateText(geminiConnectionTestPrompt), { status: 404 });
    assert.equal(warn.mock.callCount(), 4);
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
