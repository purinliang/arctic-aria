import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  browserInteractionHelpResponse,
  browserOutboundMessageHelpResponse,
  readBearerToken,
} from "../discord-http-server.ts";

describe("discord HTTP server route helpers", () => {
  it("explains that browser GET requests are not Discord interactions", () => {
    assert.deepEqual(browserInteractionHelpResponse(), {
      error:
        "Discord interactions use POST requests. Set the public Discord endpoint URL to this path, but do not open it directly in a browser.",
      expectedMethod: "POST",
    });
  });

  it("explains that browser GET requests are not outbound message calls", () => {
    assert.deepEqual(browserOutboundMessageHelpResponse(), {
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
