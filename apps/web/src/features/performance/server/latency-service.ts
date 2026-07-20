import type { NeonQueryFunction } from "@neondatabase/serverless";
import { getSql } from "../../../server/database/neon.ts";
import type { LatencyApiSuccess } from "../latency-types";

type LatencyServiceOptions = {
  sql?: NeonQueryFunction<false, false>;
  now?: () => number;
};

export async function measureLatencySample(
  options: LatencyServiceOptions = {},
): Promise<LatencyApiSuccess> {
  const sql = options.sql ?? getSql();
  const now = options.now ?? performanceNow;
  const serverStartedAt = now();
  const databaseStartedAt = now();

  await sql`SELECT 1`;

  const databaseMs = now() - databaseStartedAt;
  const serverTotalMs = now() - serverStartedAt;

  return {
    ok: true,
    measuredAt: new Date().toISOString(),
    serverTotalMs: roundMs(serverTotalMs),
    databaseMs: roundMs(databaseMs),
  };
}

function performanceNow() {
  return performance.now();
}

function roundMs(value: number) {
  return Math.round(value * 10) / 10;
}
