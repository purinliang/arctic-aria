import type {
  PinnedMemory,
  PinnedMemoryStatus,
  Routine,
  RoutineStatus,
} from "./types";

export function applyOptimisticRoutineStatus(
  routines: Routine[],
  routineId: string,
  status: RoutineStatus,
): Routine[] {
  return routines.map((routine) =>
    routine.id === routineId
      ? {
          ...routine,
          status,
          reminderState: "idle" as const,
          streakText: "Answered today",
        }
      : routine,
  );
}

export function applyOptimisticPinnedMemoryStatus(
  pinnedMemories: PinnedMemory[],
  pinnedMemoryId: string,
  status: PinnedMemoryStatus,
): PinnedMemory[] {
  return pinnedMemories.map((memory) =>
    memory.id === pinnedMemoryId
      ? {
          ...memory,
          status,
          meta:
            status === "completed"
              ? "Completed; cleanup is pending"
              : "Visible window restored",
        }
      : memory,
  );
}
