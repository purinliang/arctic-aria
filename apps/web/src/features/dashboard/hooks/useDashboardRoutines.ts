import { useCallback, useEffect, useRef, useState } from "react";
import {
  readDashboardBrowserCacheSection,
  writeDashboardBrowserCacheSection,
} from "@/app-shell/dashboard-browser-cache";
import {
  completeRoutineInstance,
  deleteRoutine,
  getRoutineDashboardData,
  reopenRoutineInstance,
  saveRoutine,
  skipRoutineInstance,
  type RoutineActionResult,
  type RoutineDashboardData,
  type RoutineInput,
} from "@/features/routines/actions";
import { localizedActionMessage } from "@/messages/action-result";
import type {
  DashboardMessages,
  RoutineMessages,
} from "@/messages/app-messages";
import {
  applyOptimisticRoutineStatus,
  restoreRoutineSnapshot,
} from "../optimistic-updates";
import type {
  Routine,
  RoutineDefinition,
  RoutineStatus,
} from "../types";

type RoutineDataAction = () => Promise<
  RoutineActionResult<RoutineDashboardData>
>;

export function useDashboardRoutines(
  userId: string,
  showErrorNotification: (message: string, title?: string) => void,
  messages?: DashboardMessages["notifications"],
  resultMessages?: RoutineMessages["results"],
) {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [routineDefinitions, setRoutineDefinitions] = useState<
    RoutineDefinition[]
  >([]);
  const [routineLoading, setRoutineLoading] = useState(true);
  const [routineCacheReady, setRoutineCacheReady] = useState(false);
  const [routineActionPending, setRoutineActionPending] = useState(false);
  const routineActionPendingCount = useRef(0);
  const routineStatusRequestChains = useRef(new Map<string, Promise<void>>());
  const routineStatusRequestVersions = useRef(new Map<string, number>());

  const applyRoutineData = useCallback((data: RoutineDashboardData) => {
    setRoutines(data.routines);
    setRoutineDefinitions(data.routineDefinitions);
    setRoutineLoading(false);
    setRoutineCacheReady(true);
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const cachedData = readDashboardBrowserCacheSection(userId, "routines");

      setRoutines(cachedData?.routines ?? []);
      setRoutineDefinitions(cachedData?.routineDefinitions ?? []);
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
      routineDefinitions,
    });
  }, [routineCacheReady, routineDefinitions, routines, userId]);

  const refreshRoutineData = useCallback(async () => {
    const result = await getRoutineDashboardData();

    if (!result.ok) {
      showErrorNotification(
        localizedActionMessage(result, resultMessages),
        messages?.routinesUnavailable ?? "Routines unavailable",
      );
      setRoutineLoading(false);
      return;
    }

    applyRoutineData(result.data);
  }, [applyRoutineData, messages, resultMessages, showErrorNotification]);

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
      const result = await action();

      if (!result.ok) {
        showErrorNotification(
          localizedActionMessage(result, resultMessages),
          failureTitle,
        );
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
      const result = await action();

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
        showErrorNotification(localizedActionMessage(result, resultMessages));
        return;
      }
    } finally {
      finishRoutineAction();
    }
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
    routineDefinitions,
    routineLoading,
    routineActionPending,
    refreshRoutineData,
    updateRoutine,
    saveRoutineFromPage: (input: RoutineInput) =>
      runRoutineManagementAction(
        () => saveRoutine(input),
        messages?.routineSaveFailed ?? "Routine save failed",
      ),
    deleteRoutineFromPage: (routineId: string) =>
      runRoutineManagementAction(
        () => deleteRoutine(routineId),
        messages?.routineDeleteFailed ?? "Routine delete failed",
      ),
  };
}
