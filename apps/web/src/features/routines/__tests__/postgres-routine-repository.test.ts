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
          remind_at: "2026-07-12T07:30:00.000Z",
          reminded_at: null,
          moved_at: null,
          moved_from_date: null,
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

test("lists pending routine instances by reminder window", async () => {
  let capturedQuery = "";
  const occurredAt = new Date("2026-07-12T07:35:00.000Z");
  const sql = {
    async query(query: string) {
      capturedQuery = query;

      return [];
    },
  };
  const repository = new PostgresRoutineRepository(sql as never);

  await repository.listPendingRoutineInstancesForReminderWindow({
    occurredAt,
    windowMinutes: 25,
  });

  assert.match(capturedQuery, /routine_instances\.remind_at <= \$1::timestamptz/);
  assert.match(capturedQuery, /routine_instances\.reminded_at IS NULL/);
  assert.match(capturedQuery, /routine_instances\.status = 'pending'/);
});

test("mark routine instance reminded writes reminded_at", async () => {
  let capturedQuery = "";
  const remindedAt = new Date("2026-07-12T07:35:00.000Z");
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
          remind_at: "2026-07-12T07:30:00.000Z",
          reminded_at: remindedAt,
          moved_at: null,
          moved_from_date: null,
          status: "pending",
          completed_at: null,
          skipped_at: null,
          created_at: remindedAt,
          updated_at: remindedAt,
        },
      ];
    },
  };
  const repository = new PostgresRoutineRepository(sql as never);

  const result = await repository.markRoutineInstanceReminded({
    userId: "user-1",
    instanceId: "instance-1",
    remindedAt,
  });

  assert.deepEqual(result?.remindedAt, remindedAt);
  assert.match(capturedQuery, /reminded_at = \$3::timestamptz/);
});

test("routine delete writes deleted_at instead of lifecycle status", async () => {
  let capturedQuery = "";
  const occurredAt = new Date("2026-07-12T10:00:00.000Z");
  const sql = ((strings: TemplateStringsArray) => {
    capturedQuery = strings.join("?");

    return Promise.resolve([{ id: "routine-1" }]);
  }) as {
    (strings: TemplateStringsArray, ...values: unknown[]): Promise<unknown[]>;
    query: (query: string) => Promise<unknown[]>;
  };

  sql.query = async () => [];

  const repository = new PostgresRoutineRepository(sql as never);

  assert.equal(
    await repository.deleteRoutine({
      userId: "user-1",
      routineId: "routine-1",
      occurredAt,
    }),
    true,
  );
  assert.match(capturedQuery, /\bdeleted_at\b/);
  assert.doesNotMatch(capturedQuery, /SET status/);
});
