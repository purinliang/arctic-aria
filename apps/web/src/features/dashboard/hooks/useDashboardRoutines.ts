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
  applyRoutineTemplate,
  deleteRoutineGroup,
  deleteRoutine,
  getRoutineDashboardData,
  parseRoutineTemplate,
  saveRoutineGroup,
  saveRoutine,
  type RoutineActionResult,
  type RoutineDashboardData,
  type RoutineGroupInput,
  type RoutineInput,
  type RoutineTemplateParseData,
} from "@/features/routines/actions";
import {
  completeRoutineInstance,
  reopenRoutineInstance,
  skipRoutineInstance,
} from "@/features/routines/routine-instance-actions";
import type {
  DashboardMessages,
  NotificationMessages,
  RoutineMessages,
} from "@/messages/app-messages";
import {
  applyOptimisticRoutineStatus,
  restoreRoutineSnapshot,
} from "../optimistic-updates";
import type {
  Routine,
  RoutineDefinition,
  RoutineGroupOption,
  RoutineStatus,
} from "../types";

type RoutineDataAction = () => Promise<
  RoutineActionResult<RoutineDashboardData>
>;

export function useDashboardRoutines(
  userId: string,
  showErrorNotification: (message: string, title?: string) => void,
  showInfoNotification?: (message: string, title?: string) => void,
  messages?: DashboardMessages["notifications"],
  resultMessages?: RoutineMessages["results"],
  templateMessages?: RoutineMessages["editor"]["template"],
  notificationMessages?: NotificationMessages,
) {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [routineInstances, setRoutineInstances] = useState<Routine[]>([]);
  const [routineDefinitions, setRoutineDefinitions] = useState<
    RoutineDefinition[]
  >([]);
  const [routineGroups, setRoutineGroups] = useState<RoutineGroupOption[]>([]);
  const [routineLoading, setRoutineLoading] = useState(true);
  const [routineCacheReady, setRoutineCacheReady] = useState(false);
  const [routineActionPending, setRoutineActionPending] = useState(false);
  const routineActionPendingCount = useRef(0);
  const routineStatusRequestChains = useRef(new Map<string, Promise<void>>());
  const routineStatusRequestVersions = useRef(new Map<string, number>());
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

  const applyRoutineData = useCallback((data: RoutineDashboardData) => {
    setRoutines(data.routines);
    setRoutineInstances(data.routineInstances ?? []);
    setRoutineDefinitions(data.routineDefinitions);
    setRoutineGroups(data.routineGroups);
    setRoutineLoading(false);
    setRoutineCacheReady(true);
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const cachedData = readDashboardBrowserCacheSection(userId, "routines");

      setRoutines(cachedData?.routines ?? []);
      setRoutineInstances(cachedData?.routineInstances ?? []);
      setRoutineDefinitions(cachedData?.routineDefinitions ?? []);
      setRoutineGroups(cachedData?.routineGroups ?? []);
      setRoutineLoading(cachedData === null);
      setRoutineCacheReady(cachedData !== null);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [userId]);

  useEffect(() => {
    if (!routineCacheReady) {
      return;
    }

    writeDashboardBrowserCacheSection(userId, "routines", {
      routines,
      routineInstances,
      routineDefinitions,
      routineGroups,
    });
  }, [
    routineCacheReady,
    routineDefinitions,
    routineGroups,
    routineInstances,
    routines,
    userId,
  ]);

  const refreshRoutineData = useCallback(async () => {
    const actionResult = await runNotifiedServerAction({
      action: getRoutineDashboardData,
      messages: notificationMessages,
      showErrorNotification,
    });

    if (!actionResult.ok) {
      setRoutineLoading(false);
      return;
    }

    const result = actionResult.value;

    if (!result.ok) {
      notifyActionFailure({
        result,
        resultMessages,
        fallbackTitle: messages?.routinesUnavailable ?? "Routines unavailable",
        notificationMessages,
        showErrorNotification,
      });
      setRoutineLoading(false);
      return;
    }

    applyRoutineData(result.data);
  }, [
    applyRoutineData,
    messages,
    notificationMessages,
    resultMessages,
    showErrorNotification,
  ]);

  function beginRoutineAction() {
    routineActionPendingCount.current += 1;
    setRoutineActionPending(true);
  }

  function finishRoutineAction() {
    routineActionPendingCount.current = Math.max(
      routineActionPendingCount.current - 1,
      0,
    );

    if (routineActionPendingCount.current === 0) {
      setRoutineActionPending(false);
    }
  }

  async function runRoutineManagementAction(
    action: RoutineDataAction,
    failureTitle: string,
  ) {
    beginRoutineAction();

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

      applyRoutineData(result.data);
      return true;
    } finally {
      finishRoutineAction();
    }
  }

  async function runRoutineStatusAction({
    routineId,
    requestVersion,
    snapshot,
    action,
  }: {
    routineId: string;
    requestVersion: number;
    snapshot: Routine[];
    action: RoutineDataAction;
  }) {
    beginRoutineAction();

    try {
      const actionResult = await runNotifiedServerAction({
        action,
        messages: notificationMessages,
        showErrorNotification,
      });

      if (!actionResult.ok) {
        if (
          routineStatusRequestVersions.current.get(routineId) ===
          requestVersion
        ) {
          setRoutines((current) =>
            restoreRoutineSnapshot(current, snapshot, routineId),
          );
        }
        return;
      }

      const result = actionResult.value;

      if (!result.ok) {
        if (
          routineStatusRequestVersions.current.get(routineId) !==
          requestVersion
        ) {
          return;
        }

        setRoutines((current) =>
          restoreRoutineSnapshot(current, snapshot, routineId),
        );
        notifyActionFailure({
          result,
          resultMessages,
          fallbackTitle: actionFailedTitle("update", "routine"),
          notificationMessages,
          showErrorNotification,
        });
        return;
      }
    } finally {
      finishRoutineAction();
    }
  }

  async function parseRoutineTemplateFromPage(
    routineId: string | null,
    source: string,
  ): Promise<RoutineTemplateParseData | null> {
    const actionResult = await runNotifiedServerAction({
      action: () => parseRoutineTemplate(routineId, source),
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
        fallbackTitle: actionFailedTitle(
          routineId ? "update" : "save",
          "routine",
        ),
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

  function updateRoutine(routineId: string, status: RoutineStatus) {
    let previousRoutines = routines;
    const requestVersion =
      (routineStatusRequestVersions.current.get(routineId) ?? 0) + 1;

    routineStatusRequestVersions.current.set(routineId, requestVersion);

    setRoutines((current) => {
      previousRoutines = current;
      return applyOptimisticRoutineStatus(current, routineId, status);
    });
    const previousRequest =
      routineStatusRequestChains.current.get(routineId) ?? Promise.resolve();
    const request = previousRequest
      .catch(() => undefined)
      .then(() =>
        runRoutineStatusAction({
          routineId,
          requestVersion,
          snapshot: previousRoutines,
          action: () =>
            status === "completed"
              ? completeRoutineInstance(routineId)
              : status === "skipped"
                ? skipRoutineInstance(routineId)
                : reopenRoutineInstance(routineId),
        }),
      );

    routineStatusRequestChains.current.set(routineId, request);
    void request.finally(() => {
      if (routineStatusRequestChains.current.get(routineId) === request) {
        routineStatusRequestChains.current.delete(routineId);
      }
    });
  }

  return {
    routines,
    routineInstances,
    routineDefinitions,
    routineGroups,
    routineLoading,
    routineActionPending,
    refreshRoutineData,
    updateRoutine,
    updateRoutineInstanceFromPage: (instanceId: string, status: RoutineStatus) =>
      runRoutineManagementAction(
        () =>
          status === "completed"
            ? completeRoutineInstance(instanceId)
            : status === "skipped"
              ? skipRoutineInstance(instanceId)
              : reopenRoutineInstance(instanceId),
        actionFailedTitle("update", "routine"),
      ),
    saveRoutineFromPage: (input: RoutineInput) =>
      runRoutineManagementAction(
        () => saveRoutine(input),
        actionFailedTitle("save", "routine"),
      ),
    deleteRoutineFromPage: (routineId: string) =>
      runRoutineManagementAction(
        () => deleteRoutine(routineId),
        actionFailedTitle("delete", "routine"),
      ),
    parseRoutineTemplateFromPage,
    applyRoutineTemplateFromPage: (routineId: string | null, source: string) =>
      runRoutineManagementAction(
        () => applyRoutineTemplate(routineId, source),
        actionFailedTitle(routineId ? "update" : "save", "routine"),
      ),
    saveRoutineGroupFromPage: (input: RoutineGroupInput) =>
      runRoutineManagementAction(
        () => saveRoutineGroup(input),
        actionFailedTitle("save", "group"),
      ),
    deleteRoutineGroupFromPage: (groupId: string) =>
      runRoutineManagementAction(
        () => deleteRoutineGroup(groupId),
        actionFailedTitle("delete", "group"),
      ),
  };
}
