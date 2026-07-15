import { Bell, Check, ClipboardList } from "lucide-react";
import { CardHeader } from "@/components/card";
import {
  dividerClass,
  mutedTextClass,
} from "@/components/color";
import { Panel } from "@/components/panel";
import { PinnedMemoryCard } from "@/features/memories/components/PinnedMemoryCard";
import { ProjectTaskCard } from "@/features/projects/components/ProjectTaskCard";
import { RoutineCard } from "@/features/routines/components/RoutineCard";
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
  memoryMessage,
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
  memoryMessage: string | null;
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
        <Panel darkMode={darkMode} className="min-w-0">
          <CardHeader
            icon={<Check size={18} aria-hidden="true" />}
            title="Today's tasks to move projects forward"
            meta={`${tasks.length} recommended`}
            darkMode={darkMode}
          />
          <div className={dividerClass(darkMode)}>
            {taskLoading ? (
              <EmptyLine darkMode={darkMode} text="Loading tasks..." />
            ) : null}
            {!taskLoading && tasks.length === 0 ? (
              <EmptyLine darkMode={darkMode} text="No tasks selected for today." />
            ) : null}
            {tasks.map((task) => (
              <ProjectTaskCard
                key={task.id}
                task={task}
                darkMode={darkMode}
                taskPending={pendingTaskIds.includes(task.id)}
                onDone={() => onTaskStatus(task.id, "done")}
              />
            ))}
          </div>
        </Panel>

        <aside className="grid content-start gap-4">
          <Panel darkMode={darkMode}>
            <CardHeader
              icon={<Bell size={18} aria-hidden="true" />}
              title="Routines"
              meta={`${routines.length} scheduled`}
              darkMode={darkMode}
            />
            <DashboardMessage darkMode={darkMode} message={routineMessage} />
            <div className={dividerClass(darkMode)}>
              {routineLoading ? (
                <EmptyLine darkMode={darkMode} text="Loading routines..." />
              ) : null}
              {!routineLoading && routines.length === 0 ? (
                <EmptyLine darkMode={darkMode} text="No routines due today." />
              ) : null}
              {routines.map((routine) => (
                <RoutineCard
                  key={routine.id}
                  routine={routine}
                  darkMode={darkMode}
                  disabled={routineActionPending}
                  onStatusChange={(status) => onRoutineStatus(routine.id, status)}
                />
              ))}
            </div>
          </Panel>

          <Panel darkMode={darkMode}>
            <CardHeader
              icon={<ClipboardList size={18} aria-hidden="true" />}
              title="Pinned Memories"
              meta={`${pinnedMemories.length} saved`}
              darkMode={darkMode}
            />
            <DashboardMessage darkMode={darkMode} message={memoryMessage} />
            <div className={dividerClass(darkMode)}>
              {memoryLoading ? (
                <EmptyLine darkMode={darkMode} text="Loading pinned memories..." />
              ) : null}
              {!memoryLoading && pinnedMemories.length === 0 ? (
                <EmptyLine darkMode={darkMode} text="No pinned memories yet." />
              ) : null}
              {pinnedMemories.map((memory) => (
                <PinnedMemoryCard
                  key={memory.id}
                  memory={memory}
                  darkMode={darkMode}
                  disabled={memoryActionPending}
                  onDone={() => onMemoryDone(memory.id)}
                  onCancelDone={() => onMemoryCancelDone(memory.id)}
                  onReplace={() => onMemoryReplace(memory.id)}
                />
              ))}
            </div>
          </Panel>
        </aside>
      </div>
    </section>
  );
}

function DashboardMessage({
  darkMode,
  message,
}: {
  darkMode: boolean;
  message: string | null;
}) {
  if (!message) {
    return null;
  }

  return (
    <div
      className={`border-b px-4 py-3 text-xs font-semibold ${
        darkMode
          ? "border-neutral-900 text-amber-200"
          : "border-slate-200 text-amber-700"
      }`}
    >
      {message}
    </div>
  );
}

function EmptyLine({ darkMode, text }: { darkMode: boolean; text: string }) {
  return (
    <p className={`px-4 py-4 text-sm ${mutedTextClass(darkMode)}`}>
      {text}
    </p>
  );
}
