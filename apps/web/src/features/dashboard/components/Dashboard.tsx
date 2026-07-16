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
  routines,
  routineLoading,
  routineActionPending,
  pinnedMemories,
  memoryLoading,
  memoryActionPending,
  onTaskStatus,
  onRoutineStatus,
  onMemoryDone,
  onMemoryCancelDone,
  onMemoryReplace,
  onTaskOpen,
  onRoutineOpen,
  onMemoryOpen,
}: {
  darkMode: boolean;
  tasks: Task[];
  taskLoading: boolean;
  routines: Routine[];
  routineLoading: boolean;
  routineActionPending: boolean;
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
  onTaskOpen: (projectId: string) => void;
  onRoutineOpen: () => void;
  onMemoryOpen: () => void;
}) {
  return (
    <section className="aa-split-container">
      <div className="aa-split-panel gap-4">
        <ProjectTasksPanel
          darkMode={darkMode}
          tasks={tasks}
          loading={taskLoading}
          onTaskStatus={onTaskStatus}
          onTaskOpen={onTaskOpen}
        />

        <aside className="grid content-start gap-4">
          <RoutinesPanel
            darkMode={darkMode}
            routines={routines}
            loading={routineLoading}
            disabled={routineActionPending}
            onRoutineStatus={onRoutineStatus}
            onRoutineOpen={onRoutineOpen}
          />

          <PinnedMemoriesPanel
            darkMode={darkMode}
            pinnedMemories={pinnedMemories}
            loading={memoryLoading}
            disabled={memoryActionPending}
            onDone={onMemoryDone}
            onCancelDone={onMemoryCancelDone}
            onReplace={onMemoryReplace}
            onMemoryOpen={onMemoryOpen}
          />
        </aside>
      </div>
    </section>
  );
}
