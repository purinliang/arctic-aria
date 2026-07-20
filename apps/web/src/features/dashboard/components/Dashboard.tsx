// Dashboard Page.
import { PinnedMemoriesPanel } from "@/features/memories/components/PinnedMemoriesPanel";
import { ProjectTasksPanel } from "@/features/projects/components/ProjectTasksPanel";
import { RoutinesPanel } from "@/features/routines/components/RoutinesPanel";
import { TodayReviewPanel } from "./TodayReviewPanel";
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
  pinnedMemories,
  memoryLoading,
  todayReviewPending,
  showTodayReviewSendAction,
  onTaskStatus,
  onRoutineStatus,
  onMemoryDone,
  onMemoryCancelDone,
  onTodayReviewSend,
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
  pinnedMemories: PinnedMemory[];
  memoryLoading: boolean;
  todayReviewPending: boolean;
  showTodayReviewSendAction: boolean;
  onTaskStatus: (
    taskId: string,
    status: TaskStatus,
  ) => void;
  onRoutineStatus: (routineId: string, status: RoutineStatus) => void;
  onMemoryDone: (pinnedMemoryId: string) => void;
  onMemoryCancelDone: (pinnedMemoryId: string) => void;
  onTodayReviewSend: () => void;
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
        <div className="grid min-w-0 content-start gap-4">
          <ProjectTasksPanel
            darkMode={darkMode}
            tasks={tasks}
            loading={taskLoading}
            messages={messages.projectTasks}
            dateMessages={formMessages.datePicker}
            onTaskStatus={onTaskStatus}
            onTaskOpen={onTaskOpen}
          />

          <RoutinesPanel
            darkMode={darkMode}
            routines={routines}
            loading={routineLoading}
            messages={messages.routines}
            timeMessages={formMessages.timePicker}
            timeFormatPreference={timeFormatPreference}
            onRoutineStatus={onRoutineStatus}
            onRoutineOpen={onRoutineOpen}
          />
        </div>

        <aside className="grid content-start gap-4">
          <TodayReviewPanel
            darkMode={darkMode}
            pending={todayReviewPending}
            pinnedMemories={pinnedMemories}
            routines={routines}
            showSendAction={showTodayReviewSendAction}
            tasks={tasks}
            messages={messages.review}
            onSend={onTodayReviewSend}
          />

          <PinnedMemoriesPanel
            darkMode={darkMode}
            pinnedMemories={pinnedMemories}
            loading={memoryLoading}
            messages={messages.pinnedMemories}
            onDone={onMemoryDone}
            onCancelDone={onMemoryCancelDone}
            onMemoryOpen={onMemoryOpen}
          />
        </aside>
      </div>
    </section>
  );
}
