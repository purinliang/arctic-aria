import assert from "node:assert/strict";
import test from "node:test";
import {
  authSessionMaxAgeSeconds,
  createAuthSessionToken,
  getAuthSessionSecret,
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

test("auth session secret uses the explicit auth secret", () => {
  withSessionEnv(
    {
      AUTH_SESSION_SECRET: " explicit-session-secret ",
      NEON_POSTGRES_URL: "postgresql://should-not-be-used",
    },
    () => {
      assert.equal(getAuthSessionSecret(), "explicit-session-secret");
    },
  );
});

test("auth session secret does not fall back to the database URL", () => {
  withSessionEnv(
    {
      AUTH_SESSION_SECRET: undefined,
      NEON_POSTGRES_URL: "postgresql://should-not-be-used",
    },
    () => {
      assert.throws(
        () => getAuthSessionSecret(),
        /Missing AUTH_SESSION_SECRET/,
      );
    },
  );
});

function withSessionEnv(
  nextEnv: {
    AUTH_SESSION_SECRET: string | undefined;
    NEON_POSTGRES_URL: string | undefined;
  },
  callback: () => void,
) {
  const previousEnv = {
    AUTH_SESSION_SECRET: process.env.AUTH_SESSION_SECRET,
    NEON_POSTGRES_URL: process.env.NEON_POSTGRES_URL,
  };

  setEnv("AUTH_SESSION_SECRET", nextEnv.AUTH_SESSION_SECRET);
  setEnv("NEON_POSTGRES_URL", nextEnv.NEON_POSTGRES_URL);

  try {
    callback();
  } finally {
    setEnv("AUTH_SESSION_SECRET", previousEnv.AUTH_SESSION_SECRET);
    setEnv("NEON_POSTGRES_URL", previousEnv.NEON_POSTGRES_URL);
  }
}

function setEnv(key: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
    return;
  }

  process.env[key] = value;
}
