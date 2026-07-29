export type EventRecord = {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  eventDate: string;
  eventTime: string;
  estimatedDurationHours: number | null;
  location: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export type SaveEventInput = {
  userId: string;
  eventId?: string;
  title: string;
  description: string | null;
  eventDate: string;
  eventTime: string;
  estimatedDurationHours: number | null;
  location: string | null;
  occurredAt: Date;
};

export type EventRepository = {
  listEvents(userId: string): Promise<EventRecord[]>;
  listEventsForDate(userId: string, eventDate: string): Promise<EventRecord[]>;
  createEvent(input: SaveEventInput): Promise<EventRecord>;
  updateEvent(
    input: SaveEventInput & { eventId: string },
  ): Promise<EventRecord | null>;
  deleteEvent(input: {
    userId: string;
    eventId: string;
    occurredAt: Date;
  }): Promise<boolean>;
};

export class InMemoryEventRepository implements EventRepository {
  private events: EventRecord[] = [];

  constructor(seed?: { events?: EventRecord[] }) {
    this.events = seed?.events ?? [];
  }

  async listEvents(userId: string) {
    return this.events
      .filter((event) => event.userId === userId && event.deletedAt === null)
      .sort(compareEventRecords);
  }

  async listEventsForDate(userId: string, eventDate: string) {
    return this.events
      .filter(
        (event) =>
          event.userId === userId &&
          event.eventDate === eventDate &&
          event.deletedAt === null,
      )
      .sort(compareEventRecords);
  }

  async createEvent(input: SaveEventInput) {
    const event: EventRecord = {
      id: crypto.randomUUID(),
      userId: input.userId,
      title: input.title,
      description: input.description,
      eventDate: input.eventDate,
      eventTime: input.eventTime,
      estimatedDurationHours: input.estimatedDurationHours,
      location: input.location,
      createdAt: input.occurredAt,
      updatedAt: input.occurredAt,
      deletedAt: null,
    };

    this.events.push(event);

    return event;
  }

  async updateEvent(input: SaveEventInput & { eventId: string }) {
    const event = this.events.find(
      (current) =>
        current.userId === input.userId && current.id === input.eventId,
    );

    if (!event || event.deletedAt !== null) {
      return null;
    }

    event.title = input.title;
    event.description = input.description;
    event.eventDate = input.eventDate;
    event.eventTime = input.eventTime;
    event.estimatedDurationHours = input.estimatedDurationHours;
    event.location = input.location;
    event.updatedAt = input.occurredAt;

    return event;
  }

  async deleteEvent(input: {
    userId: string;
    eventId: string;
    occurredAt: Date;
  }) {
    const event = this.events.find(
      (current) =>
        current.userId === input.userId && current.id === input.eventId,
    );

    if (!event || event.deletedAt !== null) {
      return false;
    }

    event.deletedAt = input.occurredAt;
    event.updatedAt = input.occurredAt;

    return true;
  }
}

function compareEventRecords(left: EventRecord, right: EventRecord) {
  return (
    left.eventDate.localeCompare(right.eventDate) ||
    left.eventTime.localeCompare(right.eventTime) ||
    left.createdAt.getTime() - right.createdAt.getTime()
  );
}
