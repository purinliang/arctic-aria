import assert from "node:assert/strict";
import test from "node:test";
import { PostgresRoutineRepository } from "../server/postgres-routine-repository.ts";

test("complete routine instance casts timestamp parameters in postgres query", async () => {
  let capturedQuery = "";
  const occurredAt = new Date("2026-07-12T10:00:00.000Z");
  const sql = {
    async query(query: string) {
      capturedQuery = query;

      return [
        {
          id: "instance-1",
          user_id: "user-1",
          routine_id: "routine-1",
          title: "Routine",
          description: "Description",
          scheduled_date: "2026-07-12",
          scheduled_time: "08:00",
          status: "completed",
          completed_at: occurredAt,
          skipped_at: null,
          created_at: occurredAt,
          updated_at: occurredAt,
        },
      ];
    },
  };
  const repository = new PostgresRoutineRepository(sql as never);

  const result = await repository.completeRoutineInstance({
    userId: "user-1",
    instanceId: "instance-1",
    occurredAt,
  });

  assert.equal(result?.status, "completed");
  assert.match(capturedQuery, /\$4::timestamptz/);
  assert.match(capturedQuery, /\$3::text/);
});
