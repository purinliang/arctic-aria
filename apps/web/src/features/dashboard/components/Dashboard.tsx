"use client";

import {
  Bell,
  Check,
  ChevronDown,
  ClipboardList,
  Coins,
  LayoutDashboard,
  ListChecks,
  Menu,
  Moon,
  Package,
  Settings,
  Sun,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  dayBoundary,
  initialRoutines,
  initialTasks,
  rewardPreview,
} from "../dummy-data";
import type {
  ChestItemRarity,
  Routine,
  RoutineStatus,
  Task,
  TaskStatus,
} from "../types";

const todayFormatter = new Intl.DateTimeFormat("en", {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
});

const routineActions: Exclude<RoutineStatus, "pending">[] = [
  "done",
  "skipped",
  "busy",
];

function clampWeight(value: number, max: number) {
  return Math.min(Math.max(value, 0), max);
}

function statusForWeight(completedWeight: number, weight: number): TaskStatus {
  if (completedWeight >= weight) {
    return "done";
  }

  if (completedWeight > 0) {
    return "partial";
  }

  return "todo";
}

function priorityClass(priority: Task["priority"], darkMode: boolean) {
  if (priority === "High") {
    return darkMode
      ? "border-red-400/40 bg-red-500/15 text-red-200"
      : "border-red-200 bg-red-50 text-red-700";
  }

  if (priority === "Medium") {
    return darkMode
      ? "border-amber-400/40 bg-amber-500/15 text-amber-200"
      : "border-amber-200 bg-amber-50 text-amber-700";
  }

  return darkMode
    ? "border-slate-500 bg-slate-700/70 text-slate-200"
    : "border-slate-200 bg-slate-50 text-slate-600";
}

function routineStatusClass(status: RoutineStatus, darkMode: boolean) {
  if (status === "done") {
    return darkMode
      ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-200"
      : "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "skipped") {
    return darkMode
      ? "border-slate-500 bg-slate-700/70 text-slate-200"
      : "border-slate-200 bg-slate-100 text-slate-600";
  }

  if (status === "busy") {
    return darkMode
      ? "border-orange-400/40 bg-orange-500/15 text-orange-200"
      : "border-orange-200 bg-orange-50 text-orange-700";
  }

  return darkMode
    ? "border-sky-400/40 bg-sky-500/15 text-sky-200"
    : "border-blue-200 bg-blue-50 text-blue-700";
}

function rarityClass(rarity: ChestItemRarity, darkMode: boolean) {
  if (rarity === "Legendary") {
    return darkMode ? "text-orange-200" : "text-orange-700";
  }

  if (rarity === "Epic") {
    return darkMode ? "text-purple-200" : "text-purple-700";
  }

  if (rarity === "Rare") {
    return darkMode ? "text-sky-200" : "text-sky-700";
  }

  return darkMode ? "text-slate-300" : "text-slate-600";
}

function panelClass(darkMode: boolean) {
  return darkMode
    ? "border-slate-700 bg-slate-900 text-slate-100"
    : "border-slate-300 bg-white text-slate-950";
}

export function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [routines, setRoutines] = useState<Routine[]>(initialRoutines);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewCount, setReviewCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>("task-1");
  const [expandedRoutineId, setExpandedRoutineId] = useState<string | null>(
    initialRoutines.find((routine) => routine.reminderState === "reminding")
      ?.id ?? null,
  );

  const stats = useMemo(() => {
    const completedWeight = tasks.reduce(
      (sum, task) => sum + task.completedWeight,
      0,
    );
    const completedRoutines = routines.filter(
      (routine) => routine.status === "done",
    ).length;
    const gold =
      rewardPreview.baseGold +
      completedWeight * rewardPreview.perWeightGold +
      completedRoutines * rewardPreview.routineGold;
    const chestLevel = Math.min(
      Math.max(1, Math.ceil((completedWeight + completedRoutines) / 3)),
      5,
    );

    return {
      completedWeight,
      completedRoutines,
      gold,
      chestLevel,
    };
  }, [routines, tasks]);

  function updatePartialTask(taskId: string, completedWeight: number) {
    setTasks((current) =>
      current.map((task) => {
        if (task.id !== taskId) {
          return task;
        }

        const nextCompletedWeight = clampWeight(completedWeight, task.weight);

        return {
          ...task,
          completedWeight: nextCompletedWeight,
          status: statusForWeight(nextCompletedWeight, task.weight),
        };
      }),
    );
  }

  function toggleSubtask(taskId: string, subtaskId: string) {
    setTasks((current) =>
      current.map((task) => {
        if (task.id !== taskId || !task.subtasks) {
          return task;
        }

        const subtasks = task.subtasks.map((subtask) =>
          subtask.id === subtaskId
            ? { ...subtask, done: !subtask.done }
            : subtask,
        );
        const doneSubtasks = subtasks.filter((subtask) => subtask.done).length;
        const nextCompletedWeight = Math.round(
          (doneSubtasks / subtasks.length) * task.weight,
        );

        return {
          ...task,
          subtasks,
          completedWeight: nextCompletedWeight,
          status: statusForWeight(nextCompletedWeight, task.weight),
        };
      }),
    );
  }

  function updateRoutine(routineId: string, status: RoutineStatus) {
    setRoutines((current) =>
      current.map((routine) =>
        routine.id === routineId ? { ...routine, status } : routine,
      ),
    );
  }

  function openReview() {
    setReviewOpen(true);
    setReviewCount((count) => count + 1);
  }

  return (
    <main
      className={`min-h-screen transition-colors ${
        darkMode ? "bg-slate-950 text-slate-100" : "bg-[#eef2f5] text-slate-950"
      }`}
    >
      <div className="mx-auto flex max-w-[1500px] flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <header
          className={`flex flex-col gap-3 border-b pb-4 lg:flex-row lg:items-center lg:justify-between ${
            darkMode ? "border-slate-800" : "border-slate-300"
          }`}
        >
          <div className="flex min-w-0 items-center gap-3">
            <button
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md border transition ${
                darkMode
                  ? "border-slate-700 bg-slate-900 text-slate-200 hover:border-slate-500"
                  : "border-slate-300 bg-white text-slate-700 hover:border-slate-500"
              }`}
              type="button"
              aria-label="Open navigation"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} aria-hidden="true" />
            </button>
            <div className="min-w-0">
              <p
                className={`text-sm font-medium ${
                  darkMode ? "text-slate-400" : "text-slate-500"
                }`}
              >
                Daily plan ends at {dayBoundary}
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-normal sm:text-3xl">
                {todayFormatter.format(new Date())} Dashboard
              </h1>
            </div>
          </div>
          <button
            className={`flex h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold shadow-sm transition ${
              darkMode
                ? "bg-emerald-400 text-slate-950 hover:bg-emerald-300"
                : "bg-slate-950 text-white hover:bg-slate-800"
            }`}
            type="button"
            onClick={openReview}
          >
            <ListChecks size={18} aria-hidden="true" />
            Review
          </button>
        </header>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className={`min-w-0 rounded-md border ${panelClass(darkMode)}`}>
            <SectionHeader
              icon={<Check size={18} aria-hidden="true" />}
              title="Today's Tasks"
              meta={`${tasks.length} recommended`}
              darkMode={darkMode}
            />
            <div className={darkMode ? "divide-y divide-slate-800" : "divide-y divide-slate-200"}>
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  darkMode={darkMode}
                  expanded={expandedTaskId === task.id}
                  onToggleExpanded={() =>
                    setExpandedTaskId((current) =>
                      current === task.id ? null : task.id,
                    )
                  }
                  onPartialChange={(completedWeight) =>
                    updatePartialTask(task.id, completedWeight)
                  }
                  onSubtaskToggle={(subtaskId) =>
                    toggleSubtask(task.id, subtaskId)
                  }
                />
              ))}
            </div>
          </section>

          <section className={`rounded-md border ${panelClass(darkMode)}`}>
            <SectionHeader
              icon={<Bell size={18} aria-hidden="true" />}
              title="Routines"
              meta={`${routines.length} scheduled`}
              darkMode={darkMode}
            />
            <div className={darkMode ? "divide-y divide-slate-800" : "divide-y divide-slate-200"}>
              {routines.map((routine) => (
                <RoutineCard
                  key={routine.id}
                  routine={routine}
                  darkMode={darkMode}
                  expanded={expandedRoutineId === routine.id}
                  onToggleExpanded={() =>
                    setExpandedRoutineId((current) =>
                      current === routine.id ? null : routine.id,
                    )
                  }
                  onStatusChange={(status) => updateRoutine(routine.id, status)}
                />
              ))}
            </div>
          </section>
        </section>
      </div>

      <Sidebar
        open={sidebarOpen}
        darkMode={darkMode}
        onClose={() => setSidebarOpen(false)}
        onThemeChange={setDarkMode}
      />

      <ReviewDialog
        tasks={tasks}
        routines={routines}
        darkMode={darkMode}
        open={reviewOpen}
        reviewCount={reviewCount}
        gold={stats.gold}
        chestLevel={stats.chestLevel}
        onClose={() => setReviewOpen(false)}
      />
    </main>
  );
}

function SectionHeader({
  icon,
  title,
  meta,
  darkMode,
}: {
  icon: ReactNode;
  title: string;
  meta: string;
  darkMode: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-3 border-b px-4 py-3 ${
        darkMode ? "border-slate-800" : "border-slate-200"
      }`}
    >
      <div className="flex min-w-0 items-center gap-2">
        <span className={darkMode ? "text-slate-400" : "text-slate-500"}>
          {icon}
        </span>
        <h2 className="truncate text-base font-semibold">{title}</h2>
      </div>
      <span
        className={`shrink-0 text-sm ${
          darkMode ? "text-slate-400" : "text-slate-500"
        }`}
      >
        {meta}
      </span>
    </div>
  );
}

function TaskCard({
  task,
  darkMode,
  expanded,
  onToggleExpanded,
  onPartialChange,
  onSubtaskToggle,
}: {
  task: Task;
  darkMode: boolean;
  expanded: boolean;
  onToggleExpanded: () => void;
  onPartialChange: (completedWeight: number) => void;
  onSubtaskToggle: (subtaskId: string) => void;
}) {
  const progress = Math.round((task.completedWeight / task.weight) * 100);

  return (
    <article>
      <button
        className={`grid w-full grid-cols-[56px_1fr_auto] items-center gap-3 px-4 py-4 text-left transition ${
          darkMode ? "hover:bg-slate-800/70" : "hover:bg-slate-50"
        }`}
        type="button"
        aria-expanded={expanded}
        onClick={onToggleExpanded}
      >
        <ProgressCircle progress={progress} darkMode={darkMode} />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="min-w-0 text-base font-semibold">{task.title}</h3>
            <span
              className={`rounded-md border px-2 py-0.5 text-xs font-semibold ${priorityClass(task.priority, darkMode)}`}
            >
              {task.priority}
            </span>
          </div>
          <div
            className={`mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm ${
              darkMode ? "text-slate-400" : "text-slate-500"
            }`}
          >
            <span>{task.planLabel}</span>
            <span>Deadline {task.deadline}</span>
            <span>
              Weight {task.completedWeight}/{task.weight}
            </span>
          </div>
        </div>
        <ChevronDown
          className={`shrink-0 transition ${expanded ? "rotate-180" : ""}`}
          size={18}
          aria-hidden="true"
        />
      </button>

      {expanded ? (
        <div
          className={`mx-4 mb-4 grid gap-3 rounded-md border p-3 ${
            darkMode
              ? "border-slate-700 bg-slate-950/70"
              : "border-slate-200 bg-slate-50"
          }`}
        >
          <label
            className={`grid gap-2 text-sm font-medium ${
              darkMode ? "text-slate-200" : "text-slate-700"
            }`}
            onClick={(event) => event.stopPropagation()}
          >
            Completed weight: {task.completedWeight}
            <input
              className="accent-emerald-500"
              type="range"
              min="0"
              max={task.weight}
              step="1"
              value={task.completedWeight}
              onChange={(event) =>
                onPartialChange(Number(event.currentTarget.value))
              }
            />
          </label>
          {task.subtasks ? (
            <div className="grid gap-2">
              {task.subtasks.map((subtask) => (
                <label
                  key={subtask.id}
                  className={`flex items-center gap-2 text-sm ${
                    darkMode ? "text-slate-300" : "text-slate-700"
                  }`}
                  onClick={(event) => event.stopPropagation()}
                >
                  <input
                    className="accent-emerald-500"
                    type="checkbox"
                    checked={subtask.done}
                    onChange={() => onSubtaskToggle(subtask.id)}
                  />
                  <span>{subtask.title}</span>
                </label>
              ))}
            </div>
          ) : (
            <p className={darkMode ? "text-sm text-slate-400" : "text-sm text-slate-500"}>
              No subtasks for this task yet.
            </p>
          )}
        </div>
      ) : null}
    </article>
  );
}

function ProgressCircle({
  progress,
  darkMode,
}: {
  progress: number;
  darkMode: boolean;
}) {
  return (
    <span
      className={`grid h-12 w-12 shrink-0 place-items-center rounded-full text-xs font-bold ${
        darkMode ? "text-emerald-100" : "text-emerald-900"
      }`}
      style={{
        background: `conic-gradient(#22c55e ${progress * 3.6}deg, ${
          darkMode ? "#334155" : "#dbe3ea"
        } 0deg)`,
      }}
    >
      <span
        className={`grid h-9 w-9 place-items-center rounded-full ${
          darkMode ? "bg-slate-900" : "bg-white"
        }`}
      >
        {progress}%
      </span>
    </span>
  );
}

function RoutineCard({
  routine,
  darkMode,
  expanded,
  onToggleExpanded,
  onStatusChange,
}: {
  routine: Routine;
  darkMode: boolean;
  expanded: boolean;
  onToggleExpanded: () => void;
  onStatusChange: (status: RoutineStatus) => void;
}) {
  return (
    <article>
      <button
        className={`grid w-full grid-cols-[1fr_auto] gap-3 px-4 py-4 text-left transition ${
          darkMode ? "hover:bg-slate-800/70" : "hover:bg-slate-50"
        }`}
        type="button"
        aria-expanded={expanded}
        onClick={onToggleExpanded}
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="min-w-0 text-sm font-semibold">{routine.title}</h3>
            {routine.reminderState === "reminding" ? (
              <span className="rounded-md border border-emerald-400/50 bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-200">
                reminding
              </span>
            ) : null}
          </div>
          <div
            className={`mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs ${
              darkMode ? "text-slate-400" : "text-slate-500"
            }`}
          >
            <span>{routine.scheduledTime}</span>
            <span>Reminder {routine.reminderState}</span>
            <span>{routine.streakText}</span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span
            className={`rounded-md border px-2 py-0.5 text-xs font-semibold ${routineStatusClass(routine.status, darkMode)}`}
          >
            {routine.status}
          </span>
          <ChevronDown
            className={`transition ${expanded ? "rotate-180" : ""}`}
            size={18}
            aria-hidden="true"
          />
        </div>
      </button>
      {expanded ? (
        <div
          className={`mx-4 mb-4 grid grid-cols-3 gap-2 rounded-md border p-3 ${
            darkMode
              ? "border-slate-700 bg-slate-950/70"
              : "border-slate-200 bg-slate-50"
          }`}
        >
          {routineActions.map((status) => (
            <button
              key={status}
              className={`h-9 rounded-md border px-2 text-xs font-semibold capitalize transition ${
                darkMode
                  ? "border-slate-600 text-slate-200 hover:border-emerald-400 hover:text-emerald-200"
                  : "border-slate-300 text-slate-700 hover:border-slate-500"
              }`}
              type="button"
              onClick={() => onStatusChange(status)}
            >
              {status}
            </button>
          ))}
        </div>
      ) : null}
    </article>
  );
}

function Sidebar({
  open,
  darkMode,
  onClose,
  onThemeChange,
}: {
  open: boolean;
  darkMode: boolean;
  onClose: () => void;
  onThemeChange: (darkMode: boolean) => void;
}) {
  return (
    <div
      className={`fixed inset-0 z-40 transition ${
        open ? "pointer-events-auto" : "pointer-events-none"
      }`}
      aria-hidden={!open}
    >
      <button
        className={`absolute inset-0 bg-slate-950/60 transition-opacity ${
          open ? "opacity-100" : "opacity-0"
        }`}
        type="button"
        aria-label="Close navigation overlay"
        onClick={onClose}
      />
      <aside
        className={`absolute left-0 top-0 flex h-full w-[300px] max-w-[86vw] flex-col border-r p-4 shadow-xl transition-transform ${
          open ? "translate-x-0" : "-translate-x-full"
        } ${
          darkMode
            ? "border-slate-700 bg-slate-900 text-slate-100"
            : "border-slate-200 bg-white text-slate-950"
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p
              className={`text-xs font-semibold uppercase ${
                darkMode ? "text-slate-400" : "text-slate-500"
              }`}
            >
              Arctic Aria
            </p>
            <h2 className="text-lg font-semibold">Workspace</h2>
          </div>
          <button
            className={`flex h-9 w-9 items-center justify-center rounded-md border transition ${
              darkMode
                ? "border-slate-700 hover:border-slate-500"
                : "border-slate-300 hover:border-slate-500"
            }`}
            type="button"
            aria-label="Close navigation"
            onClick={onClose}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <nav className="mt-6 grid gap-2">
          <SidebarItem
            icon={<LayoutDashboard size={18} aria-hidden="true" />}
            label="Dashboard"
            active
            darkMode={darkMode}
          />
          <SidebarItem
            icon={<ClipboardList size={18} aria-hidden="true" />}
            label="Tasks"
            darkMode={darkMode}
          />
          <SidebarItem
            icon={<Bell size={18} aria-hidden="true" />}
            label="Routines"
            darkMode={darkMode}
          />
          <SidebarItem
            icon={<Settings size={18} aria-hidden="true" />}
            label="Settings"
            darkMode={darkMode}
          />
        </nav>

        <div
          className={`mt-auto rounded-md border p-3 ${
            darkMode
              ? "border-slate-700 bg-slate-950"
              : "border-slate-200 bg-slate-50"
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {darkMode ? (
                <Moon size={18} aria-hidden="true" />
              ) : (
                <Sun size={18} aria-hidden="true" />
              )}
              <span className="text-sm font-semibold">Dark mode</span>
            </div>
            <button
              className={`h-7 w-12 rounded-full border p-1 transition ${
                darkMode
                  ? "border-emerald-400 bg-emerald-500"
                  : "border-slate-300 bg-slate-200"
              }`}
              type="button"
              role="switch"
              aria-checked={darkMode}
              onClick={() => onThemeChange(!darkMode)}
            >
              <span
                className={`block h-4 w-4 rounded-full bg-white transition ${
                  darkMode ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

function SidebarItem({
  icon,
  label,
  active = false,
  darkMode,
}: {
  icon: ReactNode;
  label: string;
  active?: boolean;
  darkMode: boolean;
}) {
  return (
    <button
      className={`flex h-10 items-center gap-3 rounded-md px-3 text-sm font-semibold transition ${
        active
          ? darkMode
            ? "bg-emerald-400 text-slate-950"
            : "bg-slate-950 text-white"
          : darkMode
            ? "text-slate-300 hover:bg-slate-800"
            : "text-slate-700 hover:bg-slate-100"
      }`}
      type="button"
    >
      {icon}
      {label}
    </button>
  );
}

function ReviewDialog({
  tasks,
  routines,
  darkMode,
  open,
  reviewCount,
  gold,
  chestLevel,
  onClose,
}: {
  tasks: Task[];
  routines: Routine[];
  darkMode: boolean;
  open: boolean;
  reviewCount: number;
  gold: number;
  chestLevel: number;
  onClose: () => void;
}) {
  const completedTasks = tasks.filter((task) => task.status === "done");
  const partialTasks = tasks.filter((task) => task.status === "partial");
  const unfinishedTasks = tasks.filter((task) => task.status === "todo");
  const completedRoutines = routines.filter(
    (routine) => routine.status === "done",
  );
  const interruptedRoutines = routines.filter(
    (routine) => routine.status === "skipped" || routine.status === "busy",
  );

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-start bg-slate-950/65 px-4 py-16 sm:place-items-center sm:py-8">
      <section
        className={`max-h-[86vh] w-full max-w-2xl overflow-y-auto rounded-md border shadow-2xl ${
          darkMode
            ? "border-slate-700 bg-slate-900 text-slate-100"
            : "border-slate-200 bg-white text-slate-950"
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-title"
      >
        <div
          className={`flex items-center justify-between gap-3 border-b px-4 py-3 ${
            darkMode ? "border-slate-800" : "border-slate-200"
          }`}
        >
          <div className="min-w-0">
            <p
              className={`text-xs font-semibold uppercase ${
                darkMode ? "text-slate-400" : "text-slate-500"
              }`}
            >
              Review run {reviewCount}
            </p>
            <h2 id="review-title" className="text-lg font-semibold">
              Current Review Card
            </h2>
          </div>
          <button
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border transition ${
              darkMode
                ? "border-slate-700 hover:border-slate-500"
                : "border-slate-300 hover:border-slate-500"
            }`}
            type="button"
            aria-label="Close review"
            onClick={onClose}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="grid gap-4 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <RewardTile
              darkMode={darkMode}
              icon={<Coins size={18} aria-hidden="true" />}
              label="Gold"
              value={String(gold)}
            />
            <ChestTile darkMode={darkMode} level={chestLevel} />
          </div>

          <ReviewGroup
            darkMode={darkMode}
            title="Completed"
            items={[
              ...completedTasks.map((task) => task.title),
              ...completedRoutines.map((routine) => routine.title),
            ]}
            fallback="Nothing fully completed yet."
          />
          <ReviewGroup
            darkMode={darkMode}
            title="Partial Progress"
            items={partialTasks.map(
              (task) =>
                `${task.title}: ${task.completedWeight}/${task.weight} weight`,
            )}
            fallback="No partial progress recorded."
          />
          <ReviewGroup
            darkMode={darkMode}
            title="Unfinished or Interrupted"
            items={[
              ...unfinishedTasks.map((task) => task.title),
              ...interruptedRoutines.map(
                (routine) => `${routine.title}: ${routine.status}`,
              ),
            ]}
            fallback="No unfinished or skipped items."
          />
        </div>
      </section>
    </div>
  );
}

function RewardTile({
  darkMode,
  icon,
  label,
  value,
}: {
  darkMode: boolean;
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div
      className={`min-w-0 rounded-md border p-3 ${
        darkMode
          ? "border-slate-700 bg-slate-950"
          : "border-slate-200 bg-slate-50"
      }`}
    >
      <div
        className={`flex items-center gap-2 text-xs font-medium uppercase ${
          darkMode ? "text-slate-400" : "text-slate-500"
        }`}
      >
        {icon}
        {label}
      </div>
      <p className="mt-1 truncate text-xl font-semibold">{value}</p>
    </div>
  );
}

function ChestTile({
  darkMode,
  level,
}: {
  darkMode: boolean;
  level: number;
}) {
  return (
    <div
      className={`group relative min-w-0 rounded-md border p-3 ${
        darkMode
          ? "border-slate-700 bg-slate-950"
          : "border-slate-200 bg-slate-50"
      }`}
      tabIndex={0}
    >
      <div
        className={`flex items-center gap-2 text-xs font-medium uppercase ${
          darkMode ? "text-slate-400" : "text-slate-500"
        }`}
      >
        <Package size={18} aria-hidden="true" />
        Treasure Chest
      </div>
      <p className="mt-1 truncate text-xl font-semibold">
        {rewardPreview.chestName.replace("Lv 2", `Lv ${level}`)}
      </p>
      <div
        className={`pointer-events-none absolute right-0 top-[calc(100%+8px)] z-10 hidden w-64 rounded-md border p-3 shadow-xl group-hover:block group-focus:block ${
          darkMode
            ? "border-slate-700 bg-slate-900"
            : "border-slate-200 bg-white"
        }`}
      >
        <p
          className={`text-xs font-semibold uppercase ${
            darkMode ? "text-slate-400" : "text-slate-500"
          }`}
        >
          Expected contents
        </p>
        <ul className="mt-2 grid gap-1 text-sm">
          {rewardPreview.chestItems.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3">
              <span className="truncate">{item.name}</span>
              <span className={`shrink-0 font-semibold ${rarityClass(item.rarity, darkMode)}`}>
                {item.rarity}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ReviewGroup({
  darkMode,
  title,
  items,
  fallback,
}: {
  darkMode: boolean;
  title: string;
  items: string[];
  fallback: string;
}) {
  return (
    <section>
      <h3 className="text-sm font-semibold">{title}</h3>
      {items.length > 0 ? (
        <ul
          className={`mt-2 grid gap-1 text-sm ${
            darkMode ? "text-slate-300" : "text-slate-600"
          }`}
        >
          {items.map((item) => (
            <li
              key={item}
              className={`rounded-md px-2 py-1 ${
                darkMode ? "bg-slate-950" : "bg-slate-50"
              }`}
            >
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p
          className={`mt-2 text-sm ${
            darkMode ? "text-slate-400" : "text-slate-500"
          }`}
        >
          {fallback}
        </p>
      )}
    </section>
  );
}
