"use client";

// App Shell.
import { Menu } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/button";
import { sectionBorderClass } from "@/components/color";
import {
  NotificationStack,
  type NotificationItem,
} from "@/components/notification";
import { appShellClass } from "@/components/theme";
import type { DatabaseVersionStatus } from "@/components/app-metadata";
import type {
  LanguagePreference,
  ThemePreference,
} from "@/app-shell/app-preferences";
import { Dashboard } from "@/features/dashboard/components/Dashboard";
import { useDashboardMemories } from "@/features/dashboard/hooks/useDashboardMemories";
import { useDashboardProjects } from "@/features/dashboard/hooks/useDashboardProjects";
import { useDashboardRoutines } from "@/features/dashboard/hooks/useDashboardRoutines";
import type { DashboardView } from "@/features/dashboard/types";
import type { AuthUser } from "@/features/auth/server/auth-service";
import { MemoriesPage } from "@/features/memories/components/MemoriesPage";
import type { ProjectInput } from "@/features/projects/actions";
import { ProjectPageTitle } from "@/features/projects/components/ProjectPageTitle";
import { ProjectsPage } from "@/features/projects/components/ProjectsPage";
import { projectToDraft } from "@/features/projects/components/project-page-helpers";
import { RoutinesPage } from "@/features/routines/components/RoutinesPage";
import { SettingsPage } from "@/features/settings/components/SettingsPage";
import { Sidebar } from "./Sidebar";

export function AppShell({
  currentUser,
  darkMode,
  languagePreference,
  onLanguagePreferenceChange,
  onThemePreferenceChange,
  themePreference,
  versionStatus,
  logoutPending,
  notifications,
  onLogout,
  onNotificationDismiss,
  showErrorNotification,
}: {
  currentUser: AuthUser;
  darkMode: boolean;
  languagePreference: LanguagePreference;
  onLanguagePreferenceChange: (preference: LanguagePreference) => void;
  onThemePreferenceChange: (preference: ThemePreference) => void;
  themePreference: ThemePreference;
  versionStatus: DatabaseVersionStatus;
  logoutPending: boolean;
  notifications: NotificationItem[];
  onLogout: () => void;
  onNotificationDismiss: (notificationId: number) => void;
  showErrorNotification: (message: string, title?: string) => void;
}) {
  const [activeView, setActiveView] = useState<DashboardView>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  );
  const [projectDraft, setProjectDraft] = useState<ProjectInput | null>(null);
  const projectState = useDashboardProjects(showErrorNotification);
  const routineState = useDashboardRoutines(showErrorNotification);
  const memoryState = useDashboardMemories(showErrorNotification);
  const { refreshProjectData } = projectState;
  const { refreshMemoryData } = memoryState;
  const { refreshRoutineData } = routineState;
  const pinnedProjects = useMemo(
    () =>
      projectState.projects
        .filter((project) => project.sidebarPinOrder !== null)
        .sort(
          (left, right) =>
            (left.sidebarPinOrder ?? 0) - (right.sidebarPinOrder ?? 0),
        ),
    [projectState.projects],
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void refreshProjectData();
      void refreshMemoryData();
      void refreshRoutineData();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [currentUser.id, refreshMemoryData, refreshProjectData, refreshRoutineData]);

  function showProjectsList() {
    setSelectedProjectId(null);
    setActiveView("projects");
    setSidebarOpen(false);
  }

  function showProjectDetail(projectId: string) {
    setSelectedProjectId(projectId);
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

  const pageTitle =
    activeView === "dashboard"
      ? "Dashboard"
      : activeView === "routines"
        ? "Routines"
        : activeView === "memories"
          ? "Memories"
          : "Settings";

  return (
    <main className={`min-h-screen transition-colors ${appShellClass(darkMode)}`}>
      <div className="lg:flex lg:items-start">
        <Sidebar
          open={sidebarOpen}
          darkMode={darkMode}
          activeView={activeView}
          selectedProjectId={selectedProjectId}
          pinnedProjects={pinnedProjects}
          logoutPending={logoutPending}
          onClose={() => setSidebarOpen(false)}
          onViewChange={handleViewChange}
          onProjectShortcut={showProjectDetail}
          onThemeChange={(nextDarkMode) =>
            onThemePreferenceChange(nextDarkMode ? "dark" : "light")
          }
          onLogout={onLogout}
        />

        <div className="mx-auto flex min-h-[110vh] min-w-0 flex-1 flex-col gap-4 px-4 pb-12 pt-4 sm:px-6 sm:pb-16 lg:max-w-[1200px] lg:px-8 lg:pb-20">
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
                editDisabled={projectState.projectActionPending}
                pinPending={
                  selectedProjectId
                    ? projectState.pendingProjectPinIds.includes(selectedProjectId)
                    : false
                }
                onBackToList={() => setSelectedProjectId(null)}
                onProjectSelect={setSelectedProjectId}
                onEditProject={(project) => {
                  setProjectDraft(projectToDraft(project));
                }}
                onPinProject={projectState.pinProjectFromPage}
                onUnpinProject={projectState.unpinProjectFromPage}
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
              projectDraft={projectDraft}
              setProjectDraft={setProjectDraft}
              selectedProjectId={selectedProjectId}
              pendingProjectPinIds={projectState.pendingProjectPinIds}
              onProjectSave={projectState.saveProjectFromPage}
              onProjectDelete={projectState.archiveProjectFromPage}
              onProjectPin={projectState.pinProjectFromPage}
              onProjectUnpin={projectState.unpinProjectFromPage}
              onMilestoneSave={projectState.saveMilestoneFromPage}
              onMilestoneDelete={projectState.archiveMilestoneFromPage}
              onTaskSave={projectState.saveTaskFromPage}
              onTaskDelete={projectState.archiveTaskFromPage}
              onTaskStatus={projectState.statusTaskFromPage}
              onProjectSelect={setSelectedProjectId}
            />
          ) : activeView === "routines" ? (
            <RoutinesPage
              darkMode={darkMode}
              routines={routineState.routineDefinitions}
              loading={routineState.routineLoading}
              pending={routineState.routineActionPending}
              onRoutineSave={routineState.saveRoutineFromPage}
              onRoutineDelete={routineState.deleteRoutineFromPage}
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
              onMemorySave={memoryState.saveMemoryFromPage}
              onMemoryDelete={memoryState.deleteMemoryFromPage}
              onCategorySave={memoryState.saveCategoryFromPage}
              onCategoryDelete={memoryState.deleteCategoryFromPage}
              onSuggestionsRefresh={memoryState.refreshSuggestionsFromPage}
              onSuggestionPin={memoryState.pinSuggestionFromPage}
              onSuggestionCancel={memoryState.cancelSuggestionPinFromPage}
            />
          ) : activeView === "settings" ? (
            <SettingsPage
              darkMode={darkMode}
              languagePreference={languagePreference}
              themePreference={themePreference}
              versionStatus={versionStatus}
              onLanguagePreferenceChange={onLanguagePreferenceChange}
              onThemePreferenceChange={onThemePreferenceChange}
            />
          ) : (
            <Dashboard
              darkMode={darkMode}
              tasks={projectState.tasks}
              taskLoading={projectState.projectLoading}
              routines={routineState.routines}
              routineLoading={routineState.routineLoading}
              routineActionPending={routineState.routineActionPending}
              pinnedMemories={memoryState.pinnedMemories}
              memoryLoading={memoryState.memoryLoading}
              memoryActionPending={memoryState.memoryActionPending}
              onTaskStatus={projectState.updateTaskFromDashboard}
              onRoutineStatus={routineState.updateRoutine}
              onMemoryDone={memoryState.markMemoryDone}
              onMemoryCancelDone={memoryState.cancelMemoryDone}
              onMemoryReplace={memoryState.replaceMemory}
              onTaskOpen={showProjectDetail}
              onRoutineOpen={() => {
                setActiveView("routines");
                setSidebarOpen(false);
              }}
              onMemoryOpen={() => {
                setActiveView("memories");
                setSidebarOpen(false);
              }}
            />
          )}
        </div>
      </div>

      <NotificationStack
        notifications={notifications}
        darkMode={darkMode}
        onDismiss={onNotificationDismiss}
      />
    </main>
  );
}
