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
import { localizedActionMessage } from "@/messages/action-result";
import type {
  DashboardMessages,
  RoutineMessages,
} from "@/messages/app-messages";
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
  messages?: DashboardMessages["notifications"],
  resultMessages?: RoutineMessages["results"],
) {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [routineDefinitions, setRoutineDefinitions] = useState<
    RoutineDefinition[]
  >([]);
  const [routineLoading, setRoutineLoading] = useState(true);
  const [routineActionPending, setRoutineActionPending] = useState(false);

  const applyRoutineData = useCallback((data: RoutineDashboardData) => {
    setRoutines(data.routines);
    setRoutineDefinitions(data.routineDefinitions);
  }, []);

  const refreshRoutineData = useCallback(async () => {
    const result = await getRoutineDashboardData();

    if (!result.ok) {
      showErrorNotification(
        localizedActionMessage(result, resultMessages),
        messages?.routinesUnavailable ?? "Routines unavailable",
      );
      setRoutines([]);
      setRoutineDefinitions([]);
      setRoutineLoading(false);
      return;
    }

    applyRoutineData(result.data);
    setRoutineLoading(false);
  }, [applyRoutineData, messages, resultMessages, showErrorNotification]);

  async function runRoutineAction(
    action: RoutineDataAction,
    onFailure?: () => void,
  ) {
    setRoutineActionPending(true);

    try {
      const result = await action();

      if (!result.ok) {
        onFailure?.();
        showErrorNotification(localizedActionMessage(result, resultMessages));
        return;
      }

      applyRoutineData(result.data);
    } finally {
      setRoutineActionPending(false);
    }
  }

  async function runRoutineManagementAction(
    action: RoutineDataAction,
    failureTitle: string,
  ) {
    setRoutineActionPending(true);

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
