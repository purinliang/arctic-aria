"use client";

import { Bell, Check, ListChecks, LogOut, Menu } from "lucide-react";
import { useMemo, useState } from "react";
import type { AuthUser } from "@/features/auth/server/auth-service";
import {
  dayBoundary,
  initialRoutines,
  initialTasks,
  rewardPreview,
} from "../dummy-data";
import type { Routine, RoutineStatus, Task, TaskStatus } from "../types";
import { ReviewDialog } from "./ReviewDialog";
import { RoutineCard } from "./RoutineCard";
import { SectionHeader } from "./SectionHeader";
import { Sidebar } from "./Sidebar";
import { TaskCard } from "./TaskCard";

const todayFormatter = new Intl.DateTimeFormat("en", {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
});

function statusForWeight(completedWeight: number, weight: number): TaskStatus {
  if (completedWeight >= weight) {
    return "done";
  }

  if (completedWeight > 0) {
    return "partial";
  }

  return "todo";
}

function panelClass(darkMode: boolean) {
  return darkMode
    ? "border-neutral-800 bg-black text-white"
    : "border-slate-300 bg-white text-slate-950";
}

export function Dashboard({
  currentUser,
  logoutPending,
  onLogout,
}: {
  currentUser: AuthUser;
  logoutPending: boolean;
  onLogout: () => void;
}) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [routines, setRoutines] = useState<Routine[]>(initialRoutines);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewCount, setReviewCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>("task-1");
  const [expandedRoutineId, setExpandedRoutineId] = useState<string | null>(
    initialRoutines.find((routine) => routine.status === "reminding")?.id ??
      null,
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

    return { gold, chestLevel };
  }, [routines, tasks]);

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
        const nextCompletedWeight = subtasks.reduce(
          (sum, subtask) => sum + (subtask.done ? subtask.weight : 0),
          0,
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
        darkMode ? "bg-black text-white" : "bg-[#eef2f5] text-slate-950"
      }`}
    >
      <div className="mx-auto flex max-w-[1500px] flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <header
          className={`flex flex-col gap-3 border-b pb-4 lg:flex-row lg:items-center lg:justify-between ${
            darkMode ? "border-neutral-800" : "border-slate-300"
          }`}
        >
          <div className="flex min-w-0 items-center gap-3">
            <button
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md border transition ${
                darkMode
                  ? "border-neutral-800 bg-black text-white hover:border-white"
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
                  darkMode ? "text-neutral-500" : "text-slate-500"
                }`}
              >
                Daily plan ends at {dayBoundary}
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-normal sm:text-3xl">
                {todayFormatter.format(new Date())} Dashboard
              </h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`max-w-[180px] truncate text-sm font-semibold ${
                darkMode ? "text-neutral-300" : "text-slate-700"
              }`}
              title={currentUser.username}
            >
              {currentUser.displayName}
            </span>
            <button
              className={`flex h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold shadow-sm transition ${
                darkMode
                  ? "bg-white text-black hover:bg-neutral-200"
                  : "bg-slate-950 text-white hover:bg-slate-800"
              }`}
              type="button"
              onClick={openReview}
            >
              <ListChecks size={18} aria-hidden="true" />
              Review
            </button>
            <button
              className={`flex h-11 items-center justify-center gap-2 rounded-md border px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                darkMode
                  ? "border-neutral-700 text-white hover:border-white"
                  : "border-slate-300 text-slate-700 hover:border-slate-500"
              }`}
              type="button"
              disabled={logoutPending}
              onClick={onLogout}
            >
              <LogOut size={17} aria-hidden="true" />
              {logoutPending ? "Signing out..." : "Sign out"}
            </button>
          </div>
        </header>

        <section className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className={`min-w-0 rounded-md border ${panelClass(darkMode)}`}>
            <SectionHeader
              icon={<Check size={18} aria-hidden="true" />}
              title="Today's Tasks"
              meta={`${tasks.length} recommended`}
              darkMode={darkMode}
            />
            <div
              className={
                darkMode ? "divide-y divide-neutral-900" : "divide-y divide-slate-200"
              }
            >
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
            <div
              className={
                darkMode ? "divide-y divide-neutral-900" : "divide-y divide-slate-200"
              }
            >
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
