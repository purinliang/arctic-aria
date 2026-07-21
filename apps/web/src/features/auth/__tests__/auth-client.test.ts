import assert from "node:assert/strict";
import test from "node:test";
import { submitLogin } from "../auth-client.ts";

test("auth client reports failed requests without credential details", async () => {
  const previousFetch = globalThis.fetch;

  globalThis.fetch = async () => {
    throw new Error("fetch failed");
  };

  try {
    const result = await submitLogin({
      username: "testusername",
      password: "testpassword",
    });

    assert.deepEqual(result, {
      ok: false,
      code: "auth_request_failed",
      message: "Server internal error.",
      category: "server",
    });
  } finally {
    globalThis.fetch = previousFetch;
  }
});
