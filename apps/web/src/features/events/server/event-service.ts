import { PostgresEventRepository } from "./postgres-event-repository.ts";
import {
  defaultResolvedTimeZone,
  localScheduledDateKey,
} from "../../settings/time-zones.ts";
import type {
  EventRepository,
  SaveEventInput,
} from "./event-repository.ts";

export type EventServiceOptions = {
  events?: EventRepository;
  now?: () => Date;
};

export function createEventService(options: EventServiceOptions = {}) {
  const events = options.events ?? new PostgresEventRepository();
  const now = options.now ?? (() => new Date());

  return {
    async listEvents(userId: string) {
      return events.listEvents(userId);
    },

    async listTodayEvents(
      userId: string,
      timeZone = defaultResolvedTimeZone,
    ) {
      return events.listEventsForDate(
        userId,
        localScheduledDateKey({
          date: now(),
          timeZone,
        }),
      );
    },

    async listEventsForDate(userId: string, eventDate: string) {
      return events.listEventsForDate(userId, eventDate);
    },

    async saveEvent(
      userId: string,
      input: Omit<SaveEventInput, "userId" | "occurredAt">,
    ) {
      const occurredAt = now();

      return input.eventId
        ? events.updateEvent({
            ...input,
            userId,
            occurredAt,
            eventId: input.eventId,
          })
        : events.createEvent({
            ...input,
            userId,
            occurredAt,
          });
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
