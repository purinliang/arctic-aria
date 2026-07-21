import type {
  RoutineDefinition,
  RoutineGroupOption,
} from "@/features/dashboard/types";
import type { RoutineInput } from "@/features/routines/actions";
import { localCalendarParts } from "../../settings/time-zones.ts";
import type { RoutineMessages } from "@/messages/app-messages";

export const weekdayOptions = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

export type RoutineGroupFilter = "All" | "none" | string;

export function emptyDraft(
  timezone = "UTC",
  now = new Date(),
  groupId: string | null = null,
): RoutineInput {
  const calendar = localCalendarParts(now, timezone);

  return {
    groupId,
    title: "",
    description: "",
    firstStartDate: calendar.dateKey,
    endDate: "",
    ruleType: "daily",
    intervalValue: 90,
    weekdays: [calendar.weekday],
    dayOfMonth: calendar.day,
    preferredTime: "",
    timezone,
  };
}

export function toDraft(routine: RoutineDefinition): RoutineInput {
  return {
    id: routine.id,
    groupId: routine.groupId,
    title: routine.title,
    description: routine.description ?? "",
    firstStartDate: routine.firstStartDate,
    endDate: routine.endDate ?? "",
    ruleType: routine.ruleType,
    intervalValue: routine.intervalValue ?? 90,
    weekdays: routine.weekdays ?? [],
    dayOfMonth: routine.dayOfMonth ?? 1,
    preferredTime: routine.preferredTime ?? "",
    timezone: routine.timezone,
  };
}

export function sortRoutineGroups(groups: RoutineGroupOption[]) {
  return [...groups].sort((left, right) =>
    left.name.localeCompare(right.name, "en"),
  );
}

export function filterRoutinesByGroup(
  routines: RoutineDefinition[],
  filter: RoutineGroupFilter,
) {
  if (filter === "All") {
    return routines;
  }

  if (filter === "none") {
    return routines.filter((routine) => !routine.groupId);
  }

  return routines.filter((routine) => routine.groupId === filter);
}

export function ruleSummary(
  routine: RoutineDefinition,
  messages?: RoutineMessages,
) {
  if (routine.ruleType === "daily") {
    return messages?.rules.daily ?? "Daily";
  }

  if (routine.ruleType === "weekly") {
    const weekdays = routine.weekdays ?? [];
    const weekdayLabels =
      messages?.weekdays ?? weekdayOptions.map((weekday) => weekday.label);

    const selectedDays =
      weekdayOptions
        .filter((weekday) => weekdays.includes(weekday.value))
        .map((weekday) => weekdayLabels[weekday.value])
        .join(", ");

    return messages
      ? messages.summary.weekly(
          selectedDays || messages.summary.noDaySelected,
        )
      : `Weekly: ${selectedDays || "No day selected"}`;
  }

  if (routine.ruleType === "bi_weekly") {
    return messages?.summary.every14Days ?? "Every 14 days";
  }

  if (routine.ruleType === "monthly_by_date") {
    const interval = routine.intervalValue ?? 1;
    const day = routine.dayOfMonth ?? 1;

    return messages
      ? messages.summary.monthly(interval, day)
      : `Every ${interval} month(s) on day ${day}`;
  }

  const interval = routine.intervalValue ?? 1;

  return messages
    ? messages.summary.dayInterval(interval)
    : `Every ${interval} day(s)`;
}
