import assert from "node:assert/strict";
import test from "node:test";
import {
  InMemoryRoutineRepository,
  type RoutineInstanceRecord,
  type RoutineRecord,
} from "../server/routine-repository.ts";
import { createRoutineService } from "../server/routine-service.ts";

const userId = "user-1";
const now = new Date("2026-07-12T10:00:00.000Z");

function routine(input: Partial<RoutineRecord> & Pick<RoutineRecord, "id" | "title">): RoutineRecord {
  return {
    id: input.id,
    userId,
    groupId: input.groupId ?? null,
    groupName: input.groupName ?? null,
    title: input.title,
    description: input.description ?? `${input.title} description`,
    startDate: input.startDate ?? "2026-07-01",
    endDate: input.endDate ?? null,
    estimatedDurationMinutes: input.estimatedDurationMinutes ?? null,
    createdAt: input.createdAt ?? new Date("2026-07-01T00:00:00.000Z"),
    updatedAt: input.updatedAt ?? new Date("2026-07-01T00:00:00.000Z"),
    deletedAt: input.deletedAt ?? null,
    rule: input.rule ?? {
      id: `${input.id}-rule`,
      routineId: input.id,
      ruleType: "daily",
      intervalValue: null,
      weekdays: null,
      dayOfMonth: null,
      preferredTime: "08:00",
      timezone: "UTC",
      createdAt: new Date("2026-07-01T00:00:00.000Z"),
      updatedAt: new Date("2026-07-01T00:00:00.000Z"),
    },
  };
}

test("generates today's daily routine instance", async () => {
  const repository = new InMemoryRoutineRepository({
    routines: [
      routine({
        id: "routine-1",
        title: "Morning check",
      }),
    ],
  });
  const service = createRoutineService({
    routines: repository,
    now: () => now,
  });

  const instances = await service.listTodayRoutineInstances(userId);

  assert.equal(instances.length, 1);
  assert.equal(instances[0].title, "Morning check");
  assert.equal(instances[0].scheduledDate, "2026-07-12");
  assert.equal(instances[0].scheduledTime, "08:00");
  assert.deepEqual(
    instances[0].remindAt,
    new Date("2026-07-12T07:30:00.000Z"),
  );
});

test("generates a once routine only on the start date", async () => {
  const repository = new InMemoryRoutineRepository({
    routines: [
      routine({
        id: "routine-1",
        title: "One-time check",
        startDate: "2026-07-12",
        rule: {
          id: "routine-1-rule",
          routineId: "routine-1",
          ruleType: "once",
          intervalValue: null,
          weekdays: null,
          dayOfMonth: null,
          preferredTime: "08:00",
          timezone: "UTC",
          createdAt: new Date("2026-07-01T00:00:00.000Z"),
          updatedAt: new Date("2026-07-01T00:00:00.000Z"),
        },
      }),
    ],
  });
  const service = createRoutineService({
    routines: repository,
    now: () => now,
  });

  const instances = await service.listTodayRoutineInstances(userId);

  assert.equal(instances.length, 1);
  assert.equal(instances[0].title, "One-time check");

  const nextDayService = createRoutineService({
    routines: repository,
    now: () => new Date("2026-07-13T10:00:00.000Z"),
  });

  assert.equal((await nextDayService.listTodayRoutineInstances(userId)).length, 0);
});

test("generates today's routine instance using the routine timezone", async () => {
  const occurredAt = new Date("2026-07-21T23:30:00.000Z");
  const repository = new InMemoryRoutineRepository({
    routines: [
      routine({
        id: "routine-1",
        title: "Local morning check",
        startDate: "2026-07-22",
        rule: {
          id: "routine-1-rule",
          routineId: "routine-1",
          ruleType: "daily",
          intervalValue: null,
          weekdays: null,
          dayOfMonth: null,
          preferredTime: "10:00",
          timezone: "Australia/Sydney",
          createdAt: new Date("2026-07-21T00:00:00.000Z"),
          updatedAt: new Date("2026-07-21T00:00:00.000Z"),
        },
      }),
    ],
  });
  const service = createRoutineService({
    routines: repository,
    now: () => occurredAt,
  });

  const instances = await service.listTodayRoutineInstances(userId);

  assert.equal(instances.length, 1);
  assert.equal(instances[0].title, "Local morning check");
  assert.equal(instances[0].scheduledDate, "2026-07-22");
  assert.deepEqual(
    instances[0].remindAt,
    new Date("2026-07-21T23:30:00.000Z"),
  );
});

test("keeps routine instances on the previous scheduled day before 04:00", async () => {
  const occurredAt = new Date("2026-07-21T17:30:00.000Z");
  const repository = new InMemoryRoutineRepository({
    routines: [
      routine({
        id: "routine-1",
        title: "Previous scheduled day",
        startDate: "2026-07-21",
        rule: {
          id: "routine-1-rule",
          routineId: "routine-1",
          ruleType: "daily",
          intervalValue: null,
          weekdays: null,
          dayOfMonth: null,
          preferredTime: "10:00",
          timezone: "Australia/Sydney",
          createdAt: new Date("2026-07-21T00:00:00.000Z"),
          updatedAt: new Date("2026-07-21T00:00:00.000Z"),
        },
      }),
      routine({
        id: "routine-2",
        title: "New calendar day",
        startDate: "2026-07-22",
        rule: {
          id: "routine-2-rule",
          routineId: "routine-2",
          ruleType: "daily",
          intervalValue: null,
          weekdays: null,
          dayOfMonth: null,
          preferredTime: "10:00",
          timezone: "Australia/Sydney",
          createdAt: new Date("2026-07-21T00:00:00.000Z"),
          updatedAt: new Date("2026-07-21T00:00:00.000Z"),
        },
      }),
    ],
  });
  const service = createRoutineService({
    routines: repository,
    now: () => occurredAt,
  });

  const instances = await service.listTodayRoutineInstances(userId);

  assert.deepEqual(
    instances.map((instance) => instance.title),
    ["Previous scheduled day"],
  );
  assert.equal(instances[0].scheduledDate, "2026-07-21");
});

test("saving a routine creates today's instance immediately", async () => {
  const repository = new InMemoryRoutineRepository();
  const service = createRoutineService({
    routines: repository,
    now: () => now,
  });

  await service.saveRoutine(userId, {
    groupId: null,
    title: "New morning check",
    description: "New morning check description",
    startDate: "2026-07-12",
    endDate: null,
    estimatedDurationMinutes: null,
    rule: {
      ruleType: "daily",
      intervalValue: null,
      weekdays: null,
      dayOfMonth: null,
      preferredTime: "08:00",
      timezone: "UTC",
    },
  });

  const instances = await repository.listRoutineInstancesForDate(
    userId,
    "2026-07-12",
  );

  assert.equal(instances.length, 1);
  assert.equal(instances[0].title, "New morning check");
  assert.equal(instances[0].scheduledTime, "08:00");
});

test("monthly by date supports yearly renewal intervals", async () => {
  const repository = new InMemoryRoutineRepository({
    routines: [
      routine({
        id: "routine-1",
        title: "Yearly bill",
        startDate: "2025-07-12",
        rule: {
          id: "routine-1-rule",
          routineId: "routine-1",
          ruleType: "monthly_by_date",
          intervalValue: 12,
          weekdays: null,
          dayOfMonth: 12,
          preferredTime: "09:00",
          timezone: "UTC",
          createdAt: new Date("2025-07-01T00:00:00.000Z"),
          updatedAt: new Date("2025-07-01T00:00:00.000Z"),
        },
      }),
    ],
  });
  const service = createRoutineService({
    routines: repository,
    now: () => now,
  });

  const instances = await service.listTodayRoutineInstances(userId);

  assert.equal(instances.length, 1);
  assert.equal(instances[0].title, "Yearly bill");
});

test("reuses legacy no-time routine instances for fallback time", async () => {
  const instance: RoutineInstanceRecord = {
    id: "instance-1",
    userId,
    routineId: "routine-1",
    title: "Flexible check",
    description: "Flexible check description",
    scheduledDate: "2026-07-12",
    scheduledTime: null,
    remindAt: null,
    remindedAt: null,
    movedAt: null,
    movedFromDate: null,
    status: "pending",
    completedAt: null,
    skippedAt: null,
    createdAt: new Date("2026-07-12T00:00:00.000Z"),
    updatedAt: new Date("2026-07-12T00:00:00.000Z"),
  };
  const repository = new InMemoryRoutineRepository({
    routines: [
      routine({
        id: "routine-1",
        title: "Flexible check",
        rule: {
          id: "routine-1-rule",
          routineId: "routine-1",
          ruleType: "daily",
          intervalValue: null,
          weekdays: null,
          dayOfMonth: null,
          preferredTime: null,
          timezone: "UTC",
          createdAt: new Date("2026-07-01T00:00:00.000Z"),
          updatedAt: new Date("2026-07-01T00:00:00.000Z"),
        },
      }),
    ],
    instances: [instance],
  });
  const service = createRoutineService({
    routines: repository,
    now: () => now,
  });

  const instances = await service.listTodayRoutineInstances(userId);

  assert.equal(instances.length, 1);
  assert.equal(instances[0].id, "instance-1");
  assert.equal(instances[0].scheduledTime, null);
  assert.deepEqual(
    instances[0].remindAt,
    new Date("2026-07-12T17:30:00.000Z"),
  );
});

test("deleted routines do not generate instances", async () => {
  const repository = new InMemoryRoutineRepository({
    routines: [
      routine({
        id: "routine-1",
        title: "Deleted routine",
        deletedAt: now,
      }),
    ],
  });
  const service = createRoutineService({
    routines: repository,
    now: () => now,
  });

  const instances = await service.listTodayRoutineInstances(userId);

  assert.equal(instances.length, 0);
});

test("today routine instances are limited to six visible rows", async () => {
  const repository = new InMemoryRoutineRepository({
    routines: Array.from({ length: 8 }, (_, index) =>
      routine({
        id: `routine-${index + 1}`,
        title: `Routine ${index + 1}`,
        rule: {
          id: `routine-${index + 1}-rule`,
          routineId: `routine-${index + 1}`,
          ruleType: "daily",
          intervalValue: null,
          weekdays: null,
          dayOfMonth: null,
          preferredTime: `08:${String(index).padStart(2, "0")}`,
          timezone: "UTC",
          createdAt: new Date("2026-07-01T00:00:00.000Z"),
          updatedAt: new Date("2026-07-01T00:00:00.000Z"),
        },
      }),
    ),
  });
  const service = createRoutineService({
    routines: repository,
    now: () => now,
  });

  const instances = await service.listTodayRoutineInstances(userId);

  assert.deepEqual(
    instances.map((instance) => instance.title),
    [
      "Routine 1",
      "Routine 2",
      "Routine 3",
      "Routine 4",
      "Routine 5",
      "Routine 6",
    ],
  );
});

test("complete, skip, and reopen update routine instance status", async () => {
  const instance: RoutineInstanceRecord = {
    id: "instance-1",
    userId,
    routineId: "routine-1",
    title: "Morning check",
    description: "Morning check description",
    scheduledDate: "2026-07-12",
    scheduledTime: "08:00",
    remindAt: new Date("2026-07-12T07:30:00.000Z"),
    remindedAt: null,
    movedAt: null,
    movedFromDate: null,
    status: "pending",
    completedAt: null,
    skippedAt: null,
    createdAt: new Date("2026-07-12T00:00:00.000Z"),
    updatedAt: new Date("2026-07-12T00:00:00.000Z"),
  };
  const repository = new InMemoryRoutineRepository({
    routines: [
      routine({
        id: "routine-1",
        title: "Morning check",
      }),
    ],
    instances: [instance],
  });
  const service = createRoutineService({
    routines: repository,
    now: () => now,
  });

  const completed = await service.completeRoutineInstance(userId, "instance-1");

  assert.equal(completed?.status, "completed");
  assert.deepEqual(completed?.completedAt, now);
  assert.equal(completed?.skippedAt, null);

  const skipped = await service.skipRoutineInstance(userId, "instance-1");

  assert.equal(skipped?.status, "skipped");
  assert.equal(skipped?.completedAt, null);
  assert.deepEqual(skipped?.skippedAt, now);

  const reopened = await service.reopenRoutineInstance(userId, "instance-1");

  assert.equal(reopened?.status, "pending");
  assert.equal(reopened?.completedAt, null);
  assert.equal(reopened?.skippedAt, null);
});

test("completed routine instances stay visible for today", async () => {
  const instance: RoutineInstanceRecord = {
    id: "instance-1",
    userId,
    routineId: "routine-1",
    title: "Morning check",
    description: "Morning check description",
    scheduledDate: "2026-07-12",
    scheduledTime: "08:00",
    remindAt: new Date("2026-07-12T07:30:00.000Z"),
    remindedAt: null,
    movedAt: null,
    movedFromDate: null,
    status: "completed",
    completedAt: new Date("2026-07-12T09:00:00.000Z"),
    skippedAt: null,
    createdAt: new Date("2026-07-12T00:00:00.000Z"),
    updatedAt: new Date("2026-07-12T09:00:00.000Z"),
  };
  const repository = new InMemoryRoutineRepository({
    routines: [
      routine({
        id: "routine-1",
        title: "Morning check",
      }),
    ],
    instances: [instance],
  });
  const service = createRoutineService({
    routines: repository,
    now: () => now,
  });

  const instances = await service.listTodayRoutineInstances(userId);

  assert.equal(instances.length, 1);
  assert.equal(instances[0].id, "instance-1");
  assert.equal(instances[0].status, "completed");
});
