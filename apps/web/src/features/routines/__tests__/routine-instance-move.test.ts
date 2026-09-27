import assert from "node:assert/strict";
import test from "node:test";
import { moveRoutineInstanceToTomorrowInPostgres } from "../server/routine-instance-move.ts";

test("Tomorrow deletes only an untouched target before updating the owned source", async () => {
  const queries: Array<{ sql: string; params: unknown[] }> = [];
  let isolationLevel = "";
  const sql = {
    async transaction(callback: (tx: { query: (sql: string, params: unknown[]) => unknown }) => unknown, options: { isolationLevel: string }) {
      isolationLevel = options.isolationLevel;
      callback({
        query(query, params) {
          queries.push({ sql: query, params });
          return [];
        },
      });
      return [[], []];
    },
  };
  const occurredAt = new Date("2026-07-12T10:00:00.000Z");

  const result = await moveRoutineInstanceToTomorrowInPostgres(sql as never, {
    userId: "user-1",
    instanceId: "instance-1",
    occurredAt,
  });

  assert.equal(result, null);
  assert.equal(isolationLevel, "Serializable");
  assert.equal(queries.length, 2);
  assert.match(queries[0]!.sql, /DELETE FROM routine_instances AS target/);
  assert.match(queries[0]!.sql, /target\.reminded_at IS NULL/);
  assert.match(queries[0]!.sql, /routine_completion_events AS history/);
  assert.match(queries[0]!.sql, /FOR UPDATE OF routine_instances/);
  assert.match(queries[1]!.sql, /UPDATE routine_instances AS source/);
  assert.match(queries[1]!.sql, /NOT EXISTS \(\s+SELECT 1 FROM routine_instances AS target/);
  assert.match(queries[1]!.sql, /moved_from_date = source\.scheduled_date/);
  assert.deepEqual(queries[0]!.params, ["user-1", "instance-1", occurredAt]);
  assert.deepEqual(queries[1]!.params, ["user-1", "instance-1", occurredAt]);
});
