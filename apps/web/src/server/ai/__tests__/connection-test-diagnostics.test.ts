import assert from "node:assert/strict";
import test from "node:test";
import { ApiError } from "@google/genai/node";
import { connectionTestErrorResponse } from "../connection-test-diagnostics.ts";

test("connection diagnostics retain Google's message while redacting credentials and metadata", () => {
  const apiKey = "test-fixture/key+value";
  const error = new ApiError({ status: 404, message: JSON.stringify({
    error: {
      code: 404, status: "NOT_FOUND",
      message: `Model not found. ${apiKey} ${encodeURIComponent(apiKey)} https://example.test/?key=other-secret Bearer other-token projects/test-project test@example.test`,
      details: [{ metadata: { apiKey, otherSecret: "secret-metadata" } }],
    },
    headers: { authorization: "secret-header" },
  }) });
  const result = connectionTestErrorResponse(error, apiKey);
  assert.equal(result?.error.code, 404);
  assert.equal(result?.error.status, "NOT_FOUND");
  assert.ok(result?.error.message.startsWith("Model not found."));
  assert.doesNotMatch(JSON.stringify(result), /test-fixture|other-secret|other-token|test-project|test@example|secret-metadata|secret-header/);
});

test("connection diagnostics do not log arbitrary exceptions or malformed provider responses", () => {
  for (const error of [new Error("private text"), { message: "private text" },
    new ApiError({ status: 404, message: "not JSON" }),
    new ApiError({ status: 404, message: JSON.stringify({ error: { message: 123 } }) })]) {
    assert.equal(connectionTestErrorResponse(error, "test-api-key"), undefined);
  }
});

test("connection diagnostic messages are bounded and provider statuses are allowlisted", () => {
  const result = connectionTestErrorResponse(new ApiError({ status: 404, message: JSON.stringify({ error: {
    status: "private-secret", message: "x".repeat(5_000),
  } }) }), "test-api-key");
  assert.equal(result?.error.message.length, 4_000);
  assert.equal(result?.error.status, undefined);
});
