"use server";

import { getCurrentUser } from "@/features/auth/actions";
import type {
  Routine,
  RoutineDefinition,
  RoutineStatus,
} from "@/features/dashboard/types";
import { routineService } from "./server/routine-service";
import type {
  RoutineInstanceRecord,
  RoutineRecord,
  RoutineRuleInput,
  RoutineRuleType,
} from "./server/routine-repository";

export type RoutineInput = {
  id?: string;
  title: string;
  description: string;
  firstStartDate: string;
  endDate?: string;
  ruleType: RoutineRuleType;
  intervalValue?: number | null;
  weekdays?: number[] | null;
  dayOfMonth?: number | null;
  preferredTime?: string | null;
  timezone?: string;
};

export type RoutineDashboardData = {
  routines: Routine[];
  routineDefinitions: RoutineDefinition[];
};

export type RoutineActionResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      message: string;
    };

function unauthorizedResult<T>(): RoutineActionResult<T> {
  return {
    ok: false,
    message: "Please sign in again.",
  };
}

function toRoutineInstance(instance: RoutineInstanceRecord): Routine {
  return {
    id: instance.id,
    routineId: instance.routineId,
    title: instance.title,
    description: instance.description,
    scheduledTime: instance.scheduledTime ?? "Flexible",
    status: instance.status,
    reminderState: "idle",
    streakText: instance.status === "pending" ? "Due today" : "Answered today",
  };
}

function toRoutineDefinition(routine: RoutineRecord): RoutineDefinition {
  return {
    id: routine.id,
    title: routine.title,
    description: routine.description,
    status: routine.status,
    firstStartDate: routine.firstStartDate,
    endDate: routine.endDate,
    ruleType: routine.rule.ruleType,
    intervalValue: routine.rule.intervalValue,
    weekdays: routine.rule.weekdays,
    dayOfMonth: routine.rule.dayOfMonth,
    preferredTime: routine.rule.preferredTime,
    timezone: routine.rule.timezone,
  };
}

async function loadRoutineDashboardData(
  userId: string,
): Promise<RoutineDashboardData> {
  const [routineDefinitions, routines] = await Promise.all([
    routineService.listRoutineDefinitions(userId),
    routineService.listTodayRoutineInstances(userId),
  ]);

  return {
    routines: routines.map(toRoutineInstance),
    routineDefinitions: routineDefinitions.map(toRoutineDefinition),
  };
}

function validateDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function validateTime(value: string | null | undefined) {
  return !value || /^\d{2}:\d{2}$/.test(value);
}

function normalizeRule(input: RoutineInput): RoutineRuleInput | null {
  const intervalValue =
    input.intervalValue === undefined || input.intervalValue === null
      ? null
      : Number(input.intervalValue);
  const dayOfMonth =
    input.dayOfMonth === undefined || input.dayOfMonth === null
      ? null
      : Number(input.dayOfMonth);

  if (
    intervalValue !== null &&
    (!Number.isInteger(intervalValue) || intervalValue < 1)
  ) {
    return null;
  }

  if (
    dayOfMonth !== null &&
    (!Number.isInteger(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 31)
  ) {
    return null;
  }

  return {
    ruleType: input.ruleType,
    intervalValue:
      input.ruleType === "monthly_by_date" || input.ruleType === "day_interval"
        ? intervalValue ?? 1
        : null,
    weekdays: input.ruleType === "weekly" ? input.weekdays ?? [] : null,
    dayOfMonth: input.ruleType === "monthly_by_date" ? dayOfMonth ?? 1 : null,
    preferredTime: input.preferredTime || null,
    timezone: input.timezone || "UTC",
  };
}

function validateRoutineInput(input: RoutineInput) {
  const title = input.title.trim();
  const description = input.description.trim();
  const endDate = input.endDate?.trim() || null;
  const rule = normalizeRule(input);

  if (title.length < 1 || title.length > 120) {
    return { ok: false as const, message: "Routine title must be 1-120 characters." };
  }

  if (description.length > 2000) {
    return {
      ok: false as const,
      message: "Routine description must be 2000 characters or fewer.",
    };
  }

  if (!validateDate(input.firstStartDate)) {
    return { ok: false as const, message: "Choose a first start date." };
  }

  if (endDate && (!validateDate(endDate) || endDate < input.firstStartDate)) {
    return {
      ok: false as const,
      message: "End date must be blank or after the first start date.",
    };
  }

  if (!validateTime(input.preferredTime)) {
    return { ok: false as const, message: "Preferred time must use HH:MM." };
  }

  if (!rule) {
    return { ok: false as const, message: "Routine rule is invalid." };
  }

  if (rule.ruleType === "weekly" && (!rule.weekdays || rule.weekdays.length === 0)) {
    return { ok: false as const, message: "Choose at least one weekday." };
  }

  return { ok: true as const, title, description, endDate, rule };
}

export async function getRoutineDashboardData(): Promise<
  RoutineActionResult<RoutineDashboardData>
> {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorizedResult();
  }

  return {
    ok: true,
    data: await loadRoutineDashboardData(user.id),
  };
}

export async function saveRoutine(
  input: RoutineInput,
): Promise<RoutineActionResult<RoutineDashboardData>> {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorizedResult();
  }

  const validation = validateRoutineInput(input);

  if (!validation.ok) {
    return { ok: false, message: validation.message };
  }

  const saved = await routineService.saveRoutine(user.id, {
    id: input.id,
    title: validation.title,
    description: validation.description,
    firstStartDate: input.firstStartDate,
    endDate: validation.endDate,
    rule: validation.rule,
  });

  if (!saved) {
    return { ok: false, message: "Routine was not found." };
  }

  return {
    ok: true,
    data: await loadRoutineDashboardData(user.id),
  };
}

export async function deleteRoutine(
  routineId: string,
): Promise<RoutineActionResult<RoutineDashboardData>> {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorizedResult();
  }

  const deleted = await routineService.deleteRoutine(user.id, routineId);

  if (!deleted) {
    return { ok: false, message: "Routine was not found." };
  }

  return {
    ok: true,
    data: await loadRoutineDashboardData(user.id),
  };
}

export async function completeRoutineInstance(
  instanceId: string,
): Promise<RoutineActionResult<RoutineDashboardData>> {
  return updateRoutineInstance(instanceId, "completed");
}

export async function skipRoutineInstance(
  instanceId: string,
): Promise<RoutineActionResult<RoutineDashboardData>> {
  return updateRoutineInstance(instanceId, "skipped");
}

async function updateRoutineInstance(
  instanceId: string,
  status: RoutineStatus,
): Promise<RoutineActionResult<RoutineDashboardData>> {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorizedResult();
  }

  const instance =
    status === "completed"
      ? await routineService.completeRoutineInstance(user.id, instanceId)
      : await routineService.skipRoutineInstance(user.id, instanceId);

  if (!instance) {
    return { ok: false, message: "Routine instance was not found." };
  }

  return {
    ok: true,
    data: await loadRoutineDashboardData(user.id),
  };
}
