// Dashboard Page.
import { PinnedMemoriesPanel } from "@/features/memories/components/PinnedMemoriesPanel";
import { ProjectTasksPanel } from "@/features/projects/components/ProjectTasksPanel";
import { RoutinesPanel } from "@/features/routines/components/RoutinesPanel";
import type {
  PinnedMemory,
  Routine,
  RoutineStatus,
  Task,
  TaskStatus,
} from "../types";

export function Dashboard({
  darkMode,
  tasks,
  taskLoading,
  pendingTaskIds,
  routines,
  routineLoading,
  routineActionPending,
  routineMessage,
  pinnedMemories,
  memoryLoading,
  memoryActionPending,
  onTaskStatus,
  onRoutineStatus,
  onMemoryDone,
  onMemoryCancelDone,
  onMemoryReplace,
}: {
  darkMode: boolean;
  tasks: Task[];
  taskLoading: boolean;
  pendingTaskIds: string[];
  routines: Routine[];
  routineLoading: boolean;
  routineActionPending: boolean;
  routineMessage: string | null;
  pinnedMemories: PinnedMemory[];
  memoryLoading: boolean;
  memoryActionPending: boolean;
  onTaskStatus: (
    taskId: string,
    status: Exclude<TaskStatus, "archived">,
  ) => void;
  onRoutineStatus: (routineId: string, status: RoutineStatus) => void;
  onMemoryDone: (pinnedMemoryId: string) => void;
  onMemoryCancelDone: (pinnedMemoryId: string) => void;
  onMemoryReplace: (pinnedMemoryId: string) => void;
}) {
  return (
    <section className="aa-split-container">
      <div className="aa-split-panel gap-4">
        <ProjectTasksPanel
          darkMode={darkMode}
          tasks={tasks}
          loading={taskLoading}
          pendingTaskIds={pendingTaskIds}
          onTaskDone={(taskId) => onTaskStatus(taskId, "done")}
        />

        <aside className="grid content-start gap-4">
          <RoutinesPanel
            darkMode={darkMode}
            routines={routines}
            loading={routineLoading}
            disabled={routineActionPending}
            message={routineMessage}
            onRoutineStatus={onRoutineStatus}
          />

          <PinnedMemoriesPanel
            darkMode={darkMode}
            pinnedMemories={pinnedMemories}
            loading={memoryLoading}
            disabled={memoryActionPending}
            onDone={onMemoryDone}
            onCancelDone={onMemoryCancelDone}
            onReplace={onMemoryReplace}
          />
        </aside>
      </div>
    </section>
  );
}
