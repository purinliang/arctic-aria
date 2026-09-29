import assert from "node:assert/strict";
import test from "node:test";
import type { NeonQueryFunction } from "@neondatabase/serverless";
import { movePostgresDashboardTaskToTomorrow } from "../server/postgres-project-task-move.ts";

test("project task move uses one serializable transaction and protects tomorrow", async () => {
  const queries: string[] = [];
  const sql = {
    async transaction(
      callback: (tx: { query: (query: string) => Promise<unknown[]> }) => unknown,
      options: { isolationLevel: string },
    ) {
      assert.equal(options.isolationLevel, "Serializable");
      callback({
        query(query) {
          queries.push(query);
          return Promise.resolve([]);
        },
      });
      return [[], [{ id: "selection-1" }]];
    },
  } as unknown as NeonQueryFunction<false, false>;

  const moved = await movePostgresDashboardTaskToTomorrow(sql, {
    userId: "user-1",
    taskId: "task-1",
    today: "2026-07-14",
    occurredAt: new Date("2026-07-14T10:00:00.000Z"),
  });

  assert.equal(moved, true);
  assert.equal(queries.length, 2);
  assert.match(queries[0], /FOR UPDATE OF selection/);
  assert.match(queries[0], /target\.source = 'scheduler'/);
  assert.match(queries[1], /NOT EXISTS \(/);
  assert.match(queries[1], /moved_from_date = source\.scheduled_date/);
});
