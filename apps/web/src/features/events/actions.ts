"use server";

import { getCurrentUser } from "@/features/auth/actions";
import type { ScheduledEvent } from "@/features/dashboard/types";
import { loadUserResolvedTimeZone } from "@/features/settings/server/user-time-zone";
import type { ActionFailureResult } from "../../messages/action-result.ts";
import {
  validateEventInput,
  type EventInput,
} from "./event-action-helpers";
import { normalizeEventTemplateDocument } from "./event-template-normalizer";
import type {
  EventTemplateParseData,
  NormalizedEventTemplate,
} from "./event-template-types";
import { eventService } from "./server/event-service";
import type { EventRecord } from "./server/event-repository";

export type { EventInput } from "./event-action-helpers";
export type { EventTemplateParseData } from "./event-template-types";

export type EventDashboardData = {
  events: ScheduledEvent[];
  todayEvents: ScheduledEvent[];
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

function toScheduledEvent(event: EventRecord): ScheduledEvent {
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    eventDate: event.eventDate,
    eventTime: event.eventTime,
    estimatedDurationHours: event.estimatedDurationHours,
    location: event.location,
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
  };
}

export async function loadEventDashboardData(
  userId: string,
): Promise<EventDashboardData> {
  const timeZone = await loadUserResolvedTimeZone(userId);
  const [events, todayEvents] = await Promise.all([
    eventService.listEvents(userId),
    eventService.listTodayEvents(userId, timeZone),
  ]);

  return {
    events: events.map(toScheduledEvent),
    todayEvents: todayEvents.map(toScheduledEvent),
  };
}

export async function loadEventsForDateData(
  userId: string,
  eventDate: string,
): Promise<{ events: ScheduledEvent[] }> {
  const events = await eventService.listEventsForDate(userId, eventDate);

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
    const saved = await eventService.saveEvent(user.id, {
      eventId: input.id,
      title: validation.title,
      description: validation.description,
      eventDate: validation.eventDate,
      eventTime: validation.eventTime,
      estimatedDurationHours: validation.estimatedDurationHours,
      location: validation.location,
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
    const prepared = await prepareEventTemplate(user.id, eventId, source);

    if (!prepared.ok) {
      return prepared;
    }

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
        title: command.title,
        description: command.description,
        eventDate: command.eventDate,
        eventTime: command.eventTime,
        estimatedDurationHours: command.estimatedDurationHours,
        location: command.location,
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
