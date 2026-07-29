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
          title: "Visa appointment",
          description: "Bring documents.",
          event_date: "2026-07-22",
          event_time: "09:30:00",
          estimated_duration_hours: "1.25",
          location: "Office",
          created_at: occurredAt,
          updated_at: occurredAt,
          deleted_at: null,
        },
      ];
    },
  };
  const repository = new PostgresEventRepository(sql as never);

  const result = await repository.createEvent({
    userId: "user-1",
    title: "Visa appointment",
    description: "Bring documents.",
    eventDate: "2026-07-22",
    eventTime: "09:30",
    estimatedDurationHours: 1.25,
    location: "Office",
    occurredAt,
  });

  assert.equal(result.eventTime, "09:30");
  assert.equal(result.estimatedDurationHours, 1.25);
  assert.match(capturedQuery, /\$4::date/);
  assert.match(capturedQuery, /\$5::time/);
  assert.deepEqual(capturedParams, [
    "user-1",
    "Visa appointment",
    "Bring documents.",
    "2026-07-22",
    "09:30",
    1.25,
    "Office",
    occurredAt,
  ]);
});

test("event list for date filters by owner and date", async () => {
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

  await repository.listEventsForDate("user-1", "2026-07-22");

  assert.match(capturedQuery, /WHERE user_id = \$1/);
  assert.match(capturedQuery, /event_date = \$2::date/);
  assert.match(capturedQuery, /ORDER BY event_time ASC, created_at ASC/);
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
