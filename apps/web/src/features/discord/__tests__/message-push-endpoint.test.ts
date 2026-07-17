import assert from "node:assert/strict";
import test from "node:test";
import {
  discordMessagePushHelpResponse,
  readBearerToken,
} from "../server/message-push-endpoint.ts";

test("message push endpoint reads bearer tokens", () => {
  assert.equal(readBearerToken("Bearer test-secret"), "test-secret");
  assert.equal(readBearerToken("bearer test-secret "), "test-secret");
  assert.equal(readBearerToken("Basic test-secret"), null);
});

test("message push endpoint explains browser GET requests", async () => {
  const response = discordMessagePushHelpResponse();

  assert.equal(response.status, 405);
  assert.deepEqual(await response.json(), {
    error:
      "Outbound Discord messages use POST requests with Authorization: Bearer <secret>.",
    expectedMethod: "POST",
  });
});
