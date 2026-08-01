import assert from "node:assert/strict";
import test from "node:test";
import { PostgresEventRepository } from "../server/postgres-event-repository.ts";

test("event create casts date and time parameters", async () => {
  let capturedQuery = "";
  let capturedParams: unknown[] = [];
  const occurredAt = new Date("2026-07-12T10:00:00.000Z");
  const sql = {
    async query(query: string, params: unknown[]) {
      capturedQuery = query;
      capturedParams = params;

      return [
        {
          id: "event-1",
          user_id: "user-1",
          group_id: null,
          group_name: null,
          title: "Visa appointment",
          description: "Bring documents.",
          start_date: "2026-07-22",
          end_date: null,
          estimated_duration_hours: "1.25",
          location: "Office",
          created_at: occurredAt,
          updated_at: occurredAt,
          deleted_at: null,
          rule_id: "event-1-rule",
          rule_type: "once",
          scheduled_time: "09:30:00",
          weekday: null,
          timezone: "UTC",
          rule_created_at: occurredAt,
          rule_updated_at: occurredAt,
        },
      ];
    },
  };
  const repository = new PostgresEventRepository(sql as never);

  const result = await repository.createEvent({
    userId: "user-1",
    groupId: null,
    title: "Visa appointment",
    description: "Bring documents.",
    startDate: "2026-07-22",
    endDate: null,
    estimatedDurationHours: 1.25,
    location: "Office",
    rule: {
      ruleType: "once",
      scheduledTime: "09:30",
      weekday: null,
      timezone: "UTC",
    },
    occurredAt,
  });

  assert.equal(result.rule.scheduledTime, "09:30");
  assert.equal(result.estimatedDurationHours, 1.25);
  assert.match(capturedQuery, /\$4::date/);
  assert.match(capturedQuery, /\$9::time/);
  assert.deepEqual(capturedParams, [
    "user-1",
    "Visa appointment",
    "Bring documents.",
    "2026-07-22",
    null,
    1.25,
    "Office",
    "once",
    "09:30",
    null,
    "UTC",
    occurredAt,
    null,
  ]);
});

test("event instance list for date filters by owner and date", async () => {
  let capturedQuery = "";
  let capturedParams: unknown[] = [];
  const sql = {
    async query(query: string, params: unknown[]) {
      capturedQuery = query;
      capturedParams = params;

      return [];
    },
  };
  const repository = new PostgresEventRepository(sql as never);

  await repository.listEventInstancesForDate("user-1", "2026-07-22");

  assert.match(capturedQuery, /event_instances\.user_id = \$1/);
  assert.match(capturedQuery, /scheduled_date = \$2::date/);
  assert.match(capturedQuery, /ORDER BY event_instances\.scheduled_time ASC/);
  assert.deepEqual(capturedParams, ["user-1", "2026-07-22"]);
});

test("event delete writes deleted_at", async () => {
  let capturedQuery = "";
  const occurredAt = new Date("2026-07-12T10:00:00.000Z");
  const sql = {
    async query(query: string) {
      capturedQuery = query;

      return [{ id: "event-1" }];
    },
  };
  const repository = new PostgresEventRepository(sql as never);

  assert.equal(
    await repository.deleteEvent({
      userId: "user-1",
      eventId: "event-1",
      occurredAt,
    }),
    true,
  );
  assert.match(capturedQuery, /\bdeleted_at\b/);
  assert.doesNotMatch(capturedQuery, /DELETE FROM events/);
});
