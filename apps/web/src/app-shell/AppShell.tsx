"use client";

// App Shell.
import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/button";
import {
  secondaryButtonBorderColorClass,
  secondaryTextColorClass,
} from "@/components/color";
import {
  NotificationStack,
  type NotificationItem,
} from "@/components/notification";
import { appShellClass } from "@/components/theme";
import { cx } from "@/components/utils";
import type { DatabaseVersionStatus } from "@/components/app-metadata";
import type { ThemePreference } from "@/app-shell/app-preferences";
import type { AppMessages } from "@/messages/app-messages";
import type {
  LanguagePreference,
  SupportedLanguage,
} from "@/messages/languages";
import type {
  TimeFormatPreference,
  UserPreferences,
} from "@/features/settings/preferences";
import { Dashboard } from "@/features/dashboard/components/Dashboard";
import { DesignPage } from "@/features/design/components/DesignPage";
import { EventsPage } from "@/features/events/components/EventsPage";
import { useDashboardEvents } from "@/features/events/hooks/useDashboardEvents";
import { useDashboardMemories } from "@/features/dashboard/hooks/useDashboardMemories";
import { useDashboardProjects } from "@/features/dashboard/hooks/useDashboardProjects";
import { useDashboardRoutines } from "@/features/dashboard/hooks/useDashboardRoutines";
import type { DashboardView } from "@/features/dashboard/types";
import type { AuthUser } from "@/features/auth/server/auth-service";
import { IdeasPage } from "@/features/ideas/components/IdeasPage";
import { useIdeasPageData } from "@/features/ideas/hooks/useIdeasPageData";
import { MemoriesPage } from "@/features/memories/components/MemoriesPage";
import type { ProjectInput } from "@/features/projects/actions";
import { ProjectPageTitle } from "@/features/projects/components/ProjectPageTitle";
import { ProjectsPage } from "@/features/projects/components/ProjectsPage";
import { RoutinesPage } from "@/features/routines/components/RoutinesPage";
import { SettingsPage } from "@/features/settings/components/SettingsPage";
import {
  appPathForProject,
  appPathForView,
  appRouteFromPathname,
  browserPathname,
} from "./app-routes";
import {
  readStoredDeveloperModeEnabled,
  writeStoredDeveloperModeEnabled,
} from "./developer-mode";
import { Sidebar } from "./Sidebar";

export function AppShell({
  currentUser,
  darkMode,
  languagePreference,
  messages,
  onLanguagePreferenceChange,
  onLocalLanguagePreferenceChange,
  onLocalThemePreferenceChange,
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
  showInfoNotification,
  showSuccessNotification,
}: {
  currentUser: AuthUser;
  darkMode: boolean;
  languagePreference: LanguagePreference;
  messages: AppMessages;
  onLanguagePreferenceChange: (preference: LanguagePreference) => void;
  onLocalLanguagePreferenceChange: (preference: LanguagePreference) => void;
  onLocalThemePreferenceChange: (preference: ThemePreference) => void;
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
  showInfoNotification: (message: string, title?: string) => void;
  showSuccessNotification: (message: string, title?: string) => void;
}) {
  const initialPathname = usePathname();
  const [currentPathname, setCurrentPathname] = useState(
    () => browserPathname() ?? initialPathname,
  );
  const pathnameRoute = appRouteFromPathname(currentPathname);
  const activeView = pathnameRoute.view;
  const [developerModeEnabled, setDeveloperModeEnabled] = useState(
    readStoredDeveloperModeEnabled,
  );
  const showDesignPage = currentUser.isAdmin && developerModeEnabled;
  const activeWorkspaceView =
    activeView === "design" && !showDesignPage ? "settings" : activeView;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const selectedProjectId = pathnameRoute.projectId;
  const [selectedProjectMilestone, setSelectedProjectMilestone] = useState<{
    projectId: string | null;
    milestoneId: string | null;
  }>({ projectId: null, milestoneId: null });
  const selectedProjectMilestoneId =
    selectedProjectMilestone.projectId === selectedProjectId
      ? selectedProjectMilestone.milestoneId
      : null;
  const [projectDraft, setProjectDraft] = useState<ProjectInput | null>(null);
  const projectState = useDashboardProjects(
    currentUser.id,
    showErrorNotification,
    showInfoNotification,
    messages.dashboard.notifications,
    messages.projects.results,
    messages.projects.editor.template,
    messages.notifications,
  );
  const routineState = useDashboardRoutines(
    currentUser.id,
    showErrorNotification,
    showInfoNotification,
    messages.dashboard.notifications,
    messages.routines.results,
    messages.routines.editor.template,
    messages.notifications,
  );
  const eventState = useDashboardEvents(
    currentUser.id,
    showErrorNotification,
    showInfoNotification,
    messages.dashboard.notifications,
    messages.events.results,
    messages.events.editor.template,
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
  const { refreshEventData } = eventState;
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
  const selectedProject = selectedProjectId
    ? projectState.projects.find((project) => project.id === selectedProjectId) ??
      null
    : null;
  const hasUnassignedProjectTasks =
    selectedProject?.tasks.some((task) => !task.milestoneId) ?? false;
  const activeProjectMilestoneId =
    selectedProjectMilestoneId === ""
      ? hasUnassignedProjectTasks
        ? ""
        : null
      : selectedProject?.milestones.some(
            (milestone) => milestone.id === selectedProjectMilestoneId,
          )
        ? selectedProjectMilestoneId
        : null;
  const activeProjectMilestone = activeProjectMilestoneId
    ? selectedProject?.milestones.find(
        (milestone) => milestone.id === activeProjectMilestoneId,
      ) ?? null
    : null;
  const projectTitleMilestoneTitle = activeProjectMilestoneId
    ? activeProjectMilestone
      ? activeProjectMilestone.title
      : null
    : selectedProjectMilestoneId === "" && hasUnassignedProjectTasks
      ? messages.projects.detail.noMilestoneTitle
      : null;

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
    if (activeView !== "design" || showDesignPage) {
      return;
    }

    const settingsPath = appPathForView("settings");
    const timeoutId = window.setTimeout(() => {
      window.history.replaceState(
        { arcticAriaPath: settingsPath },
        "",
        settingsPath,
      );
      setCurrentPathname(settingsPath);
      setSidebarOpen(false);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [activeView, showDesignPage]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void refreshProjectData();
      void refreshEventData();
      void refreshMemoryData();
      void refreshRoutineData();
      void refreshIdeaData();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [
    currentUser.id,
    refreshEventData,
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
    setSelectedProjectMilestone({ projectId: null, milestoneId: null });
    navigateToRoute(appPathForView("projects"));
  }

  function showProjectDetail(projectId: string) {
    setSelectedProjectMilestone({ projectId, milestoneId: null });
    navigateToRoute(appPathForProject(projectId));
  }

  function showProjectMilestoneDetail(milestoneId: string | null) {
    setSelectedProjectMilestone({
      projectId: selectedProjectId,
      milestoneId,
    });
  }

  function handleViewChange(view: DashboardView) {
    if (view === "projects") {
      showProjectsList();
      return;
    }

    navigateToRoute(appPathForView(view));
  }

  function handleDeveloperModeChange(enabled: boolean) {
    setDeveloperModeEnabled(enabled);
    writeStoredDeveloperModeEnabled(enabled);
  }

  const pageTitle = pageTitleForView(
    activeWorkspaceView,
    messages.appShell.pages,
  );
  const pageDescription = pageDescriptionForView(
    activeWorkspaceView,
    messages.appShell.pageDescriptions,
  );

  return (
    <main className={`min-h-screen transition-colors ${appShellClass(darkMode)}`}>
      <div className="mx-auto w-full xl:flex xl:max-w-[1500px] xl:items-start">
        <Sidebar
          open={sidebarOpen}
          darkMode={darkMode}
          activeView={activeWorkspaceView}
          selectedProjectId={selectedProjectId}
          pinnedProjects={pinnedProjects}
          showDesignPage={showDesignPage}
          messages={messages.appShell}
          onClose={() => setSidebarOpen(false)}
          onViewChange={handleViewChange}
          onProjectShortcut={showProjectDetail}
        />

        <div className="mx-auto flex min-h-[100dvh] min-w-0 flex-1 flex-col gap-4 px-4 pb-12 pt-4 sm:px-6 sm:pb-16 lg:min-h-[110vh] lg:max-w-[1200px] lg:px-8 lg:pb-20">
          <header
            className={`aa-workspace-header grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 border-b pb-4 sm:flex sm:items-center ${secondaryButtonBorderColorClass}`}
          >
            <Button
              darkMode={darkMode}
              size="icon"
              className="h-[var(--aa-button-height-md)] w-[var(--aa-button-height-md)] xl:hidden"
              aria-label={messages.appShell.openNavigation}
              icon={<Menu size={20} aria-hidden="true" />}
              onClick={() => setSidebarOpen(true)}
            />
            {activeWorkspaceView === "projects" ? (
              <ProjectPageTitle
                darkMode={darkMode}
                projects={projectState.projects}
                selectedProjectId={selectedProjectId}
                detailLevel={
                  selectedProjectId && activeProjectMilestoneId !== null
                    ? "milestone"
                    : "project"
                }
                milestoneTitle={projectTitleMilestoneTitle}
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
              <div className="col-start-2 flex min-w-0 flex-1 items-start justify-between gap-3">
                <div className="grid min-w-0 gap-1">
                  <h1 className="min-w-0 truncate text-2xl font-semibold tracking-normal sm:text-3xl">
                    {pageTitle}
                  </h1>
                  {pageDescription ? (
                    <p
                      className={cx(
                        "min-w-0 truncate text-sm",
                        secondaryTextColorClass,
                      )}
                      title={pageDescription}
                    >
                      {pageDescription}
                    </p>
                  ) : null}
                </div>
              </div>
            )}
          </header>

          {activeWorkspaceView === "projects" ? (
            <ProjectsPage
              darkMode={darkMode}
              projects={projectState.projects}
              loading={projectState.projectLoading}
              pending={projectState.projectActionPending}
              projectDraft={projectDraft}
              setProjectDraft={setProjectDraft}
              selectedProjectId={selectedProjectId}
              selectedMilestoneId={activeProjectMilestoneId}
              pendingProjectPinIds={projectState.pendingProjectPinIds}
              onProjectSave={projectState.saveProjectFromPage}
              onProjectDelete={projectState.archiveProjectFromPage}
              onProjectTemplateParse={projectState.parseProjectTreeTemplateFromPage}
              onProjectTemplateApply={projectState.applyProjectTreeTemplateFromPage}
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
              onMilestoneSelect={showProjectMilestoneDetail}
              messages={messages.projects}
              formMessages={messages.forms}
              showErrorNotification={showErrorNotification}
              showSuccessNotification={showSuccessNotification}
            />
          ) : activeWorkspaceView === "routines" ? (
            <RoutinesPage
              darkMode={darkMode}
              routines={routineState.routineDefinitions}
              routineInstances={routineState.routineInstances}
              routineGroups={routineState.routineGroups}
              loading={routineState.routineLoading}
              pending={routineState.routineActionPending}
              onRoutineSave={routineState.saveRoutineFromPage}
              onRoutineDelete={routineState.deleteRoutineFromPage}
              onRoutineInstanceStatus={routineState.updateRoutineInstanceFromPage}
              onRoutineTemplateParse={routineState.parseRoutineTemplateFromPage}
              onRoutineTemplateApply={routineState.applyRoutineTemplateFromPage}
              onRoutineGroupSave={routineState.saveRoutineGroupFromPage}
              onRoutineGroupDelete={routineState.deleteRoutineGroupFromPage}
              messages={messages.routines}
              formMessages={messages.forms}
              timeFormatPreference={timeFormatPreference}
              multipleTimezonesEnabled={false}
              resolvedTimeZone={resolvedTimeZone}
              showErrorNotification={showErrorNotification}
              showSuccessNotification={showSuccessNotification}
            />
          ) : activeWorkspaceView === "events" ? (
            <EventsPage
              darkMode={darkMode}
              events={eventState.events}
              eventInstances={eventState.eventInstances}
              eventGroups={eventState.eventGroups}
              loading={eventState.eventLoading}
              pending={eventState.eventActionPending}
              onEventSave={eventState.saveEventFromPage}
              onEventDelete={eventState.deleteEventFromPage}
              onEventGroupSave={eventState.saveEventGroupFromPage}
              onEventGroupDelete={eventState.deleteEventGroupFromPage}
              onEventInstanceSave={eventState.saveEventInstanceFromPage}
              onEventInstanceCancel={eventState.cancelEventInstanceFromPage}
              onEventTemplateParse={eventState.parseEventTemplateFromPage}
              onEventTemplateApply={eventState.applyEventTemplateFromPage}
              messages={messages.events}
              formMessages={messages.forms}
              timeFormatPreference={timeFormatPreference}
              resolvedTimeZone={resolvedTimeZone}
              showErrorNotification={showErrorNotification}
              showSuccessNotification={showSuccessNotification}
            />
          ) : activeWorkspaceView === "ideas" ? (
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
          ) : activeWorkspaceView === "memories" ? (
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
          ) : activeWorkspaceView === "settings" ? (
            <SettingsPage
              currentUserDisplayName={currentUser.displayName}
              currentUserId={currentUser.id}
              currentUserIsAdmin={currentUser.isAdmin}
              currentUsername={currentUser.username}
              darkMode={darkMode}
              developerModeEnabled={developerModeEnabled}
              languagePreference={languagePreference}
              logoutPending={logoutPending}
              messages={messages.settings}
              notificationMessages={messages.notifications}
              themePreference={themePreference}
              versionMessages={messages.versionStatus}
              versionStatus={versionStatus}
              onDeveloperModeChange={handleDeveloperModeChange}
              onLanguagePreferenceChange={onLanguagePreferenceChange}
              onPreferenceOpenAttempt={onPreferenceOpenAttempt}
              onThemePreferenceChange={onThemePreferenceChange}
              onTimeFormatPreferenceChange={onTimeFormatPreferenceChange}
              onLogout={onLogout}
              showErrorNotification={showErrorNotification}
              showSuccessNotification={showSuccessNotification}
              timeFormatPreference={timeFormatPreference}
            />
          ) : activeWorkspaceView === "design" ? (
            <DesignPage
              darkMode={darkMode}
              languagePreference={languagePreference}
              resolvedLanguage={resolvedLanguage}
              themePreference={themePreference}
              onLanguagePreferenceChange={onLocalLanguagePreferenceChange}
              onThemePreferenceChange={onLocalThemePreferenceChange}
            />
          ) : (
            <Dashboard
              darkMode={darkMode}
              tasks={projectState.tasks}
              taskLoading={projectState.projectLoading}
              routines={routineState.routines}
              routineLoading={routineState.routineLoading}
              events={eventState.todayEvents}
              eventLoading={eventState.eventLoading}
              pinnedMemories={memoryState.pinnedMemories}
              memoryLoading={memoryState.memoryLoading}
              onTaskStatus={projectState.updateTaskFromDashboard}
              onRoutineStatus={routineState.updateRoutine}
              onMemoryDone={memoryState.markMemoryDone}
              onMemoryCancelDone={memoryState.cancelMemoryDone}
              onTaskOpen={showProjectDetail}
              onEventOpen={() => {
                handleViewChange("events");
              }}
              messages={messages.dashboard}
              formMessages={messages.forms}
              timeFormatPreference={timeFormatPreference}
              resolvedTimeZone={resolvedTimeZone}
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

function pageTitleForView(
  view: DashboardView,
  pages: AppMessages["appShell"]["pages"],
) {
  return pages[view];
}

function pageDescriptionForView(
  view: DashboardView,
  descriptions: AppMessages["appShell"]["pageDescriptions"],
) {
  if (view === "projects") {
    return null;
  }

  return descriptions[view];
}
