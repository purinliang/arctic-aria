import assert from "node:assert/strict";
import test from "node:test";
import { listPostgresDashboardTasks } from "../server/postgres-project-dashboard-queries.ts";
import type { NeonQueryFunction } from "@neondatabase/serverless";

test("Postgres dashboard task query returns newly inserted selections", async () => {
  let capturedQuery = "";
  const sql = {
    query: async (query: string) => {
      capturedQuery = query;
      return [];
    },
  } as unknown as NeonQueryFunction<false, false>;

  await listPostgresDashboardTasks(sql, {
    userId: "00000000-0000-0000-0000-000000000001",
    today: "2026-07-22",
    occurredAt: new Date("2026-07-22T10:00:00.000Z"),
  });

  assert.match(capturedQuery, /RETURNING task_id, created_at/);
  assert.match(capturedQuery, /UNION ALL\s+SELECT\s+inserted_selections\.task_id/s);
});
