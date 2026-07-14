import type {
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
