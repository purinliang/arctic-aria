"use client";

// App Shell.
import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/button";
import { secondaryButtonBorderColorClass } from "@/components/color";
import {
  NotificationStack,
  type NotificationItem,
} from "@/components/notification";
import { appShellClass } from "@/components/theme";
import type { DatabaseVersionStatus } from "@/components/app-metadata";
import type { ThemePreference } from "@/app-shell/app-preferences";
import type { AppMessages } from "@/messages/app-messages";
import type { LanguagePreference, SupportedLanguage } from "@/messages/languages";
import { refreshAfterDeveloperImport } from "@/features/developer/import-refresh";
import type { DeveloperImportTarget } from "@/features/developer/import-template-prompts";
import type {
  TimeFormatPreference,
  UserPreferences,
} from "@/features/settings/preferences";
import { Dashboard } from "@/features/dashboard/components/Dashboard";
import { useDashboardMemories } from "@/features/dashboard/hooks/useDashboardMemories";
import { useDashboardProjects } from "@/features/dashboard/hooks/useDashboardProjects";
import { useDashboardRoutines } from "@/features/dashboard/hooks/useDashboardRoutines";
import type { DashboardView } from "@/features/dashboard/types";
import { sendTodayReviewDiscordMessage } from "@/features/dashboard/actions";
import type { AuthUser } from "@/features/auth/server/auth-service";
import { IdeasPage } from "@/features/ideas/components/IdeasPage";
import { useIdeasPageData } from "@/features/ideas/hooks/useIdeasPageData";
import { MemoriesPage } from "@/features/memories/components/MemoriesPage";
import type { ProjectInput } from "@/features/projects/actions";
import { ProjectPageTitle } from "@/features/projects/components/ProjectPageTitle";
import { ProjectsPage } from "@/features/projects/components/ProjectsPage";
import { projectToDraft } from "@/features/projects/components/project-page-helpers";
import { RoutinesPage } from "@/features/routines/components/RoutinesPage";
import { SettingsPage } from "@/features/settings/components/SettingsPage";
import { appPathForProject, appPathForView, appRouteFromPathname, browserPathname } from "./app-routes";
import { Sidebar } from "./Sidebar";

export function AppShell({
  currentUser,
  browserTimeZone,
  darkMode,
  languagePreference,
  messages,
  onLanguagePreferenceChange,
  onPreferenceOpenAttempt,
  onThemePreferenceChange,
  onTimeFormatPreferenceChange,
  resolvedLanguage,
  resolvedTimeZone,
  themePreference,
  timeFormatPreference,
  versionStatus,
  logoutPending,
  notifications,
  onLogout,
  onNotificationDismiss,
  showErrorNotification,
  showSuccessNotification,
  showTodayReviewSendAction,
}: {
  currentUser: AuthUser;
  browserTimeZone: string;
  darkMode: boolean;
  languagePreference: LanguagePreference;
  messages: AppMessages;
  onLanguagePreferenceChange: (preference: LanguagePreference) => void;
  onPreferenceOpenAttempt: (preference: keyof UserPreferences) => boolean;
  onThemePreferenceChange: (preference: ThemePreference) => void;
  onTimeFormatPreferenceChange: (preference: TimeFormatPreference) => void;
  resolvedLanguage: SupportedLanguage;
  resolvedTimeZone: string;
  themePreference: ThemePreference;
  timeFormatPreference: TimeFormatPreference;
  versionStatus: DatabaseVersionStatus;
  logoutPending: boolean;
  notifications: NotificationItem[];
  onLogout: () => void;
  onNotificationDismiss: (notificationId: number) => void;
  showErrorNotification: (message: string, title?: string) => void;
  showSuccessNotification: (message: string, title?: string) => void;
  showTodayReviewSendAction: boolean;
}) {
  const initialPathname = usePathname();
  const [currentPathname, setCurrentPathname] = useState(
    () => browserPathname() ?? initialPathname,
  );
  const pathnameRoute = appRouteFromPathname(currentPathname);
  const activeView = pathnameRoute.view;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const selectedProjectId = pathnameRoute.projectId;
  const [projectDraft, setProjectDraft] = useState<ProjectInput | null>(null);
  const [todayReviewPending, setTodayReviewPending] = useState(false);
  const projectState = useDashboardProjects(
    currentUser.id,
    showErrorNotification,
    messages.dashboard.notifications,
    messages.projects.results,
    messages.notifications,
  );
  const routineState = useDashboardRoutines(
    currentUser.id,
    showErrorNotification,
    messages.dashboard.notifications,
    messages.routines.results,
    messages.notifications,
  );
  const memoryState = useDashboardMemories(
    currentUser.id,
    showErrorNotification,
    messages.dashboard.notifications,
    messages.memories.results,
    messages.notifications,
  );
  const { refreshProjectData } = projectState;
  const { refreshMemoryData } = memoryState;
  const { refreshRoutineData } = routineState;
  const ideaState = useIdeasPageData(
    messages.ideas,
    showErrorNotification,
    messages.notifications,
  );
  const { refreshIdeaData } = ideaState;
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
    function syncBrowserPathname() {
      setCurrentPathname(browserPathname() ?? initialPathname);
    }

    window.addEventListener("popstate", syncBrowserPathname);

    return () => {
      window.removeEventListener("popstate", syncBrowserPathname);
    };
  }, [initialPathname]);

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

  function navigateToRoute(path: string) {
    setSidebarOpen(false);

    if (currentPathname !== path) {
      window.history.pushState({ arcticAriaPath: path }, "", path);
      window.scrollTo({ left: 0, top: 0 });
      setCurrentPathname(path);
    }
  }

  function showProjectsList() {
    navigateToRoute(appPathForView("projects"));
  }

  function showProjectDetail(projectId: string) {
    navigateToRoute(appPathForProject(projectId));
  }

  function handleDeveloperImportComplete(target: DeveloperImportTarget) {
    void refreshAfterDeveloperImport(target, {
      refreshProjectData,
      refreshRoutineData,
    });
  }

  function handleViewChange(view: DashboardView) {
    if (view === "projects") {
      showProjectsList();
      return;
    }

    navigateToRoute(appPathForView(view));
  }

  async function handleTodayReviewSend() {
    if (todayReviewPending) {
      return;
    }

    setTodayReviewPending(true);

    try {
      const result = await sendTodayReviewDiscordMessage();

      if (result.ok) {
        showSuccessNotification(
          messages.dashboard.review.results[result.code],
          messages.dashboard.review.notifications.sent,
        );
        return;
      }

      showErrorNotification(
        messages.dashboard.review.results[result.code] ?? result.message,
        messages.dashboard.review.notifications.failed,
      );
    } catch {
      showErrorNotification(
        messages.dashboard.review.results.today_review_delivery_failed,
        messages.dashboard.review.notifications.failed,
      );
    } finally {
      setTodayReviewPending(false);
    }
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

        <div className="mx-auto flex min-h-[100dvh] min-w-0 flex-1 flex-col gap-4 px-4 pb-12 pt-4 sm:px-6 sm:pb-16 lg:min-h-[110vh] lg:max-w-[1200px] lg:px-8 lg:pb-20">
          <header
            className={`grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 border-b pb-4 sm:flex sm:items-center ${secondaryButtonBorderColorClass}`}
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
                pinPending={
                  selectedProjectId
                    ? projectState.pendingProjectPinIds.includes(selectedProjectId)
                    : false
                }
                onBackToList={showProjectsList}
                onProjectSelect={showProjectDetail}
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
              onProjectEdit={(project) => {
                setProjectDraft(projectToDraft(project));
              }}
              onProjectPin={projectState.pinProjectFromPage}
              onProjectUnpin={projectState.unpinProjectFromPage}
              onMilestoneSave={projectState.saveMilestoneFromPage}
              onMilestoneDelete={projectState.archiveMilestoneFromPage}
              onTaskSave={projectState.saveTaskFromPage}
              onTaskDelete={projectState.archiveTaskFromPage}
              onTaskStatus={projectState.statusTaskFromPage}
              onProjectSelect={(projectId) => {
                if (projectId) {
                  showProjectDetail(projectId);
                  return;
                }

                showProjectsList();
              }}
              messages={messages.projects}
              formMessages={messages.forms}
            />
          ) : activeView === "routines" ? (
            <RoutinesPage
              darkMode={darkMode}
              routines={routineState.routineDefinitions}
              routineGroups={routineState.routineGroups}
              loading={routineState.routineLoading}
              pending={routineState.routineActionPending}
              onRoutineSave={routineState.saveRoutineFromPage}
              onRoutineDelete={routineState.deleteRoutineFromPage}
              onRoutineGroupSave={routineState.saveRoutineGroupFromPage}
              onRoutineGroupDelete={routineState.deleteRoutineGroupFromPage}
              messages={messages.routines}
              formMessages={messages.forms}
              timeFormatPreference={timeFormatPreference}
              multipleTimezonesEnabled={false}
              resolvedTimeZone={resolvedTimeZone}
            />
          ) : activeView === "ideas" ? (
            <IdeasPage
              darkMode={darkMode}
              ideas={ideaState.ideas}
              loading={ideaState.ideasLoading}
              pending={ideaState.ideaActionPending}
              messages={messages.ideas}
              dateMessages={messages.forms.datePicker}
              onIdeaSave={ideaState.saveIdeaFromPage}
              onIdeaDelete={ideaState.deleteIdeaFromPage}
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
              onMemoryPin={memoryState.pinMemoryFromPage}
              onMemoryUnpin={memoryState.unpinMemoryFromPage}
              onSuggestionPin={memoryState.pinSuggestionFromPage}
              onSuggestionCancel={memoryState.cancelSuggestionPinFromPage}
              messages={messages.memories}
              formMessages={messages.forms}
            />
          ) : activeView === "settings" ? (
            <SettingsPage
              currentUserId={currentUser.id}
              currentUserIsAdmin={currentUser.isAdmin}
              darkMode={darkMode}
              languagePreference={languagePreference}
              browserTimeZone={browserTimeZone}
              resolvedLanguage={resolvedLanguage}
              messages={messages.settings}
              notificationMessages={messages.notifications}
              themePreference={themePreference}
              versionMessages={messages.versionStatus}
              versionStatus={versionStatus}
              onDeveloperImportComplete={handleDeveloperImportComplete}
              onLanguagePreferenceChange={onLanguagePreferenceChange}
              onPreferenceOpenAttempt={onPreferenceOpenAttempt}
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
              pinnedMemories={memoryState.pinnedMemories}
              memoryLoading={memoryState.memoryLoading}
              todayReviewPending={todayReviewPending}
              showTodayReviewSendAction={showTodayReviewSendAction}
              onTaskStatus={projectState.updateTaskFromDashboard}
              onRoutineStatus={routineState.updateRoutine}
              onMemoryDone={memoryState.markMemoryDone}
              onMemoryCancelDone={memoryState.cancelMemoryDone}
              onTodayReviewSend={handleTodayReviewSend}
              onTaskOpen={showProjectDetail}
              messages={messages.dashboard}
              formMessages={messages.forms}
              timeFormatPreference={timeFormatPreference}
              onRoutineOpen={() => {
                handleViewChange("routines");
              }}
              onMemoryOpen={() => {
                handleViewChange("memories");
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
