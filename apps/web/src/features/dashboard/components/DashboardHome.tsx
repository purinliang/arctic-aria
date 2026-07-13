import { Bell, Check, ClipboardList } from "lucide-react";
import {
  dividerClass,
  mutedTextClass,
} from "@/components/ui/color";
import { Panel } from "@/components/ui/panel";
import { PinnedMemoryCard } from "@/features/memories/components/PinnedMemoryCard";
import { RoutineCard } from "@/features/routines/components/RoutineCard";
import { TaskCard } from "@/features/tasks/components/TaskCard";
import type {
  PinnedMemory,
  Routine,
  RoutineStatus,
  Task,
  TaskStatus,
} from "../types";
import { SectionHeader } from "./SectionHeader";

export function DashboardHome({
  darkMode,
  tasks,
  taskLoading,
  taskActionPending,
  expandedTaskId,
  routines,
  routineLoading,
  routineActionPending,
  routineMessage,
  expandedRoutineId,
  pinnedMemories,
  memoryLoading,
  memoryActionPending,
  memoryMessage,
  expandedMemoryId,
  onTaskExpand,
  onTaskStatus,
  onSubtaskToggle,
  onTaskEdit,
  onRoutineExpand,
  onRoutineStatus,
  onRoutineBusy,
  onMemoryExpand,
  onMemoryDone,
  onMemoryCancelDone,
  onMemoryReplace,
  onMemoryView,
}: {
  darkMode: boolean;
  tasks: Task[];
  taskLoading: boolean;
  taskActionPending: boolean;
  expandedTaskId: string | null;
  routines: Routine[];
  routineLoading: boolean;
  routineActionPending: boolean;
  routineMessage: string | null;
  expandedRoutineId: string | null;
  pinnedMemories: PinnedMemory[];
  memoryLoading: boolean;
  memoryActionPending: boolean;
  memoryMessage: string | null;
  expandedMemoryId: string | null;
  onTaskExpand: (taskId: string) => void;
  onTaskStatus: (
    taskId: string,
    status: Exclude<TaskStatus, "archived">,
  ) => void;
  onSubtaskToggle: (task: Task, subtaskId: string) => void;
  onTaskEdit: () => void;
  onRoutineExpand: (routineId: string) => void;
  onRoutineStatus: (routineId: string, status: RoutineStatus) => void;
  onRoutineBusy: () => void;
  onMemoryExpand: (pinnedMemoryId: string) => void;
  onMemoryDone: (pinnedMemoryId: string) => void;
  onMemoryCancelDone: (pinnedMemoryId: string) => void;
  onMemoryReplace: (pinnedMemoryId: string) => void;
  onMemoryView: (memoryId: string) => void;
}) {
  return (
    <section className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
      <Panel darkMode={darkMode} className="min-w-0">
        <SectionHeader
          icon={<Check size={18} aria-hidden="true" />}
          title="Today's Tasks"
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
            <TaskCard
              key={task.id}
              task={task}
              darkMode={darkMode}
              disabled={taskActionPending}
              expanded={expandedTaskId === task.id}
              onToggleExpanded={() => onTaskExpand(task.id)}
              onSubtaskToggle={(subtaskId) => onSubtaskToggle(task, subtaskId)}
              onDone={() => onTaskStatus(task.id, "done")}
              onBlock={() => onTaskStatus(task.id, "blocked")}
              onSkip={() => onTaskStatus(task.id, "skipped")}
              onEdit={onTaskEdit}
            />
          ))}
        </div>
      </Panel>

      <aside className="grid gap-4">
        <Panel darkMode={darkMode}>
          <SectionHeader
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
                expanded={expandedRoutineId === routine.id}
                onToggleExpanded={() => onRoutineExpand(routine.id)}
                onStatusChange={(status) => onRoutineStatus(routine.id, status)}
                onBusy={onRoutineBusy}
              />
            ))}
          </div>
        </Panel>

        <Panel darkMode={darkMode}>
          <SectionHeader
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
                expanded={expandedMemoryId === memory.id}
                onDone={() => onMemoryDone(memory.id)}
                onCancelDone={() => onMemoryCancelDone(memory.id)}
                onReplace={() => onMemoryReplace(memory.id)}
                onView={() => onMemoryView(memory.memoryId)}
                onToggleExpanded={() => onMemoryExpand(memory.id)}
              />
            ))}
          </div>
        </Panel>
      </aside>
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
