import assert from "node:assert/strict";
import test from "node:test";
import {
  InMemoryEventRepository,
  type EventRecord,
} from "../server/event-repository.ts";
import { createEventService } from "../server/event-service.ts";

const userId = "user-1";
const otherUserId = "user-2";
const now = new Date("2026-07-21T10:00:00.000Z");

function event(
  input: Partial<EventRecord> & Pick<EventRecord, "id" | "title">,
): EventRecord {
  return {
    id: input.id,
    userId: input.userId ?? userId,
    title: input.title,
    description: input.description ?? `${input.title} description`,
    eventDate: input.eventDate ?? "2026-07-22",
    eventTime: input.eventTime ?? "09:00",
    estimatedDurationHours: input.estimatedDurationHours ?? null,
    location: input.location ?? null,
    createdAt: input.createdAt ?? new Date("2026-07-01T00:00:00.000Z"),
    updatedAt: input.updatedAt ?? new Date("2026-07-01T00:00:00.000Z"),
    deletedAt: input.deletedAt ?? null,
  };
}

test("lists non-deleted events in date, time, and created order", async () => {
  const repository = new InMemoryEventRepository({
    events: [
      event({
        id: "event-3",
        title: "Later created first",
        eventDate: "2026-07-22",
        eventTime: "09:00",
        createdAt: new Date("2026-07-01T00:02:00.000Z"),
      }),
      event({
        id: "event-2",
        title: "Earlier created second",
        eventDate: "2026-07-22",
        eventTime: "09:00",
        createdAt: new Date("2026-07-01T00:01:00.000Z"),
      }),
      event({
        id: "event-1",
        title: "Earlier day",
        eventDate: "2026-07-21",
        eventTime: "20:00",
      }),
      event({
        id: "event-deleted",
        title: "Deleted",
        deletedAt: now,
      }),
    ],
  });
  const service = createEventService({ events: repository, now: () => now });

  const events = await service.listEvents(userId);

  assert.deepEqual(events.map((item) => item.id), [
    "event-1",
    "event-2",
    "event-3",
  ]);
});

test("saves, updates, and soft deletes an event", async () => {
  const repository = new InMemoryEventRepository();
  const service = createEventService({ events: repository, now: () => now });

  const saved = await service.saveEvent(userId, {
    title: "Visa appointment",
    description: "Bring documents.",
    eventDate: "2026-07-22",
    eventTime: "09:30",
    estimatedDurationHours: 1.5,
    location: "Office",
  });

  assert.equal(saved?.title, "Visa appointment");
  assert.equal(saved?.eventTime, "09:30");
  assert.equal(saved?.estimatedDurationHours, 1.5);

  const updated = await service.saveEvent(userId, {
    eventId: saved?.id,
    title: "Updated appointment",
    description: null,
    eventDate: "2026-07-23",
    eventTime: "10:00",
    estimatedDurationHours: null,
    location: null,
  });

  assert.equal(updated?.title, "Updated appointment");
  assert.equal(updated?.description, null);
  assert.equal(await service.deleteEvent(userId, saved?.id ?? ""), true);
  assert.equal((await service.listEvents(userId)).length, 0);
});

test("ownership prevents cross-user event reads and mutations", async () => {
  const repository = new InMemoryEventRepository({
    events: [
      event({
        id: "event-1",
        title: "Owned event",
      }),
    ],
  });
  const service = createEventService({ events: repository, now: () => now });

  assert.deepEqual(await service.listEvents(otherUserId), []);
  assert.equal(
    await service.saveEvent(otherUserId, {
      eventId: "event-1",
      title: "Cross-user update",
      description: null,
      eventDate: "2026-07-22",
      eventTime: "09:30",
      estimatedDurationHours: null,
      location: null,
    }),
    null,
  );
  assert.equal(await service.deleteEvent(otherUserId, "event-1"), false);
  assert.equal((await service.listEvents(userId))[0]?.title, "Owned event");
});

test("today events use the local scheduled board date", async () => {
  const occurredAt = new Date("2026-07-21T17:30:00.000Z");
  const repository = new InMemoryEventRepository({
    events: [
      event({
        id: "event-1",
        title: "Previous board day",
        eventDate: "2026-07-21",
        eventTime: "22:00",
      }),
      event({
        id: "event-2",
        title: "Calendar day after midnight",
        eventDate: "2026-07-22",
        eventTime: "01:00",
      }),
    ],
  });
  const service = createEventService({
    events: repository,
    now: () => occurredAt,
  });

  const events = await service.listTodayEvents(userId, "Australia/Sydney");

  assert.deepEqual(events.map((item) => item.title), ["Previous board day"]);
});
