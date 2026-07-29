import assert from "node:assert/strict";
import test from "node:test";
import {
  InMemoryRoutineRepository,
  type RoutineInstanceRecord,
  type RoutineRecord,
} from "../server/routine-repository.ts";
import { createRoutineReminderService } from "../server/routine-reminder-service.ts";

const userId = "user-1";
const dueAt = new Date("2026-07-12T09:30:00.000Z");

function routine(
  input: Partial<RoutineRecord> & Pick<RoutineRecord, "id" | "title">,
): RoutineRecord {
  return {
    id: input.id,
    userId: input.userId ?? userId,
    groupId: input.groupId ?? null,
    groupName: input.groupName ?? null,
    title: input.title,
    description: input.description ?? null,
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
      preferredTime: "10:00",
      timezone: "UTC",
      createdAt: new Date("2026-07-01T00:00:00.000Z"),
      updatedAt: new Date("2026-07-01T00:00:00.000Z"),
    },
  };
}

test("sends due routine reminders through Discord notification service", async () => {
  const repository = new InMemoryRoutineRepository({
    routines: [
      routine({
        id: "routine-1",
        title: "Morning check",
      }),
    ],
  });
  const notifier = createNotifierStub({ ok: true });
  const service = createRoutineReminderService({
    now: () => dueAt,
    notifier,
    routines: repository,
  });

  const result = await service.sendDueRoutineReminders();

  assert.deepEqual(result, {
    checked: 1,
    due: 1,
    sent: 1,
    skipped: 0,
    failed: 0,
  });
  assert.equal(notifier.calls.length, 1);
  assert.equal(notifier.calls[0]?.userId, userId);
  assert.match(
    String(notifier.calls[0]?.idempotencyKey),
    /^routine-reminder:[0-9a-f]{32}$/,
  );
  assert.equal(
    notifier.calls[0]?.text,
    ["### Routine Reminder", "", "- `[ ]` **Morning check**: Due at 10:00."].join(
      "\n",
    ),
  );
  assert.deepEqual(notifier.calls[0]?.metadata, {
    feature: "routines",
    action: "routine-reminder",
    routineCount: 1,
    routineIds: ["routine-1"],
    routineInstanceIds: [notifier.calls[0]?.metadata.routineInstanceId],
    scheduledDates: ["2026-07-12"],
    scheduledTimes: ["10:00"],
    remindAts: ["2026-07-12T09:30:00.000Z"],
    routineId: "routine-1",
    routineInstanceId: notifier.calls[0]?.metadata.routineInstanceId,
    scheduledDate: "2026-07-12",
    scheduledTime: "10:00",
    remindAt: "2026-07-12T09:30:00.000Z",
  });
});

test("merges due routine reminders for the same user", async () => {
  const repository = new InMemoryRoutineRepository({
    routines: [
      routine({
        id: "routine-1",
        title: "Morning check",
        description: "Review overnight notes.",
      }),
      routine({
        id: "routine-2",
        title: "Plan `demo`",
        description: "Confirm *handoff* list.",
      }),
    ],
  });
  const notifier = createNotifierStub({ ok: true });
  const service = createRoutineReminderService({
    now: () => dueAt,
    notifier,
    routines: repository,
  });

  const result = await service.sendDueRoutineReminders();

  assert.deepEqual(result, {
    checked: 2,
    due: 2,
    sent: 2,
    skipped: 0,
    failed: 0,
  });
  assert.equal(notifier.calls.length, 1);
  assert.equal(
    notifier.calls[0]?.text,
    [
      "### Routine Reminders",
      "",
      "- `[ ]` **Morning check**: Review overnight notes. Due at 10:00.",
      "- `[ ]` **Plan \\`demo\\`**: Confirm \\*handoff\\* list. Due at 10:00.",
    ].join("\n"),
  );
  assert.deepEqual(notifier.calls[0]?.metadata.routineIds, [
    "routine-1",
    "routine-2",
  ]);
  assert.equal(notifier.calls[0]?.metadata.routineCount, 2);
});

test("sends routine reminders when cron arrives two minutes early", async () => {
  const repository = new InMemoryRoutineRepository({
    routines: [
      routine({
        id: "routine-1",
        title: "Morning check",
      }),
    ],
  });
  const notifier = createNotifierStub({ ok: true });
  const service = createRoutineReminderService({
    now: () => new Date("2026-07-12T09:28:00.000Z"),
    notifier,
    routines: repository,
  });

  const result = await service.sendDueRoutineReminders();

  assert.deepEqual(result, {
    checked: 1,
    due: 1,
    sent: 1,
    skipped: 0,
    failed: 0,
  });
  assert.equal(notifier.calls.length, 1);
});

test("snaps arbitrary-minute routine reminders to the nearest cron tick", async () => {
  const repository = new InMemoryRoutineRepository({
    routines: [
      routine({
        id: "routine-1",
        title: "Odd minute check",
        rule: {
          id: "routine-1-rule",
          routineId: "routine-1",
          ruleType: "daily",
          intervalValue: null,
          weekdays: null,
          dayOfMonth: null,
          preferredTime: "10:07",
          timezone: "UTC",
          createdAt: new Date("2026-07-01T00:00:00.000Z"),
          updatedAt: new Date("2026-07-01T00:00:00.000Z"),
        },
      }),
    ],
  });
  const notifier = createNotifierStub({ ok: true });
  const service = createRoutineReminderService({
    now: () => new Date("2026-07-12T09:30:00.000Z"),
    notifier,
    routines: repository,
  });

  const result = await service.sendDueRoutineReminders();

  assert.deepEqual(result, {
    checked: 1,
    due: 1,
    sent: 1,
    skipped: 0,
    failed: 0,
  });
  assert.deepEqual(notifier.calls[0]?.metadata.remindAts, [
    "2026-07-12T09:30:00.000Z",
  ]);
});

test("skips routine reminders before the reminder window opens", async () => {
  const repository = new InMemoryRoutineRepository({
    routines: [
      routine({
        id: "routine-1",
        title: "Evening check",
        rule: {
          id: "routine-1-rule",
          routineId: "routine-1",
          ruleType: "daily",
          intervalValue: null,
          weekdays: null,
          dayOfMonth: null,
          preferredTime: "11:00",
          timezone: "UTC",
          createdAt: new Date("2026-07-01T00:00:00.000Z"),
          updatedAt: new Date("2026-07-01T00:00:00.000Z"),
        },
      }),
    ],
  });
  const notifier = createNotifierStub({ ok: true });
  const service = createRoutineReminderService({
    now: () => new Date("2026-07-12T09:20:00.000Z"),
    notifier,
    routines: repository,
  });

  const result = await service.sendDueRoutineReminders();

  assert.deepEqual(result, {
    checked: 1,
    due: 0,
    sent: 0,
    skipped: 1,
    failed: 0,
  });
  assert.equal(notifier.calls.length, 0);
});

test("skips routine reminders after the reminder window closes", async () => {
  const repository = new InMemoryRoutineRepository({
    routines: [
      routine({
        id: "routine-1",
        title: "Morning check",
      }),
    ],
  });
  const notifier = createNotifierStub({ ok: true });
  const service = createRoutineReminderService({
    now: () => new Date("2026-07-12T09:56:00.000Z"),
    notifier,
    routines: repository,
  });

  const result = await service.sendDueRoutineReminders();

  assert.deepEqual(result, {
    checked: 1,
    due: 0,
    sent: 0,
    skipped: 1,
    failed: 0,
  });
  assert.equal(notifier.calls.length, 0);
});

test("does not remind completed routine instances", async () => {
  const instance: RoutineInstanceRecord = {
    id: "instance-1",
    userId,
    routineId: "routine-1",
    title: "Morning check",
    description: null,
    scheduledDate: "2026-07-12",
    scheduledTime: "10:00",
    remindAt: dueAt,
    remindedAt: null,
    movedAt: null,
    movedFromDate: null,
    status: "completed",
    completedAt: dueAt,
    skippedAt: null,
    createdAt: dueAt,
    updatedAt: dueAt,
  };
  const repository = new InMemoryRoutineRepository({
    instances: [instance],
    routines: [
      routine({
        id: "routine-1",
        title: "Morning check",
      }),
    ],
  });
  const notifier = createNotifierStub({ ok: true });
  const service = createRoutineReminderService({
    now: () => dueAt,
    notifier,
    routines: repository,
  });

  const result = await service.sendDueRoutineReminders();

  assert.equal(result.sent, 0);
  assert.equal(result.skipped, 1);
  assert.equal(notifier.calls.length, 0);
});

test("does not remind instances that were already reminded", async () => {
  const instance: RoutineInstanceRecord = {
    id: "instance-1",
    userId,
    routineId: "routine-1",
    title: "Morning check",
    description: null,
    scheduledDate: "2026-07-12",
    scheduledTime: "10:00",
    remindAt: dueAt,
    remindedAt: dueAt,
    movedAt: null,
    movedFromDate: null,
    status: "pending",
    completedAt: null,
    skippedAt: null,
    createdAt: dueAt,
    updatedAt: dueAt,
  };
  const repository = new InMemoryRoutineRepository({
    instances: [instance],
    routines: [
      routine({
        id: "routine-1",
        title: "Morning check",
      }),
    ],
  });
  const notifier = createNotifierStub({ ok: true });
  const service = createRoutineReminderService({
    now: () => dueAt,
    notifier,
    routines: repository,
  });

  const result = await service.sendDueRoutineReminders();

  assert.equal(result.sent, 0);
  assert.equal(result.skipped, 1);
  assert.equal(notifier.calls.length, 0);
});

test("uses 18:00 as the reminder fallback when preferred time is empty", async () => {
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
  });
  const notifier = createNotifierStub({ ok: true });
  const service = createRoutineReminderService({
    now: () => new Date("2026-07-12T17:30:00.000Z"),
    notifier,
    routines: repository,
  });

  const result = await service.sendDueRoutineReminders();

  assert.equal(result.sent, 1);
  assert.equal(
    notifier.calls[0]?.text,
    ["### Routine Reminder", "", "- `[ ]` **Flexible check**: Due at 18:00."].join(
      "\n",
    ),
  );
  assert.equal(notifier.calls[0]?.metadata.scheduledTime, "18:00");
});

test("missing Discord binding skips the due reminder", async () => {
  const repository = new InMemoryRoutineRepository({
    routines: [
      routine({
        id: "routine-1",
        title: "Morning check",
      }),
    ],
  });
  const notifier = createNotifierStub({
    ok: false,
    code: "discord_notification_no_binding",
    message: "No active Discord binding.",
  });
  const service = createRoutineReminderService({
    now: () => dueAt,
    notifier,
    routines: repository,
  });

  const result = await service.sendDueRoutineReminders();

  assert.deepEqual(result, {
    checked: 1,
    due: 1,
    sent: 0,
    skipped: 1,
    failed: 0,
  });
});

function createNotifierStub(
  response:
    | { ok: true }
    | {
        ok: false;
        code:
          | "discord_notification_config_missing"
          | "discord_notification_delivery_failed"
          | "discord_notification_no_binding";
        message: string;
      },
) {
  const calls: Array<{
    idempotencyKey: string;
    metadata: Record<string, unknown>;
    text: string;
    userId: string;
  }> = [];
  const notifier = {
    calls,
    async sendUserNotification(input: {
      idempotencyKey: string;
      metadata: Record<string, unknown>;
      text: string;
      userId: string;
    }) {
      calls.push(input);

      return response.ok
        ? {
            ok: true as const,
            code: "discord_notification_sent" as const,
          }
        : response;
    },
  };

  return notifier;
}
