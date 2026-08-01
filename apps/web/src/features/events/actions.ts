"use server";

import { getCurrentUser } from "@/features/auth/actions";
import type {
  EventDefinition,
  EventGroupOption,
  ScheduledEvent,
} from "@/features/dashboard/types";
import { loadUserResolvedTimeZone } from "@/features/settings/server/user-time-zone";
import type { ActionFailureResult } from "../../messages/action-result.ts";
import {
  validateEventGroupInput,
  validateEventInstanceCancelInput,
  validateEventInstanceInput,
  validateEventInput,
  type EventGroupInput,
  type EventInstanceInput,
  type EventInput,
} from "./event-action-helpers";
import { normalizeEventTemplateDocument } from "./event-template-normalizer";
import type {
  EventTemplateParseData,
  NormalizedEventTemplate,
} from "./event-template-types";
import { eventService } from "./server/event-service";
import type {
  EventGroupRecord,
  EventInstanceRecord,
  EventRecord,
} from "./server/event-repository";

export type {
  EventGroupInput,
  EventInstanceInput,
  EventInput,
} from "./event-action-helpers";
export type { EventTemplateParseData } from "./event-template-types";

export type EventDashboardData = {
  events: EventDefinition[];
  eventInstances: ScheduledEvent[];
  todayEvents: ScheduledEvent[];
  eventGroups: EventGroupOption[];
};

export type EventActionResult<T> =
  | {
      ok: true;
      data: T;
    }
  | ActionFailureResult;

function unauthorizedResult<T>(): EventActionResult<T> {
  return {
    ok: false,
    message: "Please sign in again.",
    code: "auth_required",
    category: "auth",
  };
}

function databaseResult<T>(): EventActionResult<T> {
  return {
    ok: false,
    message: "Database update failed.",
    code: "event_database_update_failed",
    category: "database_update",
  };
}

function notFoundResult<T>(): EventActionResult<T> {
  return {
    ok: false,
    message: "Event was not found.",
    code: "event_not_found",
    category: "not_found",
    subject: "event",
  };
}

function eventInstanceNotFoundResult<T>(): EventActionResult<T> {
  return {
    ok: false,
    message: "Event instance was not found.",
    code: "event_instance_not_found",
    category: "not_found",
    subject: "event",
  };
}

function duplicateEventGroupResult<T>(): EventActionResult<T> {
  return {
    ok: false,
    message: "An event group with that name already exists.",
    code: "event_group_duplicate",
    category: "domain",
    action: "save",
    subject: "group",
    field: "name",
    reason: "duplicate",
  };
}

function isDatabaseUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

function weekdayFromDateKey(value: string) {
  return new Date(`${value}T00:00:00.000Z`).getUTCDay();
}

function toEventDefinition(event: EventRecord): EventDefinition {
  return {
    id: event.id,
    groupId: event.groupId,
    groupName: event.groupName,
    title: event.title,
    description: event.description,
    startDate: event.startDate,
    endDate: event.endDate,
    estimatedDurationHours: event.estimatedDurationHours,
    location: event.location,
    ruleType: event.rule.ruleType,
    scheduledTime: event.rule.scheduledTime,
    weekday: event.rule.weekday,
    timezone: event.rule.timezone,
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
  };
}

function toEventGroupOption(group: EventGroupRecord): EventGroupOption {
  return {
    id: group.id,
    name: group.name,
    description: group.description,
  };
}

function toScheduledEvent(event: EventInstanceRecord): ScheduledEvent {
  return {
    id: event.id,
    eventId: event.eventId,
    title: event.title,
    description: event.description,
    eventDate: event.scheduledDate,
    eventTime: event.scheduledTime,
    estimatedDurationHours: event.estimatedDurationHours,
    location: event.effectiveLocation,
    locationOverride: event.locationOverride,
    status: event.status,
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
  };
}

export async function loadEventDashboardData(
  userId: string,
): Promise<EventDashboardData> {
  const timeZone = await loadUserResolvedTimeZone(userId);
  const [events, eventInstances, todayEvents, eventGroups] = await Promise.all([
    eventService.listEvents(userId),
    eventService.listEventInstances(userId, timeZone),
    eventService.listTodayEvents(userId, timeZone),
    eventService.listEventGroups(userId),
  ]);

  return {
    events: events.map(toEventDefinition),
    eventInstances: eventInstances.map(toScheduledEvent),
    todayEvents: todayEvents.map(toScheduledEvent),
    eventGroups: eventGroups.map(toEventGroupOption),
  };
}

export async function loadEventsForDateData(
  userId: string,
  eventDate: string,
): Promise<{ events: ScheduledEvent[] }> {
  const timeZone = await loadUserResolvedTimeZone(userId);
  const events = await eventService.listEventsForDate(
    userId,
    eventDate,
    timeZone,
  );

  return {
    events: events.map(toScheduledEvent),
  };
}

export async function getEventDashboardData(): Promise<
  EventActionResult<EventDashboardData>
> {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorizedResult();
  }

  try {
    return {
      ok: true,
      data: await loadEventDashboardData(user.id),
    };
  } catch {
    return databaseResult();
  }
}

export async function saveEvent(
  input: EventInput,
): Promise<EventActionResult<EventDashboardData>> {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorizedResult();
  }

  const validation = validateEventInput(input);

  if (!validation.ok) {
    return validation;
  }

  try {
    if (validation.groupId) {
      const group = (await eventService.listEventGroups(user.id)).find(
        (item) => item.id === validation.groupId,
      );

      if (!group) {
        return {
          ok: false,
          message: "Event group was not found.",
          code: "event_group_not_found",
          category: "not_found",
          subject: "group",
        };
      }
    }

    const saved = await eventService.saveEvent(user.id, {
      eventId: input.id,
      groupId: validation.groupId,
      title: validation.title,
      description: validation.description,
      startDate: validation.eventDate,
      endDate: validation.endDate,
      estimatedDurationHours: validation.estimatedDurationHours,
      location: validation.location,
      rule: {
        ruleType: validation.ruleType,
        scheduledTime: validation.eventTime,
        weekday:
          validation.ruleType === "weekly"
            ? weekdayFromDateKey(validation.eventDate)
            : null,
        timezone: validation.timezone,
      },
    });

    if (!saved) {
      return notFoundResult();
    }

    return {
      ok: true,
      data: await loadEventDashboardData(user.id),
    };
  } catch {
    return databaseResult();
  }
}

export async function saveEventGroup(
  input: EventGroupInput,
): Promise<EventActionResult<EventDashboardData>> {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorizedResult();
  }

  const validation = validateEventGroupInput(input);

  if (!validation.ok) {
    return validation;
  }

  try {
    const groups = await eventService.listEventGroups(user.id);
    const duplicate = groups.some(
      (group) =>
        group.id !== input.id &&
        group.name.toLocaleLowerCase() ===
          validation.name.toLocaleLowerCase(),
    );

    if (duplicate) {
      return duplicateEventGroupResult();
    }

    const saved = await eventService.saveEventGroup(user.id, {
      groupId: input.id,
      name: validation.name,
      description: validation.description,
    });

    if (!saved) {
      return {
        ok: false,
        message: "Event group was not found.",
        code: "event_group_not_found",
        category: "not_found",
        subject: "group",
      };
    }

    return {
      ok: true,
      data: await loadEventDashboardData(user.id),
    };
  } catch (error) {
    if (isDatabaseUniqueViolation(error)) {
      return duplicateEventGroupResult();
    }

    return databaseResult();
  }
}

export async function saveEventInstance(
  input: EventInstanceInput,
): Promise<EventActionResult<EventDashboardData>> {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorizedResult();
  }

  const validation = validateEventInstanceInput(input);

  if (!validation.ok) {
    return validation;
  }

  try {
    const saved = await eventService.updateEventInstance(user.id, {
      instanceId: validation.instanceId,
      scheduledDate: validation.eventDate,
      scheduledTime: validation.eventTime,
      locationOverride: validation.locationOverride,
      rescheduleReason: validation.reason,
    });

    if (!saved) {
      return eventInstanceNotFoundResult();
    }

    return {
      ok: true,
      data: await loadEventDashboardData(user.id),
    };
  } catch {
    return databaseResult();
  }
}

export async function cancelEventInstance(
  input: Pick<EventInstanceInput, "id" | "reason">,
): Promise<EventActionResult<EventDashboardData>> {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorizedResult();
  }

  const validation = validateEventInstanceCancelInput(input);

  if (!validation.ok) {
    return validation;
  }

  try {
    const canceled = await eventService.cancelEventInstance(user.id, {
      instanceId: validation.instanceId,
      cancellationReason: validation.reason,
    });

    if (!canceled) {
      return eventInstanceNotFoundResult();
    }

    return {
      ok: true,
      data: await loadEventDashboardData(user.id),
    };
  } catch {
    return databaseResult();
  }
}

export async function parseEventTemplate(
  eventId: string | null,
  source: string,
): Promise<EventActionResult<EventTemplateParseData>> {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorizedResult();
  }

  try {
    const prepared = await prepareEventTemplate(user.id, eventId, source);

    if (!prepared.ok) {
      return prepared;
    }

    return {
      ok: true,
      data: {
        preview: prepared.data.preview,
      },
    };
  } catch {
    return databaseResult();
  }
}

export async function applyEventTemplate(
  eventId: string | null,
  source: string,
): Promise<EventActionResult<EventDashboardData>> {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorizedResult();
  }

  try {
    const timeZone = await loadUserResolvedTimeZone(user.id);
    const prepared = await prepareEventTemplate(user.id, eventId, source);

    if (!prepared.ok) {
      return prepared;
    }

    const currentEventById = new Map(
      (await eventService.listEvents(user.id)).map((event) => [
        event.id,
        event,
      ]),
    );

    for (const command of prepared.data.commands) {
      if (command.previewOperation === "preserve") {
        continue;
      }

      if (command.operation === "delete") {
        const deleted = await eventService.deleteEvent(user.id, command.eventId);

        if (!deleted) {
          return notFoundResult();
        }

        continue;
      }

      const saved = await eventService.saveEvent(user.id, {
        eventId: command.eventId ?? undefined,
        groupId: command.eventId
          ? currentEventById.get(command.eventId)?.groupId ?? null
          : null,
        title: command.title,
        description: command.description,
        startDate: command.eventDate,
        endDate: command.eventId
          ? currentEventById.get(command.eventId)?.endDate ?? null
          : null,
        estimatedDurationHours: command.estimatedDurationHours,
        location: command.location,
        rule: {
          ruleType: command.eventId
            ? currentEventById.get(command.eventId)?.rule.ruleType ?? "once"
            : "once",
          scheduledTime: command.eventTime,
          weekday:
            currentEventById.get(command.eventId ?? "")?.rule.ruleType ===
            "weekly"
              ? weekdayFromDateKey(command.eventDate)
              : null,
          timezone:
            currentEventById.get(command.eventId ?? "")?.rule.timezone ??
            timeZone,
        },
      });

      if (!saved) {
        return notFoundResult();
      }
    }

    return {
      ok: true,
      data: await loadEventDashboardData(user.id),
    };
  } catch {
    return databaseResult();
  }
}

export async function deleteEvent(
  eventId: string,
): Promise<EventActionResult<EventDashboardData>> {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorizedResult();
  }

  try {
    const deleted = await eventService.deleteEvent(user.id, eventId);

    if (!deleted) {
      return notFoundResult();
    }

    return {
      ok: true,
      data: await loadEventDashboardData(user.id),
    };
  } catch {
    return databaseResult();
  }
}

export async function deleteEventGroup(
  groupId: string,
): Promise<EventActionResult<EventDashboardData>> {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorizedResult();
  }

  try {
    const deleted = await eventService.deleteEventGroup(user.id, groupId);

    if (!deleted) {
      return {
        ok: false,
        message: "Event group was not found.",
        code: "event_group_not_found",
        category: "not_found",
        subject: "group",
      };
    }

    return {
      ok: true,
      data: await loadEventDashboardData(user.id),
    };
  } catch {
    return databaseResult();
  }
}

async function prepareEventTemplate(
  userId: string,
  eventId: string | null,
  source: string,
): Promise<EventActionResult<NormalizedEventTemplate>> {
  const trimmedSource = source.trim();

  if (!trimmedSource) {
    return {
      ok: false,
      message: "Paste an event template first.",
      code: "event_template_missing",
      category: "missing_parameter",
      subject: "event",
      field: "template",
      reason: "required",
    };
  }

  const currentEvents = await eventService.listEvents(userId);

  return normalizeEventTemplateDocument({
    source: trimmedSource,
    currentEvents,
    targetEventId: eventId?.trim() || null,
  });
}
