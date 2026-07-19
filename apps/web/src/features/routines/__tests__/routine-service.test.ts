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
    title: input.title,
    description: input.description ?? `${input.title} description`,
    firstStartDate: input.firstStartDate ?? "2026-07-01",
    endDate: input.endDate ?? null,
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
});

test("monthly by date supports yearly renewal intervals", async () => {
  const repository = new InMemoryRoutineRepository({
    routines: [
      routine({
        id: "routine-1",
        title: "Yearly bill",
        firstStartDate: "2025-07-12",
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

test("complete, skip, and reopen update routine instance status", async () => {
  const instance: RoutineInstanceRecord = {
    id: "instance-1",
    userId,
    routineId: "routine-1",
    title: "Morning check",
    description: "Morning check description",
    scheduledDate: "2026-07-12",
    scheduledTime: "08:00",
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
