import assert from "node:assert/strict";
import test from "node:test";
import { summarizeLatency, summarizeNumbers } from "../latency-stats.ts";

test("latency stats summarize sorted percentiles and averages", () => {
  assert.deepEqual(summarizeNumbers([50, 10, 30, 20, 40]), {
    min: 10,
    p10: 14,
    p50: 30,
    p90: 46,
    max: 50,
    avg: 30,
  });
});

test("latency report summarizes every metric", () => {
  const report = summarizeLatency([
    {
      clientTotalMs: 40,
      serverTotalMs: 30,
      databaseMs: 20,
      networkEstimateMs: 10,
    },
    {
      clientTotalMs: 20,
      serverTotalMs: 15,
      databaseMs: 10,
      networkEstimateMs: 5,
    },
  ]);

  assert.equal(report.sampleCount, 2);
  assert.equal(report.metrics.clientTotalMs.avg, 30);
  assert.equal(report.metrics.serverTotalMs.max, 30);
  assert.equal(report.metrics.databaseMs.min, 10);
  assert.equal(report.metrics.networkEstimateMs.p50, 7.5);
});
