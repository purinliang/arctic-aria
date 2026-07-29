import {
  localDateTimeParts,
  localScheduledDateKey,
} from "../../settings/time-zones.ts";
import type { ScheduledEvent } from "../../dashboard/types.ts";
import type { EventInput } from "../actions.ts";

export type EventTimeFilter = "upcoming" | "past" | "all";

export type EventTimeGroups = {
  upcoming: ScheduledEvent[];
  past: ScheduledEvent[];
};

export function emptyEventDraft(
  resolvedTimeZone: string,
  date = new Date(),
): EventInput {
  return {
    title: "",
    description: "",
    eventDate: localScheduledDateKey({
      date,
      timeZone: resolvedTimeZone,
    }),
    eventTime: "",
    estimatedDurationHours: "",
    location: "",
  };
}

export function toEventDraft(event: ScheduledEvent): EventInput {
  return {
    id: event.id,
    title: event.title,
    description: event.description ?? "",
    eventDate: event.eventDate,
    eventTime: event.eventTime,
    estimatedDurationHours:
      event.estimatedDurationHours?.toString() ?? "",
    location: event.location ?? "",
  };
}

export function splitEventsByCurrentTime({
  events,
  now = new Date(),
  timeZone,
}: {
  events: ScheduledEvent[];
  now?: Date;
  timeZone: string;
}) {
  const local = localDateTimeParts(now, timeZone);
  const currentDate = local?.dateKey ?? now.toISOString().slice(0, 10);
  const currentTime = local
    ? `${String(local.hour).padStart(2, "0")}:${String(local.minute).padStart(
        2,
        "0",
      )}`
    : now.toISOString().slice(11, 16);
  const sortedEvents = [...events].sort(compareScheduledEvents);

  return {
    upcoming: sortedEvents.filter((event) =>
      isUpcomingEvent(event, currentDate, currentTime),
    ),
    past: sortedEvents.filter(
      (event) => !isUpcomingEvent(event, currentDate, currentTime),
    ),
  };
}

export function filterEventGroups(
  groups: EventTimeGroups,
  filter: EventTimeFilter,
): EventTimeGroups {
  if (filter === "all") {
    return groups;
  }

  if (filter === "past") {
    return {
      upcoming: [],
      past: groups.past,
    };
  }

  return {
    upcoming: groups.upcoming,
    past: [],
  };
}

export function compareScheduledEvents(
  left: ScheduledEvent,
  right: ScheduledEvent,
) {
  return (
    left.eventDate.localeCompare(right.eventDate) ||
    left.eventTime.localeCompare(right.eventTime) ||
    left.createdAt.localeCompare(right.createdAt)
  );
}

function isUpcomingEvent(
  event: ScheduledEvent,
  currentDate: string,
  currentTime: string,
) {
  return (
    event.eventDate > currentDate ||
    (event.eventDate === currentDate && event.eventTime >= currentTime)
  );
}
