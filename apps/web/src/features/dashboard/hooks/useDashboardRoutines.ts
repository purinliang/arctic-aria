import { useCallback, useState } from "react";
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
import { applyOptimisticRoutineStatus } from "../optimistic-updates";
import type {
  Routine,
  RoutineDefinition,
  RoutineStatus,
} from "../types";

type RoutineDataAction = () => Promise<
  RoutineActionResult<RoutineDashboardData>
>;

export function useDashboardRoutines(
  showErrorNotification: (message: string, title?: string) => void,
) {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [routineDefinitions, setRoutineDefinitions] = useState<
    RoutineDefinition[]
  >([]);
  const [routineLoading, setRoutineLoading] = useState(true);
  const [routineMessage, setRoutineMessage] = useState<string | null>(null);
  const [routineActionPending, setRoutineActionPending] = useState(false);

  const applyRoutineData = useCallback((data: RoutineDashboardData) => {
    setRoutines(data.routines);
    setRoutineDefinitions(data.routineDefinitions);
  }, []);

  const refreshRoutineData = useCallback(async () => {
    const result = await getRoutineDashboardData();

    if (!result.ok) {
      setRoutineMessage(result.message);
      setRoutines([]);
      setRoutineDefinitions([]);
      setRoutineLoading(false);
      return;
    }

    applyRoutineData(result.data);
    setRoutineLoading(false);
  }, [applyRoutineData]);

  async function runRoutineAction(
    action: RoutineDataAction,
    onFailure?: () => void,
  ) {
    setRoutineMessage(null);
    setRoutineActionPending(true);

    try {
      const result = await action();

      if (!result.ok) {
        onFailure?.();
        showErrorNotification(result.message);
        return;
      }

      applyRoutineData(result.data);
    } finally {
      setRoutineActionPending(false);
    }
  }

  async function runRoutineManagementAction(action: RoutineDataAction) {
    setRoutineMessage(null);
    setRoutineActionPending(true);

    try {
      const result = await action();

      if (!result.ok) {
        setRoutineMessage(result.message);
        return false;
      }

      applyRoutineData(result.data);
      return true;
    } finally {
      setRoutineActionPending(false);
    }
  }

  function updateRoutine(routineId: string, status: RoutineStatus) {
    const previousRoutines = routines;

    setRoutines((current) =>
      applyOptimisticRoutineStatus(current, routineId, status),
    );
    void runRoutineAction(
      () =>
        status === "completed"
          ? completeRoutineInstance(routineId)
          : status === "skipped"
            ? skipRoutineInstance(routineId)
            : reopenRoutineInstance(routineId),
      () => setRoutines(previousRoutines),
    );
  }

  return {
    routines,
    routineDefinitions,
    routineLoading,
    routineMessage,
    routineActionPending,
    refreshRoutineData,
    updateRoutine,
    saveRoutineFromPage: (input: RoutineInput) =>
      runRoutineManagementAction(() => saveRoutine(input)),
    deleteRoutineFromPage: (routineId: string) =>
      runRoutineManagementAction(() => deleteRoutine(routineId)),
    clearRoutineMessage: () => setRoutineMessage(null),
    markRoutineBusy: () => {
      setRoutineMessage(
        "Busy will snooze reminders after reminder jobs are implemented.",
      );
    },
  };
}
