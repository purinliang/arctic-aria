import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

const databaseUrlKeys = [
  "NEON_POSTGRES_URL",
  "NEON_DATABASE_URL",
  "DATABASE_URL",
] as const;

type DatabaseUrlKey = (typeof databaseUrlKeys)[number];

type SqlClient = NeonQueryFunction<false, false>;

let cachedSql: SqlClient | null = null;

export function getDatabaseUrl(env: NodeJS.ProcessEnv = process.env) {
  for (const key of databaseUrlKeys) {
    const value = env[key];

    if (value) {
      return value;
    }
  }

  throw new Error(
    `Missing database URL. Set one of: ${databaseUrlKeys.join(", ")}.`,
  );
}

export function getDatabaseUrlSource(
  env: NodeJS.ProcessEnv = process.env,
): DatabaseUrlKey | null {
  for (const key of databaseUrlKeys) {
    if (env[key]) {
      return key;
    }
  }

  return null;
}

export function getSql() {
  cachedSql ??= neon(getDatabaseUrl());

  return cachedSql;
}

export function resetSqlForTests() {
  cachedSql = null;
}
