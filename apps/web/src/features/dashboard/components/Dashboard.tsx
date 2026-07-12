"use client";

import {
  Bell,
  Check,
  ClipboardList,
  ListChecks,
  LogOut,
  Menu,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { AuthUser } from "@/features/auth/server/auth-service";
import {
  cancelPinnedMemoryDone,
  cancelPinnedMemorySuggestion,
  completePinnedMemory,
  deleteMemory,
  deleteMemoryCategory,
  getMemoryDashboardData,
  pinMemorySuggestion,
  replacePinnedMemory,
  refreshMemorySuggestions,
  saveMemory,
  saveMemoryCategory,
  type MemoryCategoryInput,
  type MemoryDashboardData,
  type MemoryInput,
  type MemoryActionResult,
} from "@/features/memories/actions";
import {
  completeRoutineInstance,
  deleteRoutine,
  getRoutineDashboardData,
  saveRoutine,
  skipRoutineInstance,
  type RoutineActionResult,
  type RoutineDashboardData,
  type RoutineInput,
} from "@/features/routines/actions";
import {
  dayBoundary,
  initialTasks,
  rewardPreview,
} from "../dummy-data";
import type {
  DashboardView,
  MemoryCategoryOption,
  MemoryRecord,
  MemorySuggestion,
  PinnedMemory,
  Routine,
  RoutineDefinition,
  RoutineStatus,
  Task,
  TaskStatus,
} from "../types";
import { MemoriesPage } from "./MemoriesPage";
import { PinnedMemoryCard } from "./PinnedMemoryCard";
import { ReviewDialog } from "./ReviewDialog";
import { RoutineCard } from "./RoutineCard";
import { RoutinesPage } from "./RoutinesPage";
import { SectionHeader } from "./SectionHeader";
import { Sidebar } from "./Sidebar";
import { TaskCard } from "./TaskCard";

const todayFormatter = new Intl.DateTimeFormat("en", {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
});

type MemoryDataAction = () => Promise<
  MemoryActionResult<MemoryDashboardData>
>;
type RoutineDataAction = () => Promise<
  RoutineActionResult<RoutineDashboardData>
>;

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
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [routineDefinitions, setRoutineDefinitions] = useState<
    RoutineDefinition[]
  >([]);
  const [routineLoading, setRoutineLoading] = useState(true);
  const [routineMessage, setRoutineMessage] = useState<string | null>(null);
  const [routineActionPending, setRoutineActionPending] = useState(false);
  const [pinnedMemories, setPinnedMemories] = useState<PinnedMemory[]>([]);
  const [memoryCategories, setMemoryCategories] = useState<
    MemoryCategoryOption[]
  >([]);
  const [memoryRecords, setMemoryRecords] = useState<MemoryRecord[]>([]);
  const [memorySuggestions, setMemorySuggestions] = useState<MemorySuggestion[]>(
    [],
  );
  const [memoryLoading, setMemoryLoading] = useState(true);
  const [memoryMessage, setMemoryMessage] = useState<string | null>(null);
  const [memoryActionPending, setMemoryActionPending] = useState(false);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [suggestionPending, setSuggestionPending] = useState(false);
  const [suggestionMessage, setSuggestionMessage] = useState<string | null>(
    null,
  );
  const [pinnedSuggestionIds, setPinnedSuggestionIds] = useState<string[]>([]);
  const [suggestionsRequested, setSuggestionsRequested] = useState(false);
  const [activeView, setActiveView] = useState<DashboardView>("dashboard");
  const [selectedMemoryId, setSelectedMemoryId] = useState<string | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewCount, setReviewCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>("task-1");
  const [expandedRoutineId, setExpandedRoutineId] = useState<string | null>(null);
  const [expandedMemoryId, setExpandedMemoryId] = useState<string | null>(null);

  const applyMemoryData = useCallback(
    (data: MemoryDashboardData, nextExpandedMemoryId?: string | null) => {
      setPinnedMemories(data.pinnedMemories);
      setMemoryCategories(data.categories);
      setMemoryRecords(data.memoryRecords);
      setExpandedMemoryId((current) => {
        if (nextExpandedMemoryId !== undefined) {
          return nextExpandedMemoryId;
        }

        if (
          current &&
          data.pinnedMemories.some((memory) => memory.id === current)
        ) {
          return current;
        }

        return data.pinnedMemories[0]?.id ?? null;
      });
    },
    [],
  );

  const refreshMemoryData = useCallback(async () => {
    const result = await getMemoryDashboardData();

    if (!result.ok) {
      setMemoryMessage(result.message);
      setPinnedMemories([]);
      setMemoryCategories([]);
      setMemoryRecords([]);
      setExpandedMemoryId(null);
      setMemoryLoading(false);
      return;
    }

    applyMemoryData(result.data);
    setMemoryLoading(false);
  }, [applyMemoryData]);

  const applyRoutineData = useCallback(
    (data: RoutineDashboardData, nextExpandedRoutineId?: string | null) => {
      setRoutines(data.routines);
      setRoutineDefinitions(data.routineDefinitions);
      setExpandedRoutineId((current) => {
        if (nextExpandedRoutineId !== undefined) {
          return nextExpandedRoutineId;
        }

        if (current && data.routines.some((routine) => routine.id === current)) {
          return current;
        }

        return (
          data.routines.find(
            (routine) => routine.reminderState === "reminding",
          )?.id ?? null
        );
      });
    },
    [],
  );

  const refreshRoutineData = useCallback(async () => {
    const result = await getRoutineDashboardData();

    if (!result.ok) {
      setRoutineMessage(result.message);
      setRoutines([]);
      setRoutineDefinitions([]);
      setExpandedRoutineId(null);
      setRoutineLoading(false);
      return;
    }

    applyRoutineData(result.data);
    setRoutineLoading(false);
  }, [applyRoutineData]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void refreshMemoryData();
      void refreshRoutineData();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [currentUser.id, refreshMemoryData, refreshRoutineData]);

  const stats = useMemo(() => {
    const completedWeight = tasks.reduce(
      (sum, task) => sum + task.completedWeight,
      0,
    );
    const completedRoutines = routines.filter(
      (routine) => routine.status === "completed",
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
    void runRoutineAction(
      () =>
        status === "completed"
          ? completeRoutineInstance(routineId)
          : skipRoutineInstance(routineId),
      null,
    );
  }

  async function runMemoryAction(
    action: MemoryDataAction,
    expandedPinnedMemoryId: string | null,
  ) {
    setMemoryMessage(null);
    setMemoryActionPending(true);

    try {
      const result = await action();

      if (!result.ok) {
        setMemoryMessage(result.message);
        return;
      }

      applyMemoryData(result.data, expandedPinnedMemoryId);
    } finally {
      setMemoryActionPending(false);
    }
  }

  async function runMemoryManagementAction(action: MemoryDataAction) {
    setMemoryMessage(null);

    setMemoryActionPending(true);

    try {
      const result = await action();

      if (!result.ok) {
        setMemoryMessage(result.message);
        return false;
      }

      applyMemoryData(result.data);
      return true;
    } finally {
      setMemoryActionPending(false);
    }
  }

  async function runMemoryManagementDataAction(action: MemoryDataAction) {
    setMemoryMessage(null);

    setMemoryActionPending(true);

    try {
      const result = await action();

      if (!result.ok) {
        setMemoryMessage(result.message);
        return null;
      }

      applyMemoryData(result.data);
      return result.data;
    } finally {
      setMemoryActionPending(false);
    }
  }

  async function runRoutineAction(
    action: RoutineDataAction,
    expandedRoutineId: string | null,
  ) {
    setRoutineMessage(null);
    setRoutineActionPending(true);

    try {
      const result = await action();

      if (!result.ok) {
        setRoutineMessage(result.message);
        return;
      }

      applyRoutineData(result.data, expandedRoutineId);
    } finally {
      setRoutineActionPending(false);
    }
  }

  async function runRoutineManagementAction(action: RoutineDataAction) {
    setRoutineMessage(null);
    setRoutineActionPending(true);

    try {
      const result = await action();

      if (!result.ok) {
        setRoutineMessage(result.message);
        return false;
      }

      applyRoutineData(result.data);
      return true;
    } finally {
      setRoutineActionPending(false);
    }
  }

  function markMemoryDone(pinnedMemoryId: string) {
    void runMemoryAction(
      () => completePinnedMemory(pinnedMemoryId),
      null,
    );
  }

  function cancelMemoryDone(pinnedMemoryId: string) {
    void runMemoryAction(
      () => cancelPinnedMemoryDone(pinnedMemoryId),
      null,
    );
  }

  function replaceMemory(pinnedMemoryId: string) {
    void runMemoryAction(
      () => replacePinnedMemory(pinnedMemoryId),
      null,
    );
  }

  function viewMemory(memoryId: string) {
    setSelectedMemoryId(memoryId);
    setActiveView("memories");
    setSidebarOpen(false);
  }

  function saveMemoryFromPage(input: MemoryInput) {
    return runMemoryManagementAction(() => saveMemory(input));
  }

  function deleteMemoryFromPage(memoryId: string) {
    return runMemoryManagementAction(() => deleteMemory(memoryId));
  }

  function saveCategoryFromPage(input: MemoryCategoryInput) {
    return runMemoryManagementDataAction(() => saveMemoryCategory(input));
  }

  function deleteCategoryFromPage(categoryId: string) {
    return runMemoryManagementAction(() => deleteMemoryCategory(categoryId));
  }

  function clearMemoryMessage() {
    setMemoryMessage(null);
  }

  function saveRoutineFromPage(input: RoutineInput) {
    return runRoutineManagementAction(() => saveRoutine(input));
  }

  function deleteRoutineFromPage(routineId: string) {
    return runRoutineManagementAction(() => deleteRoutine(routineId));
  }

  function clearRoutineMessage() {
    setRoutineMessage(null);
  }

  function markRoutineBusy() {
    setRoutineMessage("Busy will snooze reminders after reminder jobs are implemented.");
    setExpandedRoutineId(null);
  }

  async function refreshSuggestionsFromPage() {
    setSuggestionsRequested(true);
    setSuggestionMessage(null);
    setSuggestionLoading(true);

    try {
      const pinnedSuggestionIdSet = new Set(pinnedSuggestionIds);
      const ignoredMemoryIds = memorySuggestions
        .filter((suggestion) => !pinnedSuggestionIdSet.has(suggestion.id))
        .map((suggestion) => suggestion.id);
      const result = await refreshMemorySuggestions(ignoredMemoryIds);

      if (!result.ok) {
        setSuggestionMessage(result.message);
        setMemorySuggestions([]);
        setPinnedSuggestionIds([]);
        return;
      }

      applyMemoryData(result.data.dashboardData);
      setMemorySuggestions(result.data.suggestions);
      setPinnedSuggestionIds([]);
    } finally {
      setSuggestionLoading(false);
    }
  }

  async function pinSuggestionFromPage(memoryId: string) {
    setSuggestionMessage(null);
    setSuggestionPending(true);

    try {
      const result = await pinMemorySuggestion(memoryId);

      if (!result.ok) {
        setSuggestionMessage(result.message);
        return false;
      }

      applyMemoryData(result.data.dashboardData);
      setPinnedSuggestionIds((current) =>
        current.includes(memoryId) ? current : [...current, memoryId],
      );
      return true;
    } finally {
      setSuggestionPending(false);
    }
  }

  async function cancelSuggestionPinFromPage(memoryId: string) {
    setSuggestionMessage(null);
    setSuggestionPending(true);

    try {
      const result = await cancelPinnedMemorySuggestion(memoryId);

      if (!result.ok) {
        setSuggestionMessage(result.message);
        return false;
      }

      applyMemoryData(result.data.dashboardData);
      setPinnedSuggestionIds((current) =>
        current.filter((suggestionId) => suggestionId !== memoryId),
      );
      return true;
    } finally {
      setSuggestionPending(false);
    }
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
                {activeView === "dashboard"
                  ? `${todayFormatter.format(new Date())} Dashboard`
                  : activeView === "routines"
                    ? "Routines"
                  : "Memories"}
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
            {activeView === "dashboard" ? (
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
            ) : null}
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

        {activeView === "routines" ? (
          <RoutinesPage
            darkMode={darkMode}
            routines={routineDefinitions}
            loading={routineLoading}
            pending={routineActionPending}
            message={routineMessage}
            onRoutineSave={saveRoutineFromPage}
            onRoutineDelete={deleteRoutineFromPage}
            onMessageClear={clearRoutineMessage}
          />
        ) : activeView === "memories" ? (
          <MemoriesPage
            darkMode={darkMode}
            categories={memoryCategories}
            memoryRecords={memoryRecords}
            suggestions={memorySuggestions}
            pinnedSuggestionIds={pinnedSuggestionIds}
            loading={memoryLoading}
            pending={memoryActionPending}
            suggestionLoading={suggestionLoading}
            suggestionPending={suggestionPending}
            suggestionMessage={suggestionMessage}
            suggestionsRequested={suggestionsRequested}
            message={memoryMessage}
            selectedMemoryId={selectedMemoryId}
            onMemorySave={saveMemoryFromPage}
            onMemoryDelete={deleteMemoryFromPage}
            onCategorySave={saveCategoryFromPage}
            onCategoryDelete={deleteCategoryFromPage}
            onMessageClear={clearMemoryMessage}
            onSuggestionsRefresh={refreshSuggestionsFromPage}
            onSuggestionPin={pinSuggestionFromPage}
            onSuggestionCancel={cancelSuggestionPinFromPage}
          />
        ) : (
          <section className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
            <section
              className={`min-w-0 rounded-md border ${panelClass(darkMode)}`}
            >
              <SectionHeader
                icon={<Check size={18} aria-hidden="true" />}
                title="Today's Tasks"
                meta={`${tasks.length} recommended`}
                darkMode={darkMode}
              />
              <div
                className={
                  darkMode
                    ? "divide-y divide-neutral-900"
                    : "divide-y divide-slate-200"
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

            <aside className="grid gap-4">
              <section className={`rounded-md border ${panelClass(darkMode)}`}>
                <SectionHeader
                  icon={<Bell size={18} aria-hidden="true" />}
                  title="Routines"
                  meta={`${routines.length} scheduled`}
                  darkMode={darkMode}
                />
                {routineMessage ? (
                  <div
                    className={`border-b px-4 py-3 text-xs font-semibold ${
                      darkMode
                        ? "border-neutral-900 text-amber-200"
                        : "border-slate-200 text-amber-700"
                    }`}
                  >
                    {routineMessage}
                  </div>
                ) : null}
                <div
                  className={
                    darkMode
                      ? "divide-y divide-neutral-900"
                      : "divide-y divide-slate-200"
                  }
                >
                  {routineLoading ? (
                    <p
                      className={`px-4 py-4 text-sm ${
                        darkMode ? "text-neutral-400" : "text-slate-500"
                      }`}
                    >
                      Loading routines...
                    </p>
                  ) : null}
                  {!routineLoading && routines.length === 0 ? (
                    <p
                      className={`px-4 py-4 text-sm ${
                        darkMode ? "text-neutral-400" : "text-slate-500"
                      }`}
                    >
                      No routines due today.
                    </p>
                  ) : null}
                  {routines.map((routine) => (
                    <RoutineCard
                      key={routine.id}
                      routine={routine}
                      darkMode={darkMode}
                      disabled={routineActionPending}
                      expanded={expandedRoutineId === routine.id}
                      onToggleExpanded={() =>
                        setExpandedRoutineId((current) =>
                          current === routine.id ? null : routine.id,
                        )
                      }
                      onStatusChange={(status) =>
                        updateRoutine(routine.id, status)
                      }
                      onBusy={markRoutineBusy}
                    />
                  ))}
                </div>
              </section>

              <section className={`rounded-md border ${panelClass(darkMode)}`}>
                <SectionHeader
                  icon={<ClipboardList size={18} aria-hidden="true" />}
                  title="Pinned Memories"
                  meta={`${pinnedMemories.length} saved`}
                  darkMode={darkMode}
                />
                {memoryMessage ? (
                  <div
                    className={`border-b px-4 py-3 text-xs font-semibold ${
                      darkMode
                        ? "border-neutral-900 text-amber-200"
                        : "border-slate-200 text-amber-700"
                    }`}
                  >
                    {memoryMessage}
                  </div>
                ) : null}
                <div
                  className={
                    darkMode
                      ? "divide-y divide-neutral-900"
                      : "divide-y divide-slate-200"
                  }
                >
                  {memoryLoading ? (
                    <p
                      className={`px-4 py-4 text-sm ${
                        darkMode ? "text-neutral-400" : "text-slate-500"
                      }`}
                    >
                      Loading pinned memories...
                    </p>
                  ) : null}
                  {!memoryLoading && pinnedMemories.length === 0 ? (
                    <p
                      className={`px-4 py-4 text-sm ${
                        darkMode ? "text-neutral-400" : "text-slate-500"
                      }`}
                    >
                      No pinned memories yet.
                    </p>
                  ) : null}
                  {pinnedMemories.map((memory) => (
                    <PinnedMemoryCard
                      key={memory.id}
                      memory={memory}
                      darkMode={darkMode}
                      disabled={memoryActionPending}
                      expanded={expandedMemoryId === memory.id}
                      onDone={() => markMemoryDone(memory.id)}
                      onCancelDone={() => cancelMemoryDone(memory.id)}
                      onReplace={() => replaceMemory(memory.id)}
                      onView={() => viewMemory(memory.memoryId)}
                      onToggleExpanded={() =>
                        setExpandedMemoryId((current) =>
                          current === memory.id ? null : memory.id,
                        )
                      }
                    />
                  ))}
                </div>
              </section>
            </aside>
          </section>
        )}
      </div>

      <Sidebar
        open={sidebarOpen}
        darkMode={darkMode}
        activeView={activeView}
        onClose={() => setSidebarOpen(false)}
        onViewChange={setActiveView}
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
