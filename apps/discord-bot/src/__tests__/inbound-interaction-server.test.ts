import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { browserInboundInteractionHelpResponse } from "../inbound-interaction-server.ts";

describe("inbound interaction server route helpers", () => {
  it("explains that browser GET requests are not Discord interactions", () => {
    assert.deepEqual(browserInboundInteractionHelpResponse(), {
      error:
        "Discord interactions use POST requests. Set the public Discord endpoint URL to this path, but do not open it directly in a browser.",
      expectedMethod: "POST",
    });
  });
});
