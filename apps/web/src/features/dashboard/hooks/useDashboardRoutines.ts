import { useCallback, useState } from "react";
import {
  completeRoutineInstance,
  deleteRoutine,
  getRoutineDashboardData,
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
  const [expandedRoutineId, setExpandedRoutineId] = useState<string | null>(null);

  const applyRoutineData = useCallback(
    (data: RoutineDashboardData, nextExpandedRoutineId?: string | null) => {
      setRoutines(data.routines);
      setRoutineDefinitions(data.routineDefinitions);
      setExpandedRoutineId((current) => {
        if (nextExpandedRoutineId !== undefined) {
          return nextExpandedRoutineId;
        }

        if (current && data.routines.some((routine) => routine.id === current)) {
          return current;
        }

        return (
          data.routines.find(
            (routine) => routine.reminderState === "reminding",
          )?.id ?? null
        );
      });
    },
    [],
  );

  const refreshRoutineData = useCallback(async () => {
    const result = await getRoutineDashboardData();

    if (!result.ok) {
      setRoutineMessage(result.message);
      setRoutines([]);
      setRoutineDefinitions([]);
      setExpandedRoutineId(null);
      setRoutineLoading(false);
      return;
    }

    applyRoutineData(result.data);
    setRoutineLoading(false);
  }, [applyRoutineData]);

  async function runRoutineAction(
    action: RoutineDataAction,
    nextExpandedRoutineId: string | null,
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

      applyRoutineData(result.data, nextExpandedRoutineId);
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

    setExpandedRoutineId(null);
    setRoutines((current) =>
      applyOptimisticRoutineStatus(current, routineId, status),
    );
    void runRoutineAction(
      () =>
        status === "completed"
          ? completeRoutineInstance(routineId)
          : skipRoutineInstance(routineId),
      null,
      () => setRoutines(previousRoutines),
    );
  }

  return {
    routines,
    routineDefinitions,
    routineLoading,
    routineMessage,
    routineActionPending,
    expandedRoutineId,
    setExpandedRoutineId,
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
      setExpandedRoutineId(null);
    },
  };
}
