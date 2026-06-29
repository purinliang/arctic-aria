import assert from "node:assert/strict";
import test from "node:test";
import {
  authSessionMaxAgeSeconds,
  createAuthSessionToken,
  readAuthSessionToken,
} from "../server/session.ts";

const user = {
  id: "user-1",
  username: "purin",
  displayName: "Purin",
};

test("auth session token round trips a user for 30 days", () => {
  const now = Date.UTC(2026, 0, 1);
  const token = createAuthSessionToken(user, "secret", now);
  const session = readAuthSessionToken(token, "secret", now);

  assert.ok(session);
  assert.equal(session.id, user.id);
  assert.equal(session.username, user.username);
  assert.equal(session.displayName, user.displayName);
  assert.equal(session.expiresAt, now + authSessionMaxAgeSeconds * 1000);
});

test("auth session token rejects tampering and expired sessions", () => {
  const now = Date.UTC(2026, 0, 1);
  const token = createAuthSessionToken(user, "secret", now);
  const [payload, signature] = token.split(".");
  const tamperedToken = `${payload}x.${signature}`;

  assert.equal(readAuthSessionToken(tamperedToken, "secret", now), null);
  assert.equal(readAuthSessionToken(token, "wrong-secret", now), null);
  assert.equal(
    readAuthSessionToken(token, "secret", now + authSessionMaxAgeSeconds * 1000),
    null,
  );
});
