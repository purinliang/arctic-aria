import assert from "node:assert/strict";
import test from "node:test";
import {
  measureBackendLatencySample,
  measureDatabaseLatencySample,
} from "../server/latency-service.ts";

test("latency service measures one database query", async () => {
  const calls: string[] = [];
  const nowValues = [12, 42];
  const result = await measureDatabaseLatencySample({
    now: () => nowValues.shift() ?? 45,
    sql: ((strings: TemplateStringsArray) => {
      calls.push(strings.join(""));
      return Promise.resolve([]);
    }) as never,
  });

  assert.deepEqual(calls, ["SELECT 1"]);
  assert.equal(result.ok, true);
  assert.equal(result.probe, "database");
  assert.equal(result.databaseMs, 30);
});

test("latency service measures backend probe without database", () => {
  const result = measureBackendLatencySample();

  assert.equal(result.ok, true);
  assert.equal(result.probe, "backend");
  assert.equal(typeof result.measuredAt, "string");
});
