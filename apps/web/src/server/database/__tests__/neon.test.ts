import assert from "node:assert/strict";
import test from "node:test";
import { getDatabaseUrl, getDatabaseUrlSource } from "../neon.ts";

test("database URL reads the Neon Postgres URL", () => {
  const env = {
    NEON_POSTGRES_URL: "postgresql://pooled",
  };

  assert.equal(getDatabaseUrl(env), "postgresql://pooled");
  assert.equal(getDatabaseUrlSource(env), "NEON_POSTGRES_URL");
});

test("database URL throws when no known key exists", () => {
  assert.throws(
    () => getDatabaseUrl({}),
    /Missing database URL. Set NEON_POSTGRES_URL./,
  );
  assert.equal(getDatabaseUrlSource({}), null);
});
