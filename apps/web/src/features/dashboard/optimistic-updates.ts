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
        }
      : {
          ...task,
          subtasks: task.subtasks?.map((subtask) =>
            subtask.id === taskId
              ? {
                  ...subtask,
                  isDone: status === "done",
                  done: status === "done",
                }
              : subtask,
          ),
        },
  );
}

export function applyOptimisticSubtaskDone(
  tasks: Task[],
  subtaskId: string,
  done: boolean,
): Task[] {
  return tasks.map((task) => {
    let changed = false;
    const subtasks = task.subtasks?.map((subtask) => {
      if (subtask.id !== subtaskId) {
        return subtask;
      }

      changed = true;
      return { ...subtask, isDone: done, done };
    });

    if (!subtasks || !changed) {
      return task;
    }

    return {
      ...task,
      subtasks,
      subtaskSummary: subtaskSummary(subtasks),
    };
  });
}

export function restoreTaskSnapshot(
  tasks: Task[],
  snapshot: Task[],
  taskId: string,
): Task[] {
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

export function restoreSubtaskSnapshot(
  tasks: Task[],
  snapshot: Task[],
  subtaskId: string,
): Task[] {
  const previousTask = snapshot.find((task) =>
    task.subtasks?.some((subtask) => subtask.id === subtaskId),
  );
  const previousSubtask = previousTask?.subtasks?.find(
    (subtask) => subtask.id === subtaskId,
  );

  if (!previousTask || !previousSubtask) {
    return tasks;
  }

  return tasks.map((task) => {
    if (task.id !== previousTask.id || !task.subtasks) {
      return task;
    }

    const subtasks = task.subtasks.map((subtask) =>
      subtask.id === subtaskId ? previousSubtask : subtask,
    );

    return {
      ...task,
      subtasks,
      subtaskSummary: subtaskSummary(subtasks),
    };
  });
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

function subtaskSummary(subtasks: NonNullable<Task["subtasks"]>) {
  const doneCount = subtasks.filter((subtask) => subtask.done).length;

  return `${doneCount} of ${subtasks.length} subtasks done`;
}
