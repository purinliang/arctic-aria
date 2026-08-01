import { PostgresEventRepository } from "./postgres-event-repository.ts";
import {
  defaultResolvedTimeZone,
  localScheduledDateKey,
} from "../../settings/time-zones.ts";
import type {
  EventRecord,
  EventRepository,
  SaveEventGroupInput,
  SaveEventInput,
} from "./event-repository.ts";

export type EventServiceOptions = {
  events?: EventRepository;
  now?: () => Date;
};

const upcomingEventInstanceLimit = 3;
const upcomingEventSearchDays = 370 * 3 + 7;

function parseDateKey(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function dateKey(value: Date) {
  return value.toISOString().slice(0, 10);
}

function addDaysToDateKey(value: string, days: number) {
  const date = parseDateKey(value);

  date.setUTCDate(date.getUTCDate() + days);

  return dateKey(date);
}

function weekdayFromDateKey(value: string) {
  return parseDateKey(value).getUTCDay();
}

export function shouldGenerateEventInstance(
  event: EventRecord,
  date: string,
) {
  if (event.deletedAt !== null) {
    return false;
  }

  if (date < event.startDate) {
    return false;
  }

  if (event.endDate && date > event.endDate) {
    return false;
  }

  if (event.rule.ruleType === "once") {
    return date === event.startDate;
  }

  if (event.rule.ruleType === "daily") {
    return true;
  }

  return weekdayFromDateKey(date) === event.rule.weekday;
}

export function nextEventOccurrenceDates({
  event,
  fromDate,
  limit = upcomingEventInstanceLimit,
}: {
  event: EventRecord;
  fromDate: string;
  limit?: number;
}) {
  const dates: string[] = [];
  let cursor = fromDate;

  for (
    let dayOffset = 0;
    dayOffset <= upcomingEventSearchDays && dates.length < limit;
    dayOffset += 1
  ) {
    if (shouldGenerateEventInstance(event, cursor)) {
      dates.push(cursor);
    }

    cursor = addDaysToDateKey(cursor, 1);
  }

  return dates;
}

export function createEventService(options: EventServiceOptions = {}) {
  const events = options.events ?? new PostgresEventRepository();
  const now = options.now ?? (() => new Date());

  async function ensureUpcomingEventInstancesForEvent({
    userId,
    event,
    referenceDate,
    occurredAt,
  }: {
    userId: string;
    event: EventRecord;
    referenceDate: string;
    occurredAt: Date;
  }) {
    const occurrenceDates = nextEventOccurrenceDates({
      event,
      fromDate: referenceDate,
    });

    await Promise.all(
      occurrenceDates.map((scheduledDate) =>
        events.ensureEventInstance({
          userId,
          eventId: event.id,
          ruleDate: scheduledDate,
          ruleTime: event.rule.scheduledTime,
          scheduledDate,
          scheduledTime: event.rule.scheduledTime,
          occurredAt,
        }),
      ),
    );
  }

  async function ensureUpcomingEventInstances(
    userId: string,
    timeZone: string,
    occurredAt: Date,
  ) {
    const referenceDate = localScheduledDateKey({
      date: occurredAt,
      timeZone,
    });
    const activeEvents = await events.listActiveEvents(userId);

    await Promise.all(
      activeEvents.map((event) =>
        ensureUpcomingEventInstancesForEvent({
          userId,
          event,
          referenceDate,
          occurredAt,
        }),
      ),
    );
  }

  return {
    async listEventGroups(userId: string) {
      return events.listEventGroups(userId);
    },

    async saveEventGroup(
      userId: string,
      input: Omit<SaveEventGroupInput, "userId" | "occurredAt">,
    ) {
      const occurredAt = now();

      return input.groupId
        ? events.updateEventGroup({
            ...input,
            userId,
            occurredAt,
            groupId: input.groupId,
          })
        : events.createEventGroup({
            ...input,
            userId,
            occurredAt,
          });
    },

    async deleteEventGroup(userId: string, groupId: string) {
      return events.deleteEventGroup({
        userId,
        groupId,
        occurredAt: now(),
      });
    },

    async listEvents(userId: string) {
      return events.listEvents(userId);
    },

    async listEventInstances(
      userId: string,
      timeZone = defaultResolvedTimeZone,
    ) {
      const occurredAt = now();

      await ensureUpcomingEventInstances(userId, timeZone, occurredAt);

      return events.listEventInstances(userId);
    },

    async listTodayEvents(
      userId: string,
      timeZone = defaultResolvedTimeZone,
    ) {
      const occurredAt = now();
      const scheduledDate = localScheduledDateKey({
        date: occurredAt,
        timeZone,
      });

      await ensureUpcomingEventInstances(userId, timeZone, occurredAt);

      return events.listEventInstancesForDate(userId, scheduledDate);
    },

    async listEventsForDate(
      userId: string,
      eventDate: string,
      timeZone = defaultResolvedTimeZone,
    ) {
      const occurredAt = now();

      await ensureUpcomingEventInstances(userId, timeZone, occurredAt);

      return events.listEventInstancesForDate(userId, eventDate);
    },

    async saveEvent(
      userId: string,
      input: Omit<SaveEventInput, "userId" | "occurredAt">,
    ) {
      const occurredAt = now();

      const savedEvent = input.eventId
        ? await events.updateEvent({
            ...input,
            userId,
            occurredAt,
            eventId: input.eventId,
          })
        : await events.createEvent({
            ...input,
            userId,
            occurredAt,
          });

      if (savedEvent) {
        const referenceDate = localScheduledDateKey({
          date: occurredAt,
          timeZone: savedEvent.rule.timezone,
        });

        await events.deleteFutureScheduledEventInstances({
          userId,
          eventId: savedEvent.id,
          fromDate: referenceDate,
        });
        await ensureUpcomingEventInstancesForEvent({
          userId,
          event: savedEvent,
          referenceDate,
          occurredAt,
        });
      }

      return savedEvent;
    },

    async deleteEvent(userId: string, eventId: string) {
      return events.deleteEvent({
        userId,
        eventId,
        occurredAt: now(),
      });
    },
  };
}

export const eventService = createEventService();
