export type EventRuleType = "once" | "daily" | "weekly";
export type EventInstanceStatus = "scheduled" | "canceled";

export type EventRuleRecord = {
  id: string;
  eventId: string;
  ruleType: EventRuleType;
  scheduledTime: string;
  weekday: number | null;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
};

export type EventRecord = {
  id: string;
  userId: string;
  groupId: string | null;
  groupName: string | null;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  estimatedDurationHours: number | null;
  location: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  rule: EventRuleRecord;
};

export type EventGroupRecord = {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export type EventInstanceRecord = {
  id: string;
  userId: string;
  eventId: string;
  title: string;
  description: string | null;
  ruleDate: string;
  ruleTime: string;
  scheduledDate: string;
  scheduledTime: string;
  estimatedDurationHours: number | null;
  location: string | null;
  locationOverride: string | null;
  effectiveLocation: string | null;
  status: EventInstanceStatus;
  canceledAt: Date | null;
  cancellationReason: string | null;
  rescheduledAt: Date | null;
  rescheduleReason: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type EventRuleInput = {
  ruleType: EventRuleType;
  scheduledTime: string;
  weekday: number | null;
  timezone: string;
};

export type SaveEventInput = {
  userId: string;
  eventId?: string;
  groupId: string | null;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  estimatedDurationHours: number | null;
  location: string | null;
  rule: EventRuleInput;
  occurredAt: Date;
};

export type SaveEventGroupInput = {
  userId: string;
  groupId?: string;
  name: string;
  description: string | null;
  occurredAt: Date;
};

export type EventRepository = {
  listEventGroups(userId: string): Promise<EventGroupRecord[]>;
  listEvents(userId: string): Promise<EventRecord[]>;
  listActiveEvents(userId: string): Promise<EventRecord[]>;
  listEventInstances(userId: string): Promise<EventInstanceRecord[]>;
  listEventInstancesForDate(
    userId: string,
    scheduledDate: string,
  ): Promise<EventInstanceRecord[]>;
  createEventGroup(input: SaveEventGroupInput): Promise<EventGroupRecord>;
  updateEventGroup(
    input: SaveEventGroupInput & { groupId: string },
  ): Promise<EventGroupRecord | null>;
  deleteEventGroup(input: {
    userId: string;
    groupId: string;
    occurredAt: Date;
  }): Promise<boolean>;
  createEvent(input: SaveEventInput): Promise<EventRecord>;
  updateEvent(input: SaveEventInput & { eventId: string }): Promise<EventRecord | null>;
  deleteEvent(input: {
    userId: string;
    eventId: string;
    occurredAt: Date;
  }): Promise<boolean>;
  ensureEventInstance(input: {
    userId: string;
    eventId: string;
    ruleDate: string;
    ruleTime: string;
    scheduledDate: string;
    scheduledTime: string;
    occurredAt: Date;
  }): Promise<EventInstanceRecord | null>;
  deleteFutureScheduledEventInstances(input: {
    userId: string;
    eventId: string;
    fromDate: string;
  }): Promise<number>;
};

export class InMemoryEventRepository implements EventRepository {
  private groups: EventGroupRecord[] = [];
  private events: EventRecord[] = [];
  private instances: EventInstanceRecord[] = [];

  constructor(seed?: {
    groups?: EventGroupRecord[];
    events?: EventRecord[];
    instances?: EventInstanceRecord[];
  }) {
    this.groups = seed?.groups ?? [];
    this.events = seed?.events ?? [];
    this.instances = seed?.instances ?? [];
  }

  async listEventGroups(userId: string) {
    return this.groups.filter(
      (group) => group.userId === userId && group.deletedAt === null,
    );
  }

  async listEvents(userId: string) {
    return this.events
      .filter((event) => event.userId === userId && event.deletedAt === null)
      .sort(compareEventRecords);
  }

  async listActiveEvents(userId: string) {
    return this.listEvents(userId);
  }

  async listEventInstances(userId: string) {
    return this.activeInstances(userId).sort(compareEventInstances);
  }

  async listEventInstancesForDate(userId: string, scheduledDate: string) {
    return this.activeInstances(userId)
      .filter((instance) => instance.scheduledDate === scheduledDate)
      .sort(compareEventInstances);
  }

  async createEventGroup(input: SaveEventGroupInput) {
    const group: EventGroupRecord = {
      id: crypto.randomUUID(),
      userId: input.userId,
      name: input.name,
      description: input.description,
      createdAt: input.occurredAt,
      updatedAt: input.occurredAt,
      deletedAt: null,
    };

    this.groups.push(group);

    return group;
  }

  async updateEventGroup(input: SaveEventGroupInput & { groupId: string }) {
    const group = this.groups.find(
      (current) =>
        current.userId === input.userId && current.id === input.groupId,
    );

    if (!group || group.deletedAt !== null) {
      return null;
    }

    group.name = input.name;
    group.description = input.description;
    group.updatedAt = input.occurredAt;

    this.events
      .filter((event) => event.groupId === group.id)
      .forEach((event) => {
        event.groupName = group.name;
      });

    return group;
  }

  async deleteEventGroup(input: {
    userId: string;
    groupId: string;
    occurredAt: Date;
  }) {
    const group = this.groups.find(
      (current) =>
        current.userId === input.userId && current.id === input.groupId,
    );

    if (!group || group.deletedAt !== null) {
      return false;
    }

    group.deletedAt = input.occurredAt;
    group.updatedAt = input.occurredAt;

    this.events
      .filter((event) => event.groupId === group.id)
      .forEach((event) => {
        event.groupId = null;
        event.groupName = null;
        event.updatedAt = input.occurredAt;
      });

    return true;
  }

  async createEvent(input: SaveEventInput) {
    const group = this.findGroup(input.userId, input.groupId);
    const event: EventRecord = {
      id: crypto.randomUUID(),
      userId: input.userId,
      groupId: group?.id ?? null,
      groupName: group?.name ?? null,
      title: input.title,
      description: input.description,
      startDate: input.startDate,
      endDate: input.endDate,
      estimatedDurationHours: input.estimatedDurationHours,
      location: input.location,
      createdAt: input.occurredAt,
      updatedAt: input.occurredAt,
      deletedAt: null,
      rule: {
        id: crypto.randomUUID(),
        eventId: "",
        ...input.rule,
        createdAt: input.occurredAt,
        updatedAt: input.occurredAt,
      },
    };

    event.rule.eventId = event.id;
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

    const group = this.findGroup(input.userId, input.groupId);

    event.groupId = group?.id ?? null;
    event.groupName = group?.name ?? null;
    event.title = input.title;
    event.description = input.description;
    event.startDate = input.startDate;
    event.endDate = input.endDate;
    event.estimatedDurationHours = input.estimatedDurationHours;
    event.location = input.location;
    event.updatedAt = input.occurredAt;
    event.rule = {
      ...event.rule,
      ...input.rule,
      updatedAt: input.occurredAt,
    };

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

  async ensureEventInstance(input: {
    userId: string;
    eventId: string;
    ruleDate: string;
    ruleTime: string;
    scheduledDate: string;
    scheduledTime: string;
    occurredAt: Date;
  }) {
    const event = this.events.find(
      (current) =>
        current.userId === input.userId &&
        current.id === input.eventId &&
        current.deletedAt === null,
    );

    if (!event) {
      return null;
    }

    const existing = this.instances.find(
      (instance) =>
        instance.eventId === input.eventId &&
        instance.ruleDate === input.ruleDate &&
        instance.ruleTime === input.ruleTime,
    );

    if (existing) {
      return existing;
    }

    const instance: EventInstanceRecord = {
      id: crypto.randomUUID(),
      userId: input.userId,
      eventId: input.eventId,
      title: event.title,
      description: event.description,
      ruleDate: input.ruleDate,
      ruleTime: input.ruleTime,
      scheduledDate: input.scheduledDate,
      scheduledTime: input.scheduledTime,
      estimatedDurationHours: event.estimatedDurationHours,
      location: event.location,
      locationOverride: null,
      effectiveLocation: event.location,
      status: "scheduled",
      canceledAt: null,
      cancellationReason: null,
      rescheduledAt: null,
      rescheduleReason: null,
      createdAt: input.occurredAt,
      updatedAt: input.occurredAt,
    };

    this.instances.push(instance);

    return instance;
  }

  async deleteFutureScheduledEventInstances(input: {
    userId: string;
    eventId: string;
    fromDate: string;
  }) {
    const beforeLength = this.instances.length;

    this.instances = this.instances.filter(
      (instance) =>
        !(
          instance.userId === input.userId &&
          instance.eventId === input.eventId &&
          instance.scheduledDate >= input.fromDate &&
          instance.status === "scheduled" &&
          instance.locationOverride === null &&
          instance.rescheduledAt === null
        ),
    );

    return beforeLength - this.instances.length;
  }

  private activeInstances(userId: string) {
    const activeEventIds = new Set(
      this.events
        .filter((event) => event.userId === userId && event.deletedAt === null)
        .map((event) => event.id),
    );

    return this.instances.filter(
      (instance) =>
        instance.userId === userId &&
        activeEventIds.has(instance.eventId) &&
        instance.status !== "canceled",
    );
  }

  private findGroup(userId: string, groupId: string | null) {
    return groupId
      ? this.groups.find(
          (group) =>
            group.userId === userId &&
            group.id === groupId &&
            group.deletedAt === null,
        ) ?? null
      : null;
  }
}

function compareEventRecords(left: EventRecord, right: EventRecord) {
  return (
    left.startDate.localeCompare(right.startDate) ||
    left.rule.scheduledTime.localeCompare(right.rule.scheduledTime) ||
    left.createdAt.getTime() - right.createdAt.getTime()
  );
}

function compareEventInstances(
  left: EventInstanceRecord,
  right: EventInstanceRecord,
) {
  return (
    left.scheduledDate.localeCompare(right.scheduledDate) ||
    left.scheduledTime.localeCompare(right.scheduledTime) ||
    left.createdAt.getTime() - right.createdAt.getTime()
  );
}
