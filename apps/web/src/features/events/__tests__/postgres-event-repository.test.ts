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

test("event instance update casts schedule fields and guards ownership", async () => {
  let capturedQuery = "";
  let capturedParams: unknown[] = [];
  const occurredAt = new Date("2026-07-12T10:00:00.000Z");
  const sql = {
    async query(query: string, params: unknown[]) {
      capturedQuery = query;
      capturedParams = params;

      return [
        {
          id: "instance-1",
          user_id: "user-1",
          event_id: "event-1",
          title: "Visa appointment",
          description: "Bring documents.",
          rule_date: "2026-07-22",
          rule_time: "09:00:00",
          scheduled_date: "2026-07-23",
          scheduled_time: "10:30:00",
          estimated_duration_hours: "1.25",
          location: "Office",
          location_override: "Room 2",
          status: "scheduled",
          canceled_at: null,
          cancellation_reason: null,
          rescheduled_at: occurredAt,
          reschedule_reason: "Teacher request",
          created_at: occurredAt,
          updated_at: occurredAt,
        },
      ];
    },
  };
  const repository = new PostgresEventRepository(sql as never);

  const result = await repository.updateEventInstance({
    userId: "user-1",
    instanceId: "instance-1",
    scheduledDate: "2026-07-23",
    scheduledTime: "10:30",
    locationOverride: "Room 2",
    rescheduleReason: "Teacher request",
    occurredAt,
  });

  assert.equal(result?.scheduledDate, "2026-07-23");
  assert.equal(result?.scheduledTime, "10:30");
  assert.equal(result?.effectiveLocation, "Room 2");
  assert.match(capturedQuery, /scheduled_date = \$3::date/);
  assert.match(capturedQuery, /scheduled_time = \$4::time/);
  assert.match(capturedQuery, /event_instances\.event_id/);
  assert.match(capturedQuery, /events\.deleted_at IS NULL/);
  assert.deepEqual(capturedParams, [
    "user-1",
    "instance-1",
    "2026-07-23",
    "10:30",
    "Room 2",
    "Teacher request",
    occurredAt,
  ]);
});

test("event instance cancel updates only active scheduled instances", async () => {
  let capturedQuery = "";
  let capturedParams: unknown[] = [];
  const occurredAt = new Date("2026-07-12T10:00:00.000Z");
  const sql = {
    async query(query: string, params: unknown[]) {
      capturedQuery = query;
      capturedParams = params;

      return [
        {
          id: "instance-1",
          user_id: "user-1",
          event_id: "event-1",
          title: "Visa appointment",
          description: "Bring documents.",
          rule_date: "2026-07-22",
          rule_time: "09:00:00",
          scheduled_date: "2026-07-22",
          scheduled_time: "09:00:00",
          estimated_duration_hours: "1.25",
          location: "Office",
          location_override: null,
          status: "canceled",
          canceled_at: occurredAt,
          cancellation_reason: "Class canceled",
          rescheduled_at: null,
          reschedule_reason: null,
          created_at: occurredAt,
          updated_at: occurredAt,
        },
      ];
    },
  };
  const repository = new PostgresEventRepository(sql as never);

  const result = await repository.cancelEventInstance({
    userId: "user-1",
    instanceId: "instance-1",
    cancellationReason: "Class canceled",
    occurredAt,
  });

  assert.equal(result?.status, "canceled");
  assert.deepEqual(result?.canceledAt, occurredAt);
  assert.match(capturedQuery, /status = 'scheduled'/);
  assert.match(capturedQuery, /events\.deleted_at IS NULL/);
  assert.deepEqual(capturedParams, [
    "user-1",
    "instance-1",
    "Class canceled",
    occurredAt,
  ]);
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
