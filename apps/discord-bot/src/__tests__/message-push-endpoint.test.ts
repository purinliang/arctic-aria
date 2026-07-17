import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  browserMessagePushHelpResponse,
  readBearerToken,
} from "../infrastructure/message-push-endpoint.ts";

describe("message push endpoint helpers", () => {
  it("explains that browser GET requests are not message-push calls", () => {
    assert.deepEqual(browserMessagePushHelpResponse(), {
      error:
        "Outbound Discord messages use POST requests with Authorization: Bearer <secret>.",
      expectedMethod: "POST",
    });
  });

  it("reads bearer tokens from authorization headers", () => {
    assert.equal(readBearerToken("Bearer test-secret"), "test-secret");
    assert.equal(readBearerToken("bearer   test-secret  "), "test-secret");
    assert.equal(readBearerToken("Basic test-secret"), null);
    assert.equal(readBearerToken(undefined), null);
  });
});
