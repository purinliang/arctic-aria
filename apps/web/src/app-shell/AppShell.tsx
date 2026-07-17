"use client";

// App Shell.
import { Menu } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/button";
import { sectionBorderClass } from "@/components/color";
import {
  NotificationStack,
  type NotificationItem,
} from "@/components/notification";
import { appShellClass } from "@/components/theme";
import type { DatabaseVersionStatus } from "@/components/app-metadata";
import type { ThemePreference } from "@/app-shell/app-preferences";
import type { AppMessages } from "@/messages/app-messages";
import type { LanguagePreference } from "@/messages/languages";
import type { TimeFormatPreference } from "@/features/settings/preferences";
import { Dashboard } from "@/features/dashboard/components/Dashboard";
import { useDashboardMemories } from "@/features/dashboard/hooks/useDashboardMemories";
import { useDashboardProjects } from "@/features/dashboard/hooks/useDashboardProjects";
import { useDashboardRoutines } from "@/features/dashboard/hooks/useDashboardRoutines";
import type { DashboardView } from "@/features/dashboard/types";
import type { AuthUser } from "@/features/auth/server/auth-service";
import { getIdeaPageData, type IdeaPageItem } from "@/features/ideas/actions";
import { IdeasPage } from "@/features/ideas/components/IdeasPage";
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
  messages,
  onLanguagePreferenceChange,
  onThemePreferenceChange,
  onTimeFormatPreferenceChange,
  themePreference,
  timeFormatPreference,
  versionStatus,
  logoutPending,
  notifications,
  onLogout,
  onNotificationDismiss,
  showErrorNotification,
  showSuccessNotification,
}: {
  currentUser: AuthUser;
  darkMode: boolean;
  languagePreference: LanguagePreference;
  messages: AppMessages;
  onLanguagePreferenceChange: (preference: LanguagePreference) => void;
  onThemePreferenceChange: (preference: ThemePreference) => void;
  onTimeFormatPreferenceChange: (preference: TimeFormatPreference) => void;
  themePreference: ThemePreference;
  timeFormatPreference: TimeFormatPreference;
  versionStatus: DatabaseVersionStatus;
  logoutPending: boolean;
  notifications: NotificationItem[];
  onLogout: () => void;
  onNotificationDismiss: (notificationId: number) => void;
  showErrorNotification: (message: string, title?: string) => void;
  showSuccessNotification: (message: string, title?: string) => void;
}) {
  const [activeView, setActiveView] = useState<DashboardView>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  );
  const [projectDraft, setProjectDraft] = useState<ProjectInput | null>(null);
  const [ideas, setIdeas] = useState<IdeaPageItem[]>([]);
  const [ideasLoading, setIdeasLoading] = useState(true);
  const projectState = useDashboardProjects(
    showErrorNotification,
    messages.dashboard.notifications,
    messages.projects.results,
  );
  const routineState = useDashboardRoutines(
    showErrorNotification,
    messages.dashboard.notifications,
    messages.routines.results,
  );
  const memoryState = useDashboardMemories(
    showErrorNotification,
    messages.dashboard.notifications,
    messages.memories.results,
  );
  const { refreshProjectData } = projectState;
  const { refreshMemoryData } = memoryState;
  const { refreshRoutineData } = routineState;
  const refreshIdeaData = useCallback(async () => {
    setIdeasLoading(true);

    const result = await getIdeaPageData();

    if (result.ok) {
      setIdeas(result.data);
    } else {
      showErrorNotification(result.message);
    }

    setIdeasLoading(false);
  }, [showErrorNotification]);
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
      void refreshIdeaData();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [
    currentUser.id,
    refreshIdeaData,
    refreshMemoryData,
    refreshProjectData,
    refreshRoutineData,
  ]);

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
      ? messages.appShell.pages.dashboard
      : activeView === "routines"
        ? messages.appShell.pages.routines
        : activeView === "ideas"
          ? messages.appShell.pages.ideas
          : activeView === "memories"
            ? messages.appShell.pages.memories
            : messages.appShell.pages.settings;

  return (
    <main className={`min-h-screen transition-colors ${appShellClass(darkMode)}`}>
      <div className="lg:flex lg:items-start">
        <Sidebar
          open={sidebarOpen}
          darkMode={darkMode}
          activeView={activeView}
          selectedProjectId={selectedProjectId}
          pinnedProjects={pinnedProjects}
          messages={messages.appShell}
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
              aria-label={messages.appShell.openNavigation}
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
                messages={messages.projects.pageTitle}
                timelineMessages={messages.projects.timeline}
                durationMessages={messages.projects.duration}
                dateMessages={messages.forms.datePicker}
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
              messages={messages.projects}
              formMessages={messages.forms}
            />
          ) : activeView === "routines" ? (
            <RoutinesPage
              darkMode={darkMode}
              routines={routineState.routineDefinitions}
              loading={routineState.routineLoading}
              pending={routineState.routineActionPending}
              onRoutineSave={routineState.saveRoutineFromPage}
              onRoutineDelete={routineState.deleteRoutineFromPage}
              messages={messages.routines}
              formMessages={messages.forms}
              timeFormatPreference={timeFormatPreference}
            />
          ) : activeView === "ideas" ? (
            <IdeasPage
              darkMode={darkMode}
              ideas={ideas}
              loading={ideasLoading}
              messages={messages.ideas}
              dateMessages={messages.forms.datePicker}
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
              messages={messages.memories}
              formMessages={messages.forms}
            />
          ) : activeView === "settings" ? (
            <SettingsPage
              currentUserId={currentUser.id}
              darkMode={darkMode}
              languagePreference={languagePreference}
              messages={messages.settings}
              themePreference={themePreference}
              versionMessages={messages.versionStatus}
              versionStatus={versionStatus}
              onLanguagePreferenceChange={onLanguagePreferenceChange}
              onThemePreferenceChange={onThemePreferenceChange}
              onTimeFormatPreferenceChange={onTimeFormatPreferenceChange}
              showErrorNotification={showErrorNotification}
              showSuccessNotification={showSuccessNotification}
              timeFormatPreference={timeFormatPreference}
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
              onTaskOpen={showProjectDetail}
              messages={messages.dashboard}
              formMessages={messages.forms}
              timeFormatPreference={timeFormatPreference}
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
        messages={messages.notifications}
        onDismiss={onNotificationDismiss}
      />
    </main>
  );
}
