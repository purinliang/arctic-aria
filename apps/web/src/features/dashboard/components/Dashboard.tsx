"use client";

import {
  Bell,
  Check,
  ClipboardList,
  Menu,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  dividerClass,
  mutedTextClass,
  sectionBorderClass,
} from "@/components/ui/color";
import {
  NotificationStack,
  type NotificationItem,
} from "@/components/ui/notification";
import { Panel } from "@/components/ui/panel";
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
  initialTasks,
  rewardPreview,
} from "../dummy-data";
import {
  applyOptimisticPinnedMemoryStatus,
  applyOptimisticRoutineStatus,
} from "../optimistic-updates";
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
  const [pinnedSuggestionIds, setPinnedSuggestionIds] = useState<string[]>([]);
  const [suggestionsRequested, setSuggestionsRequested] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(
    [],
  );
  const [activeView, setActiveView] = useState<DashboardView>("dashboard");
  const [selectedMemoryId, setSelectedMemoryId] = useState<string | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewCount, setReviewCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
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

  const dismissNotification = useCallback((notificationId: number) => {
    setNotifications((current) =>
      current.filter((notification) => notification.id !== notificationId),
    );
  }, []);

  const showErrorNotification = useCallback(
    (message: string, title = "Action failed") => {
      setNotifications((current) => [
        ...current.slice(-2),
        {
          id: Date.now(),
          tone: "error",
          title,
          message,
        },
      ]);
    },
    [],
  );

  const showInfoNotification = useCallback(
    (message: string, title = "Not available yet") => {
      setNotifications((current) => [
        ...current.slice(-2),
        {
          id: Date.now(),
          tone: "info",
          title,
          message,
        },
      ]);
    },
    [],
  );

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
    const previousRoutines = routines;

    setExpandedRoutineId(null);
    setRoutines((current) =>
      applyOptimisticRoutineStatus(current, routineId, status),
    );
    void runRoutineAction(
      () =>
        status === "completed"
          ? completeRoutineInstance(routineId)
          : skipRoutineInstance(routineId),
      null,
      () => setRoutines(previousRoutines),
    );
  }

  async function runMemoryAction(
    action: MemoryDataAction,
    expandedPinnedMemoryId: string | null,
    onFailure?: () => void,
  ) {
    setMemoryMessage(null);
    setMemoryActionPending(true);

    try {
      const result = await action();

      if (!result.ok) {
        onFailure?.();
        showErrorNotification(result.message);
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
    onFailure?: () => void,
  ) {
    setRoutineMessage(null);
    setRoutineActionPending(true);

    try {
      const result = await action();

      if (!result.ok) {
        onFailure?.();
        showErrorNotification(result.message);
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
    const previousPinnedMemories = pinnedMemories;

    setExpandedMemoryId(null);
    setPinnedMemories((current) =>
      applyOptimisticPinnedMemoryStatus(current, pinnedMemoryId, "completed"),
    );
    void runMemoryAction(
      () => completePinnedMemory(pinnedMemoryId),
      null,
      () => setPinnedMemories(previousPinnedMemories),
    );
  }

  function cancelMemoryDone(pinnedMemoryId: string) {
    const previousPinnedMemories = pinnedMemories;

    setExpandedMemoryId(null);
    setPinnedMemories((current) =>
      applyOptimisticPinnedMemoryStatus(current, pinnedMemoryId, "active"),
    );
    void runMemoryAction(
      () => cancelPinnedMemoryDone(pinnedMemoryId),
      null,
      () => setPinnedMemories(previousPinnedMemories),
    );
  }

  function replaceMemory(pinnedMemoryId: string) {
    setExpandedMemoryId(null);
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
    setSuggestionLoading(true);

    try {
      const pinnedSuggestionIdSet = new Set(pinnedSuggestionIds);
      const ignoredMemoryIds = memorySuggestions
        .filter((suggestion) => !pinnedSuggestionIdSet.has(suggestion.id))
        .map((suggestion) => suggestion.id);
      const result = await refreshMemorySuggestions(ignoredMemoryIds);

      if (!result.ok) {
        showErrorNotification(result.message);
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
    const previousPinnedSuggestionIds = pinnedSuggestionIds;

    setSuggestionPending(true);
    setPinnedSuggestionIds((current) =>
      current.includes(memoryId) ? current : [...current, memoryId],
    );

    try {
      const result = await pinMemorySuggestion(memoryId);

      if (!result.ok) {
        setPinnedSuggestionIds(previousPinnedSuggestionIds);
        showErrorNotification(result.message);
        return false;
      }

      applyMemoryData(result.data.dashboardData);
      return true;
    } finally {
      setSuggestionPending(false);
    }
  }

  async function cancelSuggestionPinFromPage(memoryId: string) {
    const previousPinnedSuggestionIds = pinnedSuggestionIds;

    setSuggestionPending(true);
    setPinnedSuggestionIds((current) =>
      current.filter((suggestionId) => suggestionId !== memoryId),
    );

    try {
      const result = await cancelPinnedMemorySuggestion(memoryId);

      if (!result.ok) {
        setPinnedSuggestionIds(previousPinnedSuggestionIds);
        showErrorNotification(result.message);
        return false;
      }

      applyMemoryData(result.data.dashboardData);
      return true;
    } finally {
      setSuggestionPending(false);
    }
  }

  function openReview() {
    setReviewOpen(true);
    setReviewCount((count) => count + 1);
  }

  function showUnavailableFeature(featureName: string) {
    showInfoNotification(
      `${featureName} is not implemented in this prototype yet.`,
      "Feature not ready",
    );
  }

  const pageTitle =
    activeView === "dashboard"
      ? "Dashboard"
      : activeView === "routines"
        ? "Routines"
        : "Memories";

  return (
    <main
      className={`min-h-screen transition-colors ${
        darkMode ? "bg-black text-white" : "bg-[#eef2f5] text-slate-950"
      }`}
    >
      <div className="lg:flex lg:items-start">
        <Sidebar
          open={sidebarOpen}
          darkMode={darkMode}
          activeView={activeView}
          currentUser={currentUser}
          logoutPending={logoutPending}
          onClose={() => setSidebarOpen(false)}
          onViewChange={setActiveView}
          onThemeChange={setDarkMode}
          onLogout={onLogout}
          onReviewOpen={openReview}
          onUnavailableFeature={showUnavailableFeature}
        />

        <div className="mx-auto flex min-w-0 flex-1 flex-col gap-4 px-4 py-4 sm:px-6 lg:max-w-[1200px] lg:px-8">
          <header
            className={`flex items-center gap-3 border-b pb-4 ${sectionBorderClass(darkMode)}`}
          >
            <Button
              darkMode={darkMode}
              size="icon-sm"
              className="h-10 w-10 lg:hidden"
              aria-label="Open navigation"
              icon={<Menu size={20} aria-hidden="true" />}
              onClick={() => setSidebarOpen(true)}
            />
            <h1 className="text-2xl font-semibold tracking-normal sm:text-3xl">
              {pageTitle}
            </h1>
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
            <Panel darkMode={darkMode} className="min-w-0">
              <SectionHeader
                icon={<Check size={18} aria-hidden="true" />}
                title="Today's Tasks"
                meta={`${tasks.length} recommended`}
                darkMode={darkMode}
              />
              <div className={dividerClass(darkMode)}>
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
            </Panel>

            <aside className="grid gap-4">
              <Panel darkMode={darkMode}>
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
                <div className={dividerClass(darkMode)}>
                  {routineLoading ? (
                    <p className={`px-4 py-4 text-sm ${mutedTextClass(darkMode)}`}>
                      Loading routines...
                    </p>
                  ) : null}
                  {!routineLoading && routines.length === 0 ? (
                    <p className={`px-4 py-4 text-sm ${mutedTextClass(darkMode)}`}>
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
              </Panel>

              <Panel darkMode={darkMode}>
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
                <div className={dividerClass(darkMode)}>
                  {memoryLoading ? (
                    <p className={`px-4 py-4 text-sm ${mutedTextClass(darkMode)}`}>
                      Loading pinned memories...
                    </p>
                  ) : null}
                  {!memoryLoading && pinnedMemories.length === 0 ? (
                    <p className={`px-4 py-4 text-sm ${mutedTextClass(darkMode)}`}>
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
              </Panel>
            </aside>
          </section>
          )}
        </div>
      </div>

      <NotificationStack
        notifications={notifications}
        darkMode={darkMode}
        onDismiss={dismissNotification}
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
