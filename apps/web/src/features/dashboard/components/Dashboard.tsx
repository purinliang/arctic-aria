// Dashboard Page.
import { PinnedMemoriesPanel } from "@/features/memories/components/PinnedMemoriesPanel";
import { ProjectTasksPanel } from "@/features/projects/components/ProjectTasksPanel";
import { RoutinesPanel } from "@/features/routines/components/RoutinesPanel";
import type { DashboardMessages } from "@/messages/app-messages";
import type { FormMessages } from "@/messages/app-messages";
import type { TimeFormatPreference } from "@/features/settings/preferences";
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
  onTaskOpen,
  onRoutineOpen,
  onMemoryOpen,
  messages,
  formMessages,
  timeFormatPreference,
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
  onTaskOpen: (projectId: string) => void;
  onRoutineOpen: () => void;
  onMemoryOpen: () => void;
  messages: DashboardMessages;
  formMessages: FormMessages;
  timeFormatPreference: TimeFormatPreference;
}) {
  return (
    <section className="aa-split-container">
      <div className="aa-split-panel gap-4">
        <ProjectTasksPanel
          darkMode={darkMode}
          tasks={tasks}
          loading={taskLoading}
          messages={messages.projectTasks}
          dateMessages={formMessages.datePicker}
          onTaskStatus={onTaskStatus}
          onTaskOpen={onTaskOpen}
        />

        <aside className="grid content-start gap-4">
          <RoutinesPanel
            darkMode={darkMode}
            routines={routines}
            loading={routineLoading}
            disabled={routineActionPending}
            messages={messages.routines}
            timeMessages={formMessages.timePicker}
            timeFormatPreference={timeFormatPreference}
            onRoutineStatus={onRoutineStatus}
            onRoutineOpen={onRoutineOpen}
          />

          <PinnedMemoriesPanel
            darkMode={darkMode}
            pinnedMemories={pinnedMemories}
            loading={memoryLoading}
            disabled={memoryActionPending}
            messages={messages.pinnedMemories}
            dateMessages={formMessages.datePicker}
            onDone={onMemoryDone}
            onCancelDone={onMemoryCancelDone}
            onMemoryOpen={onMemoryOpen}
          />
        </aside>
      </div>
    </section>
  );
}
