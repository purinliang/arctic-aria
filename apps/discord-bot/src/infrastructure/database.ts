import { neon } from "@neondatabase/serverless";
import type { NeonQueryFunction } from "@neondatabase/serverless";

type Sql = NeonQueryFunction<false, false>;

export type QueryExecutor = {
  query(sql: string, parameters?: unknown[]): Promise<unknown[]>;
};

let sql: Sql | null = null;

export function getSql() {
  sql ??= neon(getDatabaseUrl());

  return sql;
}

export function getDatabaseUrl(env: NodeJS.ProcessEnv = process.env) {
  const value = env.NEON_POSTGRES_URL?.trim();

  if (!value) {
    throw new Error("Missing database URL. Set NEON_POSTGRES_URL.");
  }

  return value;
}
