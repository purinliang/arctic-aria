import assert from "node:assert/strict";
import test from "node:test";
import { getDatabaseUrl, getDatabaseUrlSource } from "../neon.ts";

test("database URL prefers pooled Neon URL", () => {
  const env = {
    NEON_POSTGRES_URL: "postgresql://pooled",
    NEON_DATABASE_URL: "postgresql://database",
    DATABASE_URL: "postgresql://generic",
  };

  assert.equal(getDatabaseUrl(env), "postgresql://pooled");
  assert.equal(getDatabaseUrlSource(env), "NEON_POSTGRES_URL");
});

test("database URL falls back to generic DATABASE_URL", () => {
  const env = {
    DATABASE_URL: "postgresql://generic",
  };

  assert.equal(getDatabaseUrl(env), "postgresql://generic");
  assert.equal(getDatabaseUrlSource(env), "DATABASE_URL");
});

test("database URL throws when no known key exists", () => {
  assert.throws(
    () => getDatabaseUrl({}),
    /Missing database URL. Set one of: NEON_POSTGRES_URL, NEON_DATABASE_URL, DATABASE_URL./,
  );
  assert.equal(getDatabaseUrlSource({}), null);
});
