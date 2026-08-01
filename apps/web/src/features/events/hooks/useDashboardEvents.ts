import { useCallback, useEffect, useRef, useState } from "react";
import {
  readDashboardBrowserCacheSection,
  writeDashboardBrowserCacheSection,
} from "@/app-shell/dashboard-browser-cache";
import {
  notifyActionFailure,
  runNotifiedServerAction,
} from "@/app-shell/action-notifications";
import {
  applyEventTemplate,
  cancelEventInstance,
  deleteEvent,
  deleteEventGroup,
  getEventDashboardData,
  parseEventTemplate,
  saveEventInstance,
  saveEventGroup,
  saveEvent,
  type EventActionResult,
  type EventDashboardData,
  type EventGroupInput,
  type EventInstanceInput,
  type EventInput,
  type EventTemplateParseData,
} from "@/features/events/actions";
import type {
  DashboardMessages,
  EventMessages,
  NotificationMessages,
} from "@/messages/app-messages";
import type {
  EventDefinition,
  EventGroupOption,
  ScheduledEvent,
} from "@/features/dashboard/types";

type EventDataAction = () => Promise<EventActionResult<EventDashboardData>>;

export function useDashboardEvents(
  userId: string,
  showErrorNotification: (message: string, title?: string) => void,
  showInfoNotification?: (message: string, title?: string) => void,
  messages?: DashboardMessages["notifications"],
  resultMessages?: EventMessages["results"],
  templateMessages?: EventMessages["editor"]["template"],
  notificationMessages?: NotificationMessages,
) {
  const [events, setEvents] = useState<EventDefinition[]>([]);
  const [eventInstances, setEventInstances] = useState<ScheduledEvent[]>([]);
  const [todayEvents, setTodayEvents] = useState<ScheduledEvent[]>([]);
  const [eventGroups, setEventGroups] = useState<EventGroupOption[]>([]);
  const [eventLoading, setEventLoading] = useState(true);
  const [eventCacheReady, setEventCacheReady] = useState(false);
  const [eventActionPending, setEventActionPending] = useState(false);
  const eventActionPendingCount = useRef(0);
  const actionFailedTitle = (
    action: keyof NotificationMessages["actionWords"],
    subject: keyof NotificationMessages["subjectWords"],
  ) =>
    notificationMessages?.actionFailedTitle?.(
      notificationMessages.actionWords[action],
      notificationMessages.subjectWords[subject],
    ) ??
    `${String(action).charAt(0).toUpperCase() + String(action).slice(1)} ${
      String(subject).charAt(0).toUpperCase() + String(subject).slice(1)
    } failed`;

  const applyEventData = useCallback((data: EventDashboardData) => {
    setEvents(data.events);
    setEventInstances(data.eventInstances ?? []);
    setTodayEvents(data.todayEvents);
    setEventGroups(data.eventGroups ?? []);
    setEventLoading(false);
    setEventCacheReady(true);
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const cachedData = readDashboardBrowserCacheSection(userId, "events");

      setEvents(cachedData?.events ?? []);
      setEventInstances(cachedData?.eventInstances ?? []);
      setTodayEvents(cachedData?.todayEvents ?? []);
      setEventGroups(cachedData?.eventGroups ?? []);
      setEventLoading(cachedData === null);
      setEventCacheReady(cachedData !== null);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [userId]);

  useEffect(() => {
    if (!eventCacheReady) {
      return;
    }

    writeDashboardBrowserCacheSection(userId, "events", {
      events,
      eventInstances,
      todayEvents,
      eventGroups,
    });
  }, [eventCacheReady, eventGroups, eventInstances, events, todayEvents, userId]);

  const refreshEventData = useCallback(async () => {
    const actionResult = await runNotifiedServerAction({
      action: getEventDashboardData,
      messages: notificationMessages,
      showErrorNotification,
    });

    if (!actionResult.ok) {
      setEventLoading(false);
      return;
    }

    const result = actionResult.value;

    if (!result.ok) {
      notifyActionFailure({
        result,
        resultMessages,
        fallbackTitle: messages?.eventsUnavailable ?? "Events unavailable",
        notificationMessages,
        showErrorNotification,
      });
      setEventLoading(false);
      return;
    }

    applyEventData(result.data);
  }, [
    applyEventData,
    messages,
    notificationMessages,
    resultMessages,
    showErrorNotification,
  ]);

  function beginEventAction() {
    eventActionPendingCount.current += 1;
    setEventActionPending(true);
  }

  function finishEventAction() {
    eventActionPendingCount.current = Math.max(
      eventActionPendingCount.current - 1,
      0,
    );

    if (eventActionPendingCount.current === 0) {
      setEventActionPending(false);
    }
  }

  async function runEventManagementAction(
    action: EventDataAction,
    failureTitle: string,
  ) {
    beginEventAction();

    try {
      const actionResult = await runNotifiedServerAction({
        action,
        messages: notificationMessages,
        showErrorNotification,
      });

      if (!actionResult.ok) {
        return false;
      }

      const result = actionResult.value;

      if (!result.ok) {
        notifyActionFailure({
          result,
          resultMessages,
          fallbackTitle: failureTitle,
          notificationMessages,
          showErrorNotification,
        });
        return false;
      }

      applyEventData(result.data);
      return true;
    } finally {
      finishEventAction();
    }
  }

  async function parseEventTemplateFromPage(
    eventId: string | null,
    source: string,
  ): Promise<EventTemplateParseData | null> {
    const actionResult = await runNotifiedServerAction({
      action: () => parseEventTemplate(eventId, source),
      messages: notificationMessages,
      showErrorNotification,
    });

    if (!actionResult.ok) {
      return null;
    }

    const result = actionResult.value;

    if (!result.ok) {
      notifyActionFailure({
        result,
        resultMessages,
        fallbackTitle: actionFailedTitle(eventId ? "update" : "save", "event"),
        notificationMessages,
        showErrorNotification,
      });
      return null;
    }

    if (result.data.preview.ignoredFieldCount > 0) {
      showInfoNotification?.(
        templateMessages?.ignoredFields(result.data.preview.ignoredFieldCount) ??
          `${result.data.preview.ignoredFieldCount} template fields were ignored.`,
        templateMessages?.ignoredFieldsTitle ?? "Template parsed with warnings",
      );
    }

    return result.data;
  }

  return {
    events,
    eventInstances,
    todayEvents,
    eventGroups,
    eventLoading,
    eventActionPending,
    refreshEventData,
    saveEventFromPage: (input: EventInput) =>
      runEventManagementAction(
        () => saveEvent(input),
        actionFailedTitle("save", "event"),
      ),
    deleteEventFromPage: (eventId: string) =>
      runEventManagementAction(
        () => deleteEvent(eventId),
        actionFailedTitle("delete", "event"),
      ),
    saveEventGroupFromPage: (input: EventGroupInput) =>
      runEventManagementAction(
        () => saveEventGroup(input),
        actionFailedTitle("save", "group"),
      ),
    deleteEventGroupFromPage: (groupId: string) =>
      runEventManagementAction(
        () => deleteEventGroup(groupId),
        actionFailedTitle("delete", "group"),
      ),
    saveEventInstanceFromPage: (input: EventInstanceInput) =>
      runEventManagementAction(
        () => saveEventInstance(input),
        actionFailedTitle("update", "event"),
      ),
    cancelEventInstanceFromPage: (
      input: Pick<EventInstanceInput, "id" | "reason">,
    ) =>
      runEventManagementAction(
        () => cancelEventInstance(input),
        actionFailedTitle("delete", "event"),
      ),
    parseEventTemplateFromPage,
    applyEventTemplateFromPage: (eventId: string | null, source: string) =>
      runEventManagementAction(
        () => applyEventTemplate(eventId, source),
        actionFailedTitle(eventId ? "update" : "save", "event"),
      ),
  };
}
