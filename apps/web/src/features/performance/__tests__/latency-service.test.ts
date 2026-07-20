import assert from "node:assert/strict";
import test from "node:test";
import { measureLatencySample } from "../server/latency-service.ts";

test("latency service measures one database query", async () => {
  const calls: string[] = [];
  const nowValues = [10, 12, 42, 45];
  const result = await measureLatencySample({
    now: () => nowValues.shift() ?? 45,
    sql: ((strings: TemplateStringsArray) => {
      calls.push(strings.join(""));
      return Promise.resolve([]);
    }) as never,
  });

  assert.deepEqual(calls, ["SELECT 1"]);
  assert.equal(result.ok, true);
  assert.equal(result.databaseMs, 30);
  assert.equal(result.serverTotalMs, 35);
});
