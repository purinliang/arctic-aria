import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { browserInteractionHelpResponse } from "../discord-http-server.ts";

describe("discord HTTP server route helpers", () => {
  it("explains that browser GET requests are not Discord interactions", () => {
    assert.deepEqual(browserInteractionHelpResponse(), {
      error:
        "Discord interactions use POST requests. Set the public Discord endpoint URL to this path, but do not open it directly in a browser.",
      expectedMethod: "POST",
    });
  });
});
