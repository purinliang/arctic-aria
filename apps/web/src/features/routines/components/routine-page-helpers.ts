import type {
  RoutineDefinition,
  RoutineRuleType,
} from "@/features/dashboard/types";
import type { RoutineInput } from "@/features/routines/actions";

export const ruleOptions: Array<{
  type: RoutineRuleType;
  label: string;
}> = [
  { type: "daily", label: "Daily" },
  { type: "weekly", label: "Weekly" },
  { type: "bi_weekly", label: "Bi-weekly" },
  { type: "monthly_by_date", label: "Monthly date" },
  { type: "day_interval", label: "Day interval" },
];

export const weekdayOptions = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

export function emptyDraft(): RoutineInput {
  return {
    title: "",
    description: "",
    firstStartDate: new Date().toISOString().slice(0, 10),
    endDate: "",
    ruleType: "daily",
    intervalValue: 1,
    weekdays: [new Date().getDay()],
    dayOfMonth: new Date().getDate(),
    preferredTime: "",
    timezone: "UTC",
  };
}

export function toDraft(routine: RoutineDefinition): RoutineInput {
  return {
    id: routine.id,
    title: routine.title,
    description: routine.description,
    firstStartDate: routine.firstStartDate,
    endDate: routine.endDate ?? "",
    ruleType: routine.ruleType,
    intervalValue: routine.intervalValue ?? 1,
    weekdays: routine.weekdays ?? [],
    dayOfMonth: routine.dayOfMonth ?? 1,
    preferredTime: routine.preferredTime ?? "",
    timezone: routine.timezone,
  };
}

export function ruleSummary(routine: RoutineDefinition) {
  if (routine.ruleType === "daily") {
    return "Daily";
  }

  if (routine.ruleType === "weekly") {
    const weekdays = routine.weekdays ?? [];

    return `Weekly: ${
      weekdayOptions
        .filter((weekday) => weekdays.includes(weekday.value))
        .map((weekday) => weekday.label)
        .join(", ") || "No day selected"
    }`;
  }

  if (routine.ruleType === "bi_weekly") {
    return "Every 14 days";
  }

  if (routine.ruleType === "monthly_by_date") {
    return `Every ${routine.intervalValue ?? 1} month(s) on day ${
      routine.dayOfMonth ?? 1
    }`;
  }

  return `Every ${routine.intervalValue ?? 1} day(s)`;
}
