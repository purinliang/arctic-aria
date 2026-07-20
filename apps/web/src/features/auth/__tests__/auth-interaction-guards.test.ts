import assert from "node:assert/strict";
import test from "node:test";
import {
  frequentOperationRejectMs,
  immediateLogoutRejectMs,
  shouldIgnoreImmediateLogout,
  shouldRejectFrequentOperation,
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
      now: 1_000 + immediateLogoutRejectMs,
    }),
    false,
  );
  assert.equal(
    shouldIgnoreImmediateLogout({ lastSessionCreatedAt: null, now: 1_500 }),
    false,
  );
});

test("frequent operation guard rejects repeated operations inside the window", () => {
  assert.equal(
    shouldRejectFrequentOperation({ lastOperationAt: 1_000, now: 1_100 }),
    true,
  );
});

test("frequent operation guard allows operations after the window", () => {
  assert.equal(
    shouldRejectFrequentOperation({
      lastOperationAt: 1_000,
      now: 1_000 + frequentOperationRejectMs,
    }),
    false,
  );
  assert.equal(
    shouldRejectFrequentOperation({ lastOperationAt: null, now: 1_100 }),
    false,
  );
});
