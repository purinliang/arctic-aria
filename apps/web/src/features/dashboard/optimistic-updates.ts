import type {
  MemorySuggestion,
  PinnedMemory,
  PinnedMemoryStatus,
  Routine,
  RoutineStatus,
  Task,
  TaskStatus,
} from "./types";

export function applyOptimisticTaskStatus<TaskItem extends Task>(
  tasks: TaskItem[],
  taskId: string,
  status: TaskStatus,
): TaskItem[] {
  return tasks.map((task) =>
    task.id === taskId
      ? {
          ...task,
          status,
        }
      : task,
  );
}

export function applyDashboardTaskStatus<TaskItem extends Task>(
  tasks: TaskItem[],
  taskId: string,
  status: TaskStatus,
): TaskItem[] {
  return applyOptimisticTaskStatus(tasks, taskId, status);
}

export function dashboardTaskStatusForChecked(
  checked: boolean,
): TaskStatus {
  return checked ? "done" : "todo";
}

export function restoreTaskSnapshot<TaskItem extends Task>(
  tasks: TaskItem[],
  snapshot: TaskItem[],
  taskId: string,
): TaskItem[] {
  const previousTask = snapshot.find((task) => task.id === taskId);

  if (!previousTask) {
    return tasks;
  }

  if (!tasks.some((task) => task.id === taskId)) {
    const previousIndex = snapshot.findIndex((task) => task.id === taskId);
    const restored = [...tasks];

    restored.splice(Math.max(previousIndex, 0), 0, previousTask);
    return restored;
  }

  return tasks.map((task) => (task.id === taskId ? previousTask : task));
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
          streakText: status === "pending" ? "Due today" : "Answered today",
        }
      : routine,
  );
}

export function restoreRoutineSnapshot(
  routines: Routine[],
  snapshot: Routine[],
  routineId: string,
): Routine[] {
  const previousRoutine = snapshot.find((routine) => routine.id === routineId);

  if (!previousRoutine) {
    return routines;
  }

  return routines.map((routine) =>
    routine.id === routineId ? previousRoutine : routine,
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
        }
      : memory,
  );
}

export function restorePinnedMemorySnapshot(
  pinnedMemories: PinnedMemory[],
  snapshot: PinnedMemory[],
  pinnedMemoryId: string,
): PinnedMemory[] {
  const previousPinnedMemory = snapshot.find(
    (memory) => memory.id === pinnedMemoryId,
  );

  if (!previousPinnedMemory) {
    return pinnedMemories;
  }

  return pinnedMemories.map((memory) =>
    memory.id === pinnedMemoryId ? previousPinnedMemory : memory,
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
