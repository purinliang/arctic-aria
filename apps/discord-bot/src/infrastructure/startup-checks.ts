import type { QueryExecutor } from "./query-executor.ts";

export async function checkDatabaseConnection(sql: QueryExecutor) {
  await sql.query("SELECT 1 AS ok", []);
}

export function formatStartupFailure(step: string, error: unknown) {
  return {
    step,
    code: readErrorCode(error),
    message: error instanceof Error ? error.message : "unknown",
  };
}

function readErrorCode(error: unknown) {
  if (error && typeof error === "object" && "code" in error) {
    return String(error.code);
  }

  return "unknown";
}
