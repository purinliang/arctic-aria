import { PostgresRoutineRepository } from "./postgres-routine-repository.ts";
import type {
  RoutineRecord,
  RoutineRepository,
  RoutineRuleInput,
} from "./routine-repository.ts";

export type RoutineServiceOptions = {
  routines?: RoutineRepository;
  now?: () => Date;
};

const msPerDay = 24 * 60 * 60 * 1000;

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

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

function shouldGenerateInstance(routine: RoutineRecord, date: string) {
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

  return {
    async listRoutineDefinitions(userId: string) {
      return routines.listRoutines(userId);
    },

    async listTodayRoutineInstances(userId: string) {
      const occurredAt = now();
      const today = dateKey(occurredAt);
      const activeRoutines = await routines.listActiveRoutines(userId);

      await Promise.all(
        activeRoutines
          .filter((routine) => shouldGenerateInstance(routine, today))
          .map((routine) =>
            routines.ensureRoutineInstance({
              userId,
              routineId: routine.id,
              scheduledDate: today,
              scheduledTime: routine.rule.preferredTime,
              occurredAt,
            }),
          ),
      );

      return routines.listRoutineInstancesForDate(userId, today);
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

      if (input.id) {
        return routines.updateRoutine({
          userId,
          routineId: input.id,
          title: input.title,
          description: input.description,
          firstStartDate: input.firstStartDate,
          endDate: input.endDate,
          rule: input.rule,
          occurredAt,
        });
      }

      return routines.createRoutine({
        userId,
        title: input.title,
        description: input.description,
        firstStartDate: input.firstStartDate,
        endDate: input.endDate,
        rule: input.rule,
        occurredAt,
      });
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
