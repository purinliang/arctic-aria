"use client";

import { Menu } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { sectionBorderClass } from "@/components/ui/color";
import { NotificationStack } from "@/components/ui/notification";
import type { AuthUser } from "@/features/auth/server/auth-service";
import { MemoriesPage } from "@/features/memories/components/MemoriesPage";
import { ProjectPageTitle } from "@/features/projects/components/ProjectPageTitle";
import { ProjectsPage } from "@/features/projects/components/ProjectsPage";
import { RoutinesPage } from "@/features/routines/components/RoutinesPage";
import { rewardPreview } from "../dummy-data";
import { useDashboardMemories } from "../hooks/useDashboardMemories";
import { useDashboardNotifications } from "../hooks/useDashboardNotifications";
import { useDashboardProjects } from "../hooks/useDashboardProjects";
import { useDashboardRoutines } from "../hooks/useDashboardRoutines";
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
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  );
  const {
    notifications,
    dismissNotification,
    showErrorNotification,
    showInfoNotification,
  } = useDashboardNotifications();
  const projectState = useDashboardProjects(showErrorNotification);
  const routineState = useDashboardRoutines(showErrorNotification);
  const memoryState = useDashboardMemories(
    showErrorNotification,
    showMemoriesView,
  );
  const { refreshProjectData } = projectState;
  const { refreshMemoryData } = memoryState;
  const { refreshRoutineData } = routineState;

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void refreshProjectData();
      void refreshMemoryData();
      void refreshRoutineData();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [currentUser.id, refreshMemoryData, refreshProjectData, refreshRoutineData]);

  const stats = useMemo(() => {
    const completedTasks = projectState.tasks.filter(
      (task) => task.status === "done",
    ).length;
    const completedRoutines = routineState.routines.filter(
      (routine) => routine.status === "completed",
    ).length;
    const gold =
      rewardPreview.baseGold +
      completedTasks * rewardPreview.perWeightGold +
      completedRoutines * rewardPreview.routineGold;
    const chestLevel = Math.min(
      Math.max(1, Math.ceil((completedTasks + completedRoutines) / 3)),
      5,
    );

    return { gold, chestLevel };
  }, [projectState.tasks, routineState.routines]);

  function showMemoriesView() {
    setActiveView("memories");
    setSidebarOpen(false);
  }

  function showProjectsList() {
    setSelectedProjectId(null);
    setActiveView("projects");
    setSidebarOpen(false);
  }

  function handleViewChange(view: DashboardView) {
    if (view === "projects") {
      showProjectsList();
      return;
    }

    setActiveView(view);
    setSidebarOpen(false);
  }

  function showUnavailableFeature(featureName: string) {
    showInfoNotification(
      `${featureName} is not implemented in this prototype yet.`,
      "Feature not ready",
    );
  }

  function handleTaskExpand(taskId: string) {
    projectState.setExpandedTaskId((current) =>
      current === taskId ? null : taskId,
    );
  }

  function handleSubtaskToggle(task: Task, subtaskId: string) {
    projectState.toggleSubtask(
      subtaskId,
      task.subtasks?.find((subtask) => subtask.id === subtaskId)?.done ??
        false,
    );
  }

  function showProjectsView() {
    setActiveView("projects");
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
          onViewChange={handleViewChange}
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
            {activeView === "projects" ? (
              <ProjectPageTitle
                darkMode={darkMode}
                projects={projectState.projects}
                selectedProjectId={selectedProjectId}
                onBackToList={() => setSelectedProjectId(null)}
                onProjectSelect={setSelectedProjectId}
              />
            ) : (
              <h1 className="text-2xl font-semibold tracking-normal sm:text-3xl">
                {pageTitle}
              </h1>
            )}
          </header>

          {activeView === "projects" ? (
            <ProjectsPage
              darkMode={darkMode}
              projects={projectState.projects}
              loading={projectState.projectLoading}
              pending={projectState.projectActionPending}
              message={projectState.projectMessage}
              selectedProjectId={selectedProjectId}
              onProjectSave={projectState.saveProjectFromPage}
              onMilestoneSave={projectState.saveMilestoneFromPage}
              onTaskSave={projectState.saveTaskFromPage}
              onTaskStatus={projectState.statusTaskFromPage}
              onSubtaskToggle={projectState.toggleSubtaskFromPage}
              onProjectSelect={setSelectedProjectId}
              onMessageClear={projectState.clearProjectMessage}
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
              tasks={projectState.tasks}
              taskLoading={projectState.projectLoading}
              pendingTaskIds={projectState.pendingTaskIds}
              pendingSubtaskIds={projectState.pendingSubtaskIds}
              expandedTaskId={projectState.expandedTaskId}
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
              onTaskStatus={projectState.updateTaskFromDashboard}
              onSubtaskToggle={handleSubtaskToggle}
              onTaskEdit={showProjectsView}
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
        tasks={projectState.tasks}
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
