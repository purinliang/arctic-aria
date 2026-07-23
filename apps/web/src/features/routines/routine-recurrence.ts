import type { RoutineRuleType } from "../dashboard/types.ts";

export type RoutineRecurrenceOption =
  | "once"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "every_14_days"
  | "every_30_days"
  | "fixed_days";

export type RoutineRecurrenceDraft = {
  firstStartDate: string;
  endDate?: string | null;
  ruleType: RoutineRuleType;
  recurrenceOption?: RoutineRecurrenceOption;
  intervalValue?: number | null;
  weekdays?: number[] | null;
  dayOfMonth?: number | null;
};

export type NormalizedRoutineRule = {
  ruleType: RoutineRuleType;
  intervalValue: number | null;
  weekdays: number[] | null;
  dayOfMonth: number | null;
};

export const routineRecurrenceOptions: RoutineRecurrenceOption[] = [
  "once",
  "daily",
  "weekly",
  "monthly",
  "yearly",
  "every_14_days",
  "every_30_days",
  "fixed_days",
];

const msPerDay = 24 * 60 * 60 * 1000;

export function isValidDateKey(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);

  return !Number.isNaN(parsed.getTime()) && dateKey(parsed) === value;
}

export function recurrenceOptionFromRule(
  draft: Pick<
    RoutineRecurrenceDraft,
    "ruleType" | "intervalValue" | "recurrenceOption"
  >,
): RoutineRecurrenceOption {
  if ("recurrenceOption" in draft && draft.recurrenceOption) {
    return draft.recurrenceOption;
  }

  if (draft.ruleType === "once") {
    return "once";
  }

  if (draft.ruleType === "monthly_by_date") {
    return draft.intervalValue === 12 ? "yearly" : "monthly";
  }

  if (draft.ruleType === "bi_weekly") {
    return "every_14_days";
  }

  if (draft.ruleType === "day_interval") {
    return draft.intervalValue === 30 ? "every_30_days" : "fixed_days";
  }

  return draft.ruleType;
}

export function applyRecurrenceOption<T extends RoutineRecurrenceDraft>(
  draft: T,
  option: RoutineRecurrenceOption,
): T {
  const weekday = weekdayFromDateKey(draft.firstStartDate);
  const dayOfMonth = dayOfMonthFromDateKey(draft.firstStartDate);

  if (option === "once") {
    return {
      ...draft,
      recurrenceOption: option,
      ruleType: "once",
      intervalValue: null,
      weekdays: null,
      dayOfMonth: null,
    };
  }

  if (option === "daily") {
    return {
      ...draft,
      recurrenceOption: option,
      ruleType: "daily",
      intervalValue: null,
      weekdays: null,
      dayOfMonth: null,
    };
  }

  if (option === "weekly") {
    return {
      ...draft,
      recurrenceOption: option,
      ruleType: "weekly",
      intervalValue: null,
      weekdays: weekday === null ? [] : [weekday],
      dayOfMonth: null,
    };
  }

  if (option === "monthly") {
    return {
      ...draft,
      recurrenceOption: option,
      ruleType: "monthly_by_date",
      intervalValue: 1,
      weekdays: null,
      dayOfMonth,
    };
  }

  if (option === "yearly") {
    return {
      ...draft,
      recurrenceOption: option,
      ruleType: "monthly_by_date",
      intervalValue: 12,
      weekdays: null,
      dayOfMonth,
    };
  }

  if (option === "every_14_days") {
    return {
      ...draft,
      recurrenceOption: option,
      ruleType: "bi_weekly",
      intervalValue: null,
      weekdays: null,
      dayOfMonth: null,
    };
  }

  if (option === "every_30_days") {
    return {
      ...draft,
      recurrenceOption: option,
      ruleType: "day_interval",
      intervalValue: 30,
      weekdays: null,
      dayOfMonth: null,
    };
  }

  return {
    ...draft,
    recurrenceOption: option,
    ruleType: "day_interval",
    weekdays: null,
    dayOfMonth: null,
    intervalValue:
      draft.intervalValue === null || draft.intervalValue === undefined
        ? 90
        : draft.intervalValue,
  };
}

export function normalizeRoutineRecurrenceDraft<T extends RoutineRecurrenceDraft>(
  draft: T,
): T {
  const rule = normalizeRoutineRecurrence(draft);

  return rule ? { ...draft, ...rule } : draft;
}

export function normalizeRoutineRecurrence(
  draft: RoutineRecurrenceDraft,
): NormalizedRoutineRule | null {
  if (!isValidDateKey(draft.firstStartDate)) {
    return null;
  }

  const weekday = weekdayFromDateKey(draft.firstStartDate);
  const dayOfMonth = dayOfMonthFromDateKey(draft.firstStartDate);

  if (weekday === null || dayOfMonth === null) {
    return null;
  }

  if (draft.ruleType === "once") {
    return noDetailRule("once");
  }

  if (draft.ruleType === "daily") {
    return noDetailRule("daily");
  }

  if (draft.ruleType === "weekly") {
    return {
      ruleType: "weekly",
      intervalValue: null,
      weekdays: [weekday],
      dayOfMonth: null,
    };
  }

  if (draft.ruleType === "monthly_by_date") {
    const intervalValue = draft.intervalValue ?? 1;

    if (!Number.isInteger(intervalValue) || intervalValue < 1) {
      return null;
    }

    return {
      ruleType: "monthly_by_date",
      intervalValue,
      weekdays: null,
      dayOfMonth,
    };
  }

  if (draft.ruleType === "bi_weekly") {
    return noDetailRule("bi_weekly");
  }

  if (draft.ruleType === "day_interval") {
    if (draft.intervalValue === null || draft.intervalValue === undefined) {
      return null;
    }

    const intervalValue = Number(draft.intervalValue);

    if (!Number.isInteger(intervalValue) || intervalValue < 1) {
      return null;
    }

    return {
      ruleType: "day_interval",
      intervalValue,
      weekdays: null,
      dayOfMonth: null,
    };
  }

  return null;
}

export function fixedDayIntervalInputValue(
  intervalValue: number | null | undefined,
) {
  return intervalValue ?? "";
}

export function fixedDayIntervalValueFromInput(value: string) {
  const intervalValue = value.trim();

  return intervalValue ? Number(intervalValue) : null;
}

export function previewRoutineDateKeys(
  draft: RoutineRecurrenceDraft,
  limit = 3,
) {
  if (!isValidDateKey(draft.firstStartDate)) {
    return { dates: [] as string[], continues: false };
  }

  const rule = normalizeRoutineRecurrence(draft);

  if (!rule) {
    return { dates: [] as string[], continues: false };
  }

  const endDate = draft.endDate?.trim() || null;

  if (rule.ruleType === "once") {
    return {
      dates: endDate && draft.firstStartDate > endDate ? [] : [draft.firstStartDate],
      continues: false,
    };
  }

  const dates: string[] = [];
  let offset = 0;

  while (dates.length < limit + 1 && offset < 1000) {
    const nextDate = nextDateKey(draft.firstStartDate, rule, offset);

    if (endDate && nextDate > endDate) {
      break;
    }

    dates.push(nextDate);
    offset += 1;
  }

  return {
    dates: dates.slice(0, limit),
    continues: dates.length > limit,
  };
}

export function weekdayFromDateKey(value: string) {
  return isValidDateKey(value) ? parseDateKey(value).getUTCDay() : null;
}

export function dayOfMonthFromDateKey(value: string) {
  return isValidDateKey(value) ? parseDateKey(value).getUTCDate() : null;
}

function noDetailRule(
  ruleType: "once" | "daily" | "bi_weekly",
): NormalizedRoutineRule {
  return {
    ruleType,
    intervalValue: null,
    weekdays: null,
    dayOfMonth: null,
  };
}

function nextDateKey(
  firstStartDate: string,
  rule: NormalizedRoutineRule,
  offset: number,
) {
  if (rule.ruleType === "daily") {
    return addDays(firstStartDate, offset);
  }

  if (rule.ruleType === "weekly") {
    return addDays(firstStartDate, offset * 7);
  }

  if (rule.ruleType === "bi_weekly") {
    return addDays(firstStartDate, offset * 14);
  }

  if (rule.ruleType === "monthly_by_date") {
    return addMonths(firstStartDate, offset * (rule.intervalValue ?? 1));
  }

  return addDays(firstStartDate, offset * (rule.intervalValue ?? 90));
}

function addDays(value: string, days: number) {
  return dateKey(new Date(parseDateKey(value).getTime() + days * msPerDay));
}

function addMonths(value: string, months: number) {
  const source = parseDateKey(value);
  const targetMonth = source.getUTCMonth() + months;
  const targetYear = source.getUTCFullYear() + Math.floor(targetMonth / 12);
  const monthIndex = ((targetMonth % 12) + 12) % 12;
  const day = Math.min(
    source.getUTCDate(),
    new Date(Date.UTC(targetYear, monthIndex + 1, 0)).getUTCDate(),
  );

  return dateKey(new Date(Date.UTC(targetYear, monthIndex, day)));
}

function parseDateKey(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}
