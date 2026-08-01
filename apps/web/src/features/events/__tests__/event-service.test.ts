import assert from "node:assert/strict";
import test from "node:test";
import {
  InMemoryEventRepository,
  type EventInstanceRecord,
  type EventRecord,
} from "../server/event-repository.ts";
import {
  createEventService,
  nextEventOccurrenceDates,
} from "../server/event-service.ts";

const userId = "user-1";
const otherUserId = "user-2";
const now = new Date("2026-07-21T10:00:00.000Z");

function event(
  input: Partial<EventRecord> & Pick<EventRecord, "id" | "title">,
): EventRecord {
  return {
    id: input.id,
    userId: input.userId ?? userId,
    groupId: input.groupId ?? null,
    groupName: input.groupName ?? null,
    title: input.title,
    description: input.description ?? `${input.title} description`,
    startDate: input.startDate ?? "2026-07-22",
    endDate: input.endDate ?? null,
    estimatedDurationHours: input.estimatedDurationHours ?? null,
    location: input.location ?? null,
    createdAt: input.createdAt ?? new Date("2026-07-01T00:00:00.000Z"),
    updatedAt: input.updatedAt ?? new Date("2026-07-01T00:00:00.000Z"),
    deletedAt: input.deletedAt ?? null,
    rule: input.rule ?? {
      id: `${input.id}-rule`,
      eventId: input.id,
      ruleType: "once",
      scheduledTime: "09:00",
      weekday: null,
      timezone: "UTC",
      createdAt: new Date("2026-07-01T00:00:00.000Z"),
      updatedAt: new Date("2026-07-01T00:00:00.000Z"),
    },
  };
}

function eventInstance(
  input: Partial<EventInstanceRecord> &
    Pick<EventInstanceRecord, "id" | "eventId">,
): EventInstanceRecord {
  return {
    id: input.id,
    userId: input.userId ?? userId,
    eventId: input.eventId,
    title: input.title ?? "Visa appointment",
    description: input.description ?? "Bring documents.",
    ruleDate: input.ruleDate ?? "2026-07-22",
    ruleTime: input.ruleTime ?? "09:00",
    scheduledDate: input.scheduledDate ?? "2026-07-22",
    scheduledTime: input.scheduledTime ?? "09:00",
    estimatedDurationHours: input.estimatedDurationHours ?? null,
    location: input.location ?? "Office",
    locationOverride: input.locationOverride ?? null,
    effectiveLocation:
      input.effectiveLocation ?? input.locationOverride ?? input.location ?? "Office",
    status: input.status ?? "scheduled",
    canceledAt: input.canceledAt ?? null,
    cancellationReason: input.cancellationReason ?? null,
    rescheduledAt: input.rescheduledAt ?? null,
    rescheduleReason: input.rescheduleReason ?? null,
    createdAt: input.createdAt ?? new Date("2026-07-01T00:00:00.000Z"),
    updatedAt: input.updatedAt ?? new Date("2026-07-01T00:00:00.000Z"),
  };
}

test("lists non-deleted events in date, time, and created order", async () => {
  const repository = new InMemoryEventRepository({
    events: [
      event({
        id: "event-3",
        title: "Later created first",
        startDate: "2026-07-22",
        createdAt: new Date("2026-07-01T00:02:00.000Z"),
      }),
      event({
        id: "event-2",
        title: "Earlier created second",
        startDate: "2026-07-22",
        createdAt: new Date("2026-07-01T00:01:00.000Z"),
      }),
      event({
        id: "event-1",
        title: "Earlier day",
        startDate: "2026-07-21",
        rule: {
          id: "event-1-rule",
          eventId: "event-1",
          ruleType: "once",
          scheduledTime: "20:00",
          weekday: null,
          timezone: "UTC",
          createdAt: new Date("2026-07-01T00:00:00.000Z"),
          updatedAt: new Date("2026-07-01T00:00:00.000Z"),
        },
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
    groupId: null,
    startDate: "2026-07-22",
    endDate: null,
    estimatedDurationHours: 1.5,
    location: "Office",
    rule: {
      ruleType: "once",
      scheduledTime: "09:30",
      weekday: null,
      timezone: "UTC",
    },
  });

  assert.equal(saved?.title, "Visa appointment");
  assert.equal(saved?.rule.scheduledTime, "09:30");
  assert.equal(saved?.estimatedDurationHours, 1.5);

  const updated = await service.saveEvent(userId, {
    eventId: saved?.id,
    title: "Updated appointment",
    description: null,
    groupId: null,
    startDate: "2026-07-23",
    endDate: null,
    estimatedDurationHours: null,
    location: null,
    rule: {
      ruleType: "once",
      scheduledTime: "10:00",
      weekday: null,
      timezone: "UTC",
    },
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
      groupId: null,
      startDate: "2026-07-22",
      endDate: null,
      estimatedDurationHours: null,
      location: null,
      rule: {
        ruleType: "once",
        scheduledTime: "09:30",
        weekday: null,
        timezone: "UTC",
      },
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
        startDate: "2026-07-21",
        rule: {
          id: "event-1-rule",
          eventId: "event-1",
          ruleType: "once",
          scheduledTime: "22:00",
          weekday: null,
          timezone: "Australia/Sydney",
          createdAt: new Date("2026-07-01T00:00:00.000Z"),
          updatedAt: new Date("2026-07-01T00:00:00.000Z"),
        },
      }),
      event({
        id: "event-2",
        title: "Calendar day after midnight",
        startDate: "2026-07-22",
        rule: {
          id: "event-2-rule",
          eventId: "event-2",
          ruleType: "once",
          scheduledTime: "01:00",
          weekday: null,
          timezone: "Australia/Sydney",
          createdAt: new Date("2026-07-01T00:00:00.000Z"),
          updatedAt: new Date("2026-07-01T00:00:00.000Z"),
        },
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

test("event recurrence dates are generated with a three-instance limit", () => {
  assert.deepEqual(
    nextEventOccurrenceDates({
      event: event({
        id: "daily-event",
        title: "Daily tutorial",
        startDate: "2026-07-20",
        rule: {
          id: "daily-event-rule",
          eventId: "daily-event",
          ruleType: "daily",
          scheduledTime: "09:00",
          weekday: null,
          timezone: "UTC",
          createdAt: new Date("2026-07-01T00:00:00.000Z"),
          updatedAt: new Date("2026-07-01T00:00:00.000Z"),
        },
      }),
      fromDate: "2026-07-21",
    }),
    ["2026-07-21", "2026-07-22", "2026-07-23"],
  );

  assert.deepEqual(
    nextEventOccurrenceDates({
      event: event({
        id: "weekly-event",
        title: "Weekly tutorial",
        startDate: "2026-07-20",
        rule: {
          id: "weekly-event-rule",
          eventId: "weekly-event",
          ruleType: "weekly",
          scheduledTime: "14:00",
          weekday: 1,
          timezone: "UTC",
          createdAt: new Date("2026-07-01T00:00:00.000Z"),
          updatedAt: new Date("2026-07-01T00:00:00.000Z"),
        },
      }),
      fromDate: "2026-07-21",
    }),
    ["2026-07-27", "2026-08-03", "2026-08-10"],
  );
});

test("listEventInstances tops up active events without duplicates", async () => {
  const repository = new InMemoryEventRepository({
    events: [
      event({
        id: "event-1",
        title: "Daily class",
        startDate: "2026-07-20",
        rule: {
          id: "event-1-rule",
          eventId: "event-1",
          ruleType: "daily",
          scheduledTime: "09:00",
          weekday: null,
          timezone: "UTC",
          createdAt: new Date("2026-07-01T00:00:00.000Z"),
          updatedAt: new Date("2026-07-01T00:00:00.000Z"),
        },
      }),
    ],
  });
  const service = createEventService({ events: repository, now: () => now });

  const firstLoad = await service.listEventInstances(userId, "UTC");
  const secondLoad = await service.listEventInstances(userId, "UTC");

  assert.deepEqual(
    firstLoad.map((instance) => instance.scheduledDate),
    ["2026-07-21", "2026-07-22", "2026-07-23"],
  );
  assert.deepEqual(
    secondLoad.map((instance) => instance.scheduledDate),
    ["2026-07-21", "2026-07-22", "2026-07-23"],
  );
});

test("updates one event instance without changing the event definition", async () => {
  const repository = new InMemoryEventRepository({
    events: [
      event({
        id: "event-1",
        title: "Weekly tutorial",
        location: "Room 1",
      }),
    ],
    instances: [
      eventInstance({
        id: "instance-1",
        eventId: "event-1",
        scheduledDate: "2026-07-22",
        scheduledTime: "09:00",
        location: "Room 1",
      }),
    ],
  });
  const service = createEventService({ events: repository, now: () => now });

  const updated = await service.updateEventInstance(userId, {
    instanceId: "instance-1",
    scheduledDate: "2026-07-23",
    scheduledTime: "10:30",
    locationOverride: "Room 2",
    rescheduleReason: "Teacher request",
  });
  const [definition] = await service.listEvents(userId);

  assert.equal(updated?.scheduledDate, "2026-07-23");
  assert.equal(updated?.scheduledTime, "10:30");
  assert.equal(updated?.locationOverride, "Room 2");
  assert.equal(updated?.effectiveLocation, "Room 2");
  assert.deepEqual(updated?.rescheduledAt, now);
  assert.equal(updated?.rescheduleReason, "Teacher request");
  assert.equal(definition.location, "Room 1");
});

test("canceling one event instance hides only that occurrence", async () => {
  const repository = new InMemoryEventRepository({
    events: [
      event({
        id: "event-1",
        title: "Weekly tutorial",
      }),
    ],
    instances: [
      eventInstance({
        id: "instance-1",
        eventId: "event-1",
        scheduledDate: "2026-07-22",
      }),
      eventInstance({
        id: "instance-2",
        eventId: "event-1",
        scheduledDate: "2026-07-29",
      }),
    ],
  });
  const service = createEventService({ events: repository, now: () => now });

  const canceled = await service.cancelEventInstance(userId, {
    instanceId: "instance-1",
    cancellationReason: "Class canceled",
  });
  const remainingInstances = await service.listEventInstances(userId, "UTC");

  assert.equal(canceled?.status, "canceled");
  assert.deepEqual(canceled?.canceledAt, now);
  assert.equal(canceled?.cancellationReason, "Class canceled");
  assert.equal(
    remainingInstances.some((instance) => instance.id === "instance-1"),
    false,
  );
  assert.equal(
    remainingInstances.some((instance) => instance.id === "instance-2"),
    true,
  );
});
