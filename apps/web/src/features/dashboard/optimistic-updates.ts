import type {
  MemorySuggestion,
  PinnedMemory,
  PinnedMemoryStatus,
  Routine,
  RoutineStatus,
  Task,
  TaskStatus,
} from "./types";

export function applyOptimisticTaskStatus(
  tasks: Task[],
  taskId: string,
  status: TaskStatus,
): Task[] {
  return tasks.map((task) =>
    task.id === taskId
      ? {
          ...task,
          status,
          completedWeight: status === "done" ? task.weight : task.completedWeight,
        }
      : {
          ...task,
          subtasks: task.subtasks?.map((subtask) =>
            subtask.id === taskId
              ? {
                  ...subtask,
                  status,
                  done: status === "done",
                  completedWeight:
                    status === "done" ? subtask.weight : subtask.completedWeight,
                }
              : subtask,
          ),
        },
  );
}

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

export function addPendingSuggestionId(
  pendingSuggestionIds: string[],
  memoryId: string,
): string[] {
  if (pendingSuggestionIds.includes(memoryId)) {
    return pendingSuggestionIds;
  }

  return [...pendingSuggestionIds, memoryId];
}

export function removePendingSuggestionId(
  pendingSuggestionIds: string[],
  memoryId: string,
): string[] {
  return pendingSuggestionIds.filter(
    (pendingMemoryId) => pendingMemoryId !== memoryId,
  );
}

export function removeMemorySuggestion(
  suggestions: MemorySuggestion[],
  memoryId: string,
): MemorySuggestion[] {
  return suggestions.filter((suggestion) => suggestion.id !== memoryId);
}
