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
      frontendBackendMs: 40,
      backendDatabaseMs: 20,
    },
    {
      frontendBackendMs: 20,
      backendDatabaseMs: 10,
    },
  ]);

  assert.equal(report.sampleCount, 2);
  assert.equal(report.metrics.frontendBackendMs.avg, 30);
  assert.equal(report.metrics.backendDatabaseMs.min, 10);
  assert.deepEqual(Object.keys(report.metrics).sort(), [
    "backendDatabaseMs",
    "frontendBackendMs",
  ]);
});
