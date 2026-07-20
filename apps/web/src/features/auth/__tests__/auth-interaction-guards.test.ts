import assert from "node:assert/strict";
import test from "node:test";
import {
  immediateLogoutIgnoreMs,
  shouldIgnoreImmediateLogout,
} from "../auth-interaction-guards.ts";

test("immediate logout guard ignores clicks shortly after session creation", () => {
  assert.equal(
    shouldIgnoreImmediateLogout({ lastSessionCreatedAt: 1_000, now: 1_500 }),
    true,
  );
});

test("immediate logout guard allows normal later logout clicks", () => {
  assert.equal(
    shouldIgnoreImmediateLogout({
      lastSessionCreatedAt: 1_000,
      now: 1_000 + immediateLogoutIgnoreMs,
    }),
    false,
  );
  assert.equal(
    shouldIgnoreImmediateLogout({ lastSessionCreatedAt: null, now: 1_500 }),
    false,
  );
});
