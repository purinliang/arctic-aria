import type { NeonQueryFunction } from "@neondatabase/serverless";
import { getSql } from "../../../server/database/neon.ts";
import type { DatabaseLatencyApiSuccess } from "../latency-types";

type LatencyServiceOptions = {
  sql?: NeonQueryFunction<false, false>;
  now?: () => number;
};

export async function measureDatabaseLatencySample(
  options: LatencyServiceOptions = {},
): Promise<DatabaseLatencyApiSuccess> {
  const sql = options.sql ?? getSql();
  const now = options.now ?? performanceNow;
  const databaseStartedAt = now();

  await sql`SELECT 1`;

  const databaseMs = now() - databaseStartedAt;

  return {
    ok: true,
    measuredAt: new Date().toISOString(),
    probe: "database",
    databaseMs: roundMs(databaseMs),
  };
}

export function measureBackendLatencySample() {
  return {
    ok: true as const,
    measuredAt: new Date().toISOString(),
    probe: "backend" as const,
  };
}

function performanceNow() {
  return performance.now();
}

function roundMs(value: number) {
  return Math.round(value * 10) / 10;
}
