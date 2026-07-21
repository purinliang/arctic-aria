import { PostgresRoutineRepository } from "./postgres-routine-repository.ts";
import { localDateKey } from "../../settings/time-zones.ts";
import type {
  RoutineInstanceRecord,
  RoutineRecord,
  RoutineRepository,
  RoutineRuleInput,
} from "./routine-repository.ts";
import {
  resolveRoutineScheduledTime,
  routineReminderAt,
} from "./routine-reminder-schedule.ts";

export type RoutineServiceOptions = {
  routines?: RoutineRepository;
  now?: () => Date;
};

const msPerDay = 24 * 60 * 60 * 1000;
const todayRoutineInstanceLimit = 6;

type TodayRoutineCandidate = {
  routine: RoutineRecord;
  scheduledDate: string;
  scheduledTime: string;
};

function parseDateKey(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function daysBetween(left: string, right: string) {
  return Math.floor(
    (parseDateKey(left).getTime() - parseDateKey(right).getTime()) / msPerDay,
  );
}

function monthsBetween(left: string, right: string) {
  const leftDate = parseDateKey(left);
  const rightDate = parseDateKey(right);

  return (
    (leftDate.getUTCFullYear() - rightDate.getUTCFullYear()) * 12 +
    leftDate.getUTCMonth() -
    rightDate.getUTCMonth()
  );
}

function lastDayOfMonth(year: number, monthIndex: number) {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

function matchesMonthlyByDate(routine: RoutineRecord, date: string) {
  const intervalValue = routine.rule.intervalValue ?? 1;
  const dayOfMonth = routine.rule.dayOfMonth ?? 1;
  const target = parseDateKey(date);
  const targetDay = Math.min(
    dayOfMonth,
    lastDayOfMonth(target.getUTCFullYear(), target.getUTCMonth()),
  );

  return (
    target.getUTCDate() === targetDay &&
    monthsBetween(date, routine.firstStartDate) >= 0 &&
    monthsBetween(date, routine.firstStartDate) % intervalValue === 0
  );
}

export function shouldGenerateInstance(routine: RoutineRecord, date: string) {
  if (routine.deletedAt !== null) {
    return false;
  }

  if (date < routine.firstStartDate) {
    return false;
  }

  if (routine.endDate && date > routine.endDate) {
    return false;
  }

  const dayOffset = daysBetween(date, routine.firstStartDate);

  if (routine.rule.ruleType === "daily") {
    return true;
  }

  if (routine.rule.ruleType === "weekly") {
    const weekday = parseDateKey(date).getUTCDay();

    return routine.rule.weekdays?.includes(weekday) ?? false;
  }

  if (routine.rule.ruleType === "bi_weekly") {
    return dayOffset % 14 === 0;
  }

  if (routine.rule.ruleType === "monthly_by_date") {
    return matchesMonthlyByDate(routine, date);
  }

  const intervalValue = routine.rule.intervalValue ?? 1;

  return dayOffset % intervalValue === 0;
}

export function createRoutineService(options: RoutineServiceOptions = {}) {
  const routines = options.routines ?? new PostgresRoutineRepository();
  const now = options.now ?? (() => new Date());

  async function ensureTodayRoutineInstance(
    userId: string,
    routine: RoutineRecord,
    occurredAt: Date,
  ) {
    const scheduledDate = localDateKey(occurredAt, routine.rule.timezone);

    if (!shouldGenerateInstance(routine, scheduledDate)) {
      return null;
    }

    const scheduledTime = resolveRoutineScheduledTime(routine);

    return routines.ensureRoutineInstance({
      userId,
      routineId: routine.id,
      scheduledDate,
      scheduledTime,
      remindAt: routineReminderAt({
        scheduledDate,
        scheduledTime,
        timeZone: routine.rule.timezone,
      }),
      occurredAt,
    });
  }

  return {
    async listRoutineDefinitions(userId: string) {
      return routines.listRoutines(userId);
    },

    async listTodayRoutineInstances(userId: string) {
      const occurredAt = now();
      const activeRoutines = await routines.listActiveRoutines(userId);
      const scheduledDateByRoutineId = new Map<string, string>();
      const scheduledDates = new Set<string>();
      const routineCandidates: TodayRoutineCandidate[] = activeRoutines.map((routine) => {
        const scheduledDate = localDateKey(occurredAt, routine.rule.timezone);
        const scheduledTime = resolveRoutineScheduledTime(routine);

        scheduledDateByRoutineId.set(routine.id, scheduledDate);
        scheduledDates.add(scheduledDate);

        return {
          routine,
          scheduledDate,
          scheduledTime,
        };
      });

      const existingInstances = await Promise.all(
        [...scheduledDates].map((scheduledDate) =>
          routines.listRoutineInstancesForDate(userId, scheduledDate),
        ),
      );
      const existingTodayInstances = dedupeRoutineInstances(
        existingInstances.flat(),
      )
        .filter(
          (instance) =>
            instance.scheduledDate ===
            scheduledDateByRoutineId.get(instance.routineId),
        )
        .sort(compareTodayRoutineInstances)
        .slice(0, todayRoutineInstanceLimit);
      const existingRoutineIds = new Set(
        existingTodayInstances.map((instance) => instance.routineId),
      );
      const remainingSlots = Math.max(
        todayRoutineInstanceLimit - existingTodayInstances.length,
        0,
      );

      const refreshedExistingInstances = await Promise.all(
        existingTodayInstances.map((instance) => {
          const candidate = routineCandidates.find(
            ({ routine }) => routine.id === instance.routineId,
          );

          if (!candidate) {
            return instance;
          }

          return routines.ensureRoutineInstance({
            userId,
            routineId: candidate.routine.id,
            scheduledDate: candidate.scheduledDate,
            scheduledTime: candidate.scheduledTime,
            remindAt: routineReminderAt({
              scheduledDate: candidate.scheduledDate,
              scheduledTime: candidate.scheduledTime,
              timeZone: candidate.routine.rule.timezone,
            }),
            occurredAt,
          });
        }),
      );
      const ensuredInstances = await Promise.all(
        routineCandidates
          .filter(
            ({ routine, scheduledDate }) =>
              !existingRoutineIds.has(routine.id) &&
              shouldGenerateInstance(routine, scheduledDate),
          )
          .sort(compareRoutineCandidates)
          .slice(0, remainingSlots)
          .map(({ routine, scheduledDate, scheduledTime }) =>
            routines.ensureRoutineInstance({
              userId,
              routineId: routine.id,
              scheduledDate,
              scheduledTime,
              remindAt: routineReminderAt({
                scheduledDate,
                scheduledTime,
                timeZone: routine.rule.timezone,
              }),
              occurredAt,
            }),
          ),
      );
      const allInstances = [
        ...refreshedExistingInstances.filter(
          (instance): instance is RoutineInstanceRecord => Boolean(instance),
        ),
        ...ensuredInstances.filter(
          (instance): instance is RoutineInstanceRecord => Boolean(instance),
        ),
      ];

      return dedupeRoutineInstances(allInstances)
        .filter(
          (instance) =>
            instance.scheduledDate ===
            scheduledDateByRoutineId.get(instance.routineId),
        )
        .sort(compareTodayRoutineInstances)
        .slice(0, todayRoutineInstanceLimit);
    },

    async saveRoutine(
      userId: string,
      input: {
        id?: string;
        title: string;
        description: string | null;
        firstStartDate: string;
        endDate: string | null;
        rule: RoutineRuleInput;
      },
    ) {
      const occurredAt = now();

      const savedRoutine = input.id
        ? await routines.updateRoutine({
          userId,
          routineId: input.id,
          title: input.title,
          description: input.description,
          firstStartDate: input.firstStartDate,
          endDate: input.endDate,
          rule: input.rule,
          occurredAt,
        })
        : await routines.createRoutine({
          userId,
          title: input.title,
          description: input.description,
          firstStartDate: input.firstStartDate,
          endDate: input.endDate,
          rule: input.rule,
          occurredAt,
        });

      if (savedRoutine) {
        await ensureTodayRoutineInstance(userId, savedRoutine, occurredAt);
      }

      return savedRoutine;
    },

    async deleteRoutine(userId: string, routineId: string) {
      return routines.deleteRoutine({
        userId,
        routineId,
        occurredAt: now(),
      });
    },

    async completeRoutineInstance(userId: string, instanceId: string) {
      return routines.completeRoutineInstance({
        userId,
        instanceId,
        occurredAt: now(),
      });
    },

    async skipRoutineInstance(userId: string, instanceId: string) {
      return routines.skipRoutineInstance({
        userId,
        instanceId,
        occurredAt: now(),
      });
    },

    async reopenRoutineInstance(userId: string, instanceId: string) {
      return routines.reopenRoutineInstance({
        userId,
        instanceId,
        occurredAt: now(),
      });
    },
  };
}

export const routineService = createRoutineService();

function dedupeRoutineInstances(instances: RoutineInstanceRecord[]) {
  const seen = new Set<string>();

  return instances.filter((instance) => {
    if (seen.has(instance.id)) {
      return false;
    }

    seen.add(instance.id);
    return true;
  });
}

function compareTodayRoutineInstances(
  left: RoutineInstanceRecord,
  right: RoutineInstanceRecord,
) {
  return (
    timeSortValue(left.scheduledTime) - timeSortValue(right.scheduledTime) ||
    left.title.localeCompare(right.title) ||
    left.createdAt.getTime() - right.createdAt.getTime()
  );
}

function compareRoutineCandidates(
  left: TodayRoutineCandidate,
  right: TodayRoutineCandidate,
) {
  return (
    timeSortValue(left.scheduledTime) - timeSortValue(right.scheduledTime) ||
    left.routine.title.localeCompare(right.routine.title) ||
    left.routine.createdAt.getTime() - right.routine.createdAt.getTime()
  );
}

function timeSortValue(time: string | null) {
  if (!time) {
    return Number.POSITIVE_INFINITY;
  }

  const [hour = "0", minute = "0"] = time.split(":");

  return Number(hour) * 60 + Number(minute);
}
