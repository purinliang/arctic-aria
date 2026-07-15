import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

const databaseUrlKey = "NEON_POSTGRES_URL" as const;

type SqlClient = NeonQueryFunction<false, false>;

let cachedSql: SqlClient | null = null;

export function getDatabaseUrl(env: NodeJS.ProcessEnv = process.env) {
  const value = env[databaseUrlKey];

  if (value) {
    return value;
  }

  throw new Error(`Missing database URL. Set ${databaseUrlKey}.`);
}

export function getDatabaseUrlSource(
  env: NodeJS.ProcessEnv = process.env,
): typeof databaseUrlKey | null {
  if (env[databaseUrlKey]) {
    return databaseUrlKey;
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
