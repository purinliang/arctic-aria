import { localScheduledDateKey } from "../../settings/time-zones.ts";
import type {
  EventDefinition,
  EventGroupOption,
} from "../../dashboard/types.ts";
import type { EventMessages } from "../../../messages/app-messages.ts";
import type { EventInput } from "../actions.ts";

export type EventGroupFilter = "All" | "none" | string;

export function emptyEventDraft(
  resolvedTimeZone: string,
  date = new Date(),
): EventInput {
  return {
    groupId: null,
    title: "",
    description: "",
    eventDate: localScheduledDateKey({
      date,
      timeZone: resolvedTimeZone,
    }),
    endDate: "",
    eventTime: "",
    ruleType: "once",
    estimatedDurationHours: "",
    location: "",
    timezone: resolvedTimeZone,
  };
}

export function toEventDraft(event: EventDefinition): EventInput {
  return {
    id: event.id,
    groupId: event.groupId,
    title: event.title,
    description: event.description ?? "",
    eventDate: event.startDate,
    endDate: event.endDate ?? "",
    eventTime: event.scheduledTime,
    ruleType: event.ruleType,
    estimatedDurationHours:
      event.estimatedDurationHours?.toString() ?? "",
    location: event.location ?? "",
    timezone: event.timezone,
  };
}

export function sortEventGroups(groups: EventGroupOption[]) {
  return [...groups].sort((left, right) =>
    left.name.localeCompare(right.name, "en"),
  );
}

export function filterEventsByGroup(
  events: EventDefinition[],
  filter: EventGroupFilter,
) {
  if (filter === "All") {
    return events;
  }

  if (filter === "none") {
    return events.filter((event) => !event.groupId);
  }

  return events.filter((event) => event.groupId === filter);
}

export function eventRuleSummary(
  event: EventDefinition,
  messages: EventMessages,
) {
  return messages.recurrenceOptions[event.ruleType];
}
