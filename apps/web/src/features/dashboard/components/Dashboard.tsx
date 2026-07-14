"use client";

import { Menu } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { sectionBorderClass } from "@/components/ui/color";
import { NotificationStack } from "@/components/ui/notification";
import type { AuthUser } from "@/features/auth/server/auth-service";
import { MemoriesPage } from "@/features/memories/components/MemoriesPage";
import { RoutinesPage } from "@/features/routines/components/RoutinesPage";
import { TasksPage } from "@/features/tasks/components/TasksPage";
import { rewardPreview } from "../dummy-data";
import { useDashboardMemories } from "../hooks/useDashboardMemories";
import { useDashboardNotifications } from "../hooks/useDashboardNotifications";
import { useDashboardRoutines } from "../hooks/useDashboardRoutines";
import { useDashboardTasks } from "../hooks/useDashboardTasks";
import type { DashboardView, Task } from "../types";
import { DashboardHome } from "./DashboardHome";
import { ReviewDialog } from "./ReviewDialog";
import { Sidebar } from "./Sidebar";

export function Dashboard({
  currentUser,
  logoutPending,
  onLogout,
}: {
  currentUser: AuthUser;
  logoutPending: boolean;
  onLogout: () => void;
}) {
  const [activeView, setActiveView] = useState<DashboardView>("dashboard");
  const [reviewOpen, setReviewOpen] = useState(false);
  const reviewCount = 0;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const {
    notifications,
    dismissNotification,
    showErrorNotification,
    showInfoNotification,
  } = useDashboardNotifications();
  const taskState = useDashboardTasks(showErrorNotification);
  const routineState = useDashboardRoutines(showErrorNotification);
  const memoryState = useDashboardMemories(
    showErrorNotification,
    showMemoriesView,
  );
  const { refreshTaskData } = taskState;
  const { refreshMemoryData } = memoryState;
  const { refreshRoutineData } = routineState;

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void refreshTaskData();
      void refreshMemoryData();
      void refreshRoutineData();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [currentUser.id, refreshMemoryData, refreshRoutineData, refreshTaskData]);

  const stats = useMemo(() => {
    const completedWeight = taskState.tasks.reduce(
      (sum, task) => sum + task.completedWeight,
      0,
    );
    const completedRoutines = routineState.routines.filter(
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
  }, [routineState.routines, taskState.tasks]);

  function showMemoriesView() {
    setActiveView("memories");
    setSidebarOpen(false);
  }

  function showUnavailableFeature(featureName: string) {
    showInfoNotification(
      `${featureName} is not implemented in this prototype yet.`,
      "Feature not ready",
    );
  }

  function handleTaskExpand(taskId: string) {
    taskState.setExpandedTaskId((current) =>
      current === taskId ? null : taskId,
    );
  }

  function handleSubtaskToggle(task: Task, subtaskId: string) {
    taskState.toggleSubtask(
      subtaskId,
      task.subtasks?.find((subtask) => subtask.id === subtaskId)?.done ??
        false,
    );
  }

  function showTasksView() {
    setActiveView("tasks");
    setSidebarOpen(false);
  }

  function handleRoutineExpand(routineId: string) {
    routineState.setExpandedRoutineId((current) =>
      current === routineId ? null : routineId,
    );
  }

  function handleMemoryExpand(pinnedMemoryId: string) {
    memoryState.setExpandedMemoryId((current) =>
      current === pinnedMemoryId ? null : pinnedMemoryId,
    );
  }

  const pageTitle =
    activeView === "dashboard"
      ? "Dashboard"
      : activeView === "tasks"
        ? "Tasks"
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
          logoutPending={logoutPending}
          onClose={() => setSidebarOpen(false)}
          onViewChange={setActiveView}
          onThemeChange={setDarkMode}
          onLogout={onLogout}
          onUnavailableFeature={showUnavailableFeature}
        />

        <div className="mx-auto flex min-h-[105vh] min-w-0 flex-1 flex-col gap-4 px-4 py-4 sm:px-6 lg:max-w-[1200px] lg:px-8">
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

          {activeView === "tasks" ? (
            <TasksPage
              darkMode={darkMode}
              tasks={taskState.taskRecords}
              loading={taskState.taskLoading}
              pending={taskState.taskActionPending}
              message={taskState.taskMessage}
              onTaskSave={taskState.saveTaskFromPage}
              onTaskDelete={taskState.deleteTaskFromPage}
              onTaskArchive={taskState.archiveTaskFromPage}
              onTaskProgress={taskState.progressTaskFromPage}
              onTaskStatus={taskState.statusTaskFromPage}
              onMessageClear={taskState.clearTaskMessage}
            />
          ) : activeView === "routines" ? (
            <RoutinesPage
              darkMode={darkMode}
              routines={routineState.routineDefinitions}
              loading={routineState.routineLoading}
              pending={routineState.routineActionPending}
              message={routineState.routineMessage}
              onRoutineSave={routineState.saveRoutineFromPage}
              onRoutineDelete={routineState.deleteRoutineFromPage}
              onMessageClear={routineState.clearRoutineMessage}
            />
          ) : activeView === "memories" ? (
            <MemoriesPage
              darkMode={darkMode}
              categories={memoryState.memoryCategories}
              memoryRecords={memoryState.memoryRecords}
              suggestions={memoryState.memorySuggestions}
              pinnedSuggestionIds={memoryState.pinnedSuggestionIds}
              pendingSuggestionIds={memoryState.pendingSuggestionIds}
              loading={memoryState.memoryLoading}
              pending={memoryState.memoryActionPending}
              suggestionLoading={memoryState.suggestionLoading}
              suggestionsRequested={memoryState.suggestionsRequested}
              message={memoryState.memoryMessage}
              selectedMemoryId={memoryState.selectedMemoryId}
              onMemorySave={memoryState.saveMemoryFromPage}
              onMemoryDelete={memoryState.deleteMemoryFromPage}
              onCategorySave={memoryState.saveCategoryFromPage}
              onCategoryDelete={memoryState.deleteCategoryFromPage}
              onMessageClear={memoryState.clearMemoryMessage}
              onSuggestionsRefresh={memoryState.refreshSuggestionsFromPage}
              onSuggestionPin={memoryState.pinSuggestionFromPage}
              onSuggestionCancel={memoryState.cancelSuggestionPinFromPage}
            />
          ) : (
            <DashboardHome
              darkMode={darkMode}
              tasks={taskState.tasks}
              taskLoading={taskState.taskLoading}
              taskActionPending={taskState.taskActionPending}
              expandedTaskId={taskState.expandedTaskId}
              routines={routineState.routines}
              routineLoading={routineState.routineLoading}
              routineActionPending={routineState.routineActionPending}
              routineMessage={routineState.routineMessage}
              expandedRoutineId={routineState.expandedRoutineId}
              pinnedMemories={memoryState.pinnedMemories}
              memoryLoading={memoryState.memoryLoading}
              memoryActionPending={memoryState.memoryActionPending}
              memoryMessage={memoryState.memoryMessage}
              expandedMemoryId={memoryState.expandedMemoryId}
              onTaskExpand={handleTaskExpand}
              onTaskStatus={taskState.updateTaskFromDashboard}
              onSubtaskToggle={handleSubtaskToggle}
              onTaskEdit={showTasksView}
              onRoutineExpand={handleRoutineExpand}
              onRoutineStatus={routineState.updateRoutine}
              onRoutineBusy={routineState.markRoutineBusy}
              onMemoryExpand={handleMemoryExpand}
              onMemoryDone={memoryState.markMemoryDone}
              onMemoryCancelDone={memoryState.cancelMemoryDone}
              onMemoryReplace={memoryState.replaceMemory}
              onMemoryView={memoryState.viewMemory}
            />
          )}
        </div>
      </div>

      <NotificationStack
        notifications={notifications}
        darkMode={darkMode}
        onDismiss={dismissNotification}
      />

      <ReviewDialog
        tasks={taskState.tasks}
        routines={routineState.routines}
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
