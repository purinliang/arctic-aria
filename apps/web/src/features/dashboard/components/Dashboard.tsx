// Dashboard Page.
import { EventsPanel } from "@/features/events/components/EventsPanel";
import { PinnedMemoriesPanel } from "@/features/memories/components/PinnedMemoriesPanel";
import { ProjectTasksPanel } from "@/features/projects/components/ProjectTasksPanel";
import { RoutinesPanel } from "@/features/routines/components/RoutinesPanel";
import { TodayProgressPanel } from "./TodayProgressPanel";
import type { DashboardMessages } from "@/messages/app-messages";
import type { FormMessages } from "@/messages/app-messages";
import type { TimeFormatPreference } from "@/features/settings/preferences";
import type {
  PinnedMemory,
  Routine,
  RoutineStatus,
  ScheduledEvent,
  Task,
  TaskStatus,
} from "../types";

export function Dashboard({
  darkMode,
  tasks,
  taskLoading,
  routines,
  routineLoading,
  events,
  eventLoading,
  pinnedMemories,
  memoryLoading,
  onTaskStatus,
  onRoutineStatus,
  onMemoryDone,
  onMemoryCancelDone,
  onTaskOpen,
  onEventOpen,
  onRoutineOpen,
  onMemoryOpen,
  messages,
  formMessages,
  timeFormatPreference,
  resolvedTimeZone,
}: {
  darkMode: boolean;
  tasks: Task[];
  taskLoading: boolean;
  routines: Routine[];
  routineLoading: boolean;
  events: ScheduledEvent[];
  eventLoading: boolean;
  pinnedMemories: PinnedMemory[];
  memoryLoading: boolean;
  onTaskStatus: (
    taskId: string,
    status: TaskStatus,
  ) => void;
  onRoutineStatus: (routineId: string, status: RoutineStatus) => void;
  onMemoryDone: (pinnedMemoryId: string) => void;
  onMemoryCancelDone: (pinnedMemoryId: string) => void;
  onTaskOpen: (projectId: string) => void;
  onEventOpen: () => void;
  onRoutineOpen: () => void;
  onMemoryOpen: () => void;
  messages: DashboardMessages;
  formMessages: FormMessages;
  timeFormatPreference: TimeFormatPreference;
  resolvedTimeZone: string;
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
          <TodayProgressPanel
            darkMode={darkMode}
            tasks={tasks}
            routines={routines}
            messages={messages.progress}
            resolvedTimeZone={resolvedTimeZone}
          />

          <EventsPanel
            darkMode={darkMode}
            events={events}
            loading={eventLoading}
            messages={messages.events}
            timeMessages={formMessages.timePicker}
            timeFormatPreference={timeFormatPreference}
            onEventOpen={onEventOpen}
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
