// App Shell - Sidebar.
import {
  Album,
  Bell,
  LayoutDashboard,
  FolderKanban,
  LogOut,
  Moon,
  Settings,
  Sun,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/button";
import type { DashboardView } from "@/features/dashboard/types";
import type { AppShellMessages } from "@/messages/app-messages";

export type SidebarPinnedProject = {
  id: string;
  title: string;
  sidebarPinOrder: number | null;
};

export function Sidebar({
  open,
  darkMode,
  activeView,
  selectedProjectId,
  pinnedProjects,
  messages,
  logoutPending,
  onClose,
  onViewChange,
  onProjectShortcut,
  onThemeChange,
  onLogout,
}: {
  open: boolean;
  darkMode: boolean;
  activeView: DashboardView;
  selectedProjectId: string | null;
  pinnedProjects: SidebarPinnedProject[];
  messages: AppShellMessages;
  logoutPending: boolean;
  onClose: () => void;
  onViewChange: (view: DashboardView) => void;
  onProjectShortcut: (projectId: string) => void;
  onThemeChange: (darkMode: boolean) => void;
  onLogout: () => void;
}) {
  function selectView(view: DashboardView) {
    onViewChange(view);
    onClose();
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-40 transition lg:hidden ${
          open ? "pointer-events-auto" : "pointer-events-none"
        }`}
        aria-hidden={!open}
      >
        <button
          className={`absolute inset-0 bg-black/60 transition-opacity ${
            open ? "opacity-100" : "opacity-0"
          }`}
          type="button"
          aria-label={messages.closeNavigationOverlay}
          onClick={onClose}
        />
        <SidebarFrame
          darkMode={darkMode}
          open={open}
          logoutPending={logoutPending}
          activeView={activeView}
          selectedProjectId={selectedProjectId}
          pinnedProjects={pinnedProjects}
          messages={messages}
          mobile
          onClose={onClose}
          onSelectView={selectView}
          onProjectShortcut={onProjectShortcut}
          onThemeChange={onThemeChange}
          onLogout={onLogout}
        />
      </div>

      <SidebarFrame
        darkMode={darkMode}
        open
        logoutPending={logoutPending}
        activeView={activeView}
        selectedProjectId={selectedProjectId}
        pinnedProjects={pinnedProjects}
        messages={messages}
        onClose={onClose}
        onSelectView={selectView}
        onProjectShortcut={onProjectShortcut}
        onThemeChange={onThemeChange}
        onLogout={onLogout}
      />
    </>
  );
}

function SidebarFrame({
  darkMode,
  open,
  logoutPending,
  activeView,
  selectedProjectId,
  pinnedProjects,
  messages,
  mobile = false,
  onClose,
  onSelectView,
  onProjectShortcut,
  onThemeChange,
  onLogout,
}: {
  darkMode: boolean;
  open: boolean;
  logoutPending: boolean;
  activeView: DashboardView;
  selectedProjectId: string | null;
  pinnedProjects: SidebarPinnedProject[];
  messages: AppShellMessages;
  mobile?: boolean;
  onClose: () => void;
  onSelectView: (view: DashboardView) => void;
  onProjectShortcut: (projectId: string) => void;
  onThemeChange: (darkMode: boolean) => void;
  onLogout: () => void;
}) {
  return (
    <aside
      className={`${
        mobile
          ? `absolute left-0 top-0 h-full w-[300px] max-w-[86vw] shadow-xl transition-transform ${
              open ? "translate-x-0" : "-translate-x-full"
            }`
          : "hidden h-screen w-[300px] shrink-0 lg:sticky lg:top-0 lg:flex"
      } flex-col overflow-y-auto overscroll-contain border-r p-4 ${
        darkMode
          ? "border-neutral-800 bg-black text-white"
          : "border-slate-200 bg-white text-slate-950"
      }`}
    >
      {mobile ? (
        <div className="flex justify-end">
          <Button
            darkMode={darkMode}
            size="icon-sm"
            aria-label={messages.closeNavigation}
            icon={<X size={18} aria-hidden="true" />}
            onClick={onClose}
          />
        </div>
      ) : null}

      <nav className={`${mobile ? "mt-4" : ""} grid overflow-hidden rounded-md`}>
        <SidebarItem
          icon={<LayoutDashboard size={18} aria-hidden="true" />}
          label={messages.pages.dashboard}
          active={activeView === "dashboard"}
          darkMode={darkMode}
          onClick={() => onSelectView("dashboard")}
        />
        <SidebarItem
          icon={<FolderKanban size={18} aria-hidden="true" />}
          label={messages.pages.projects}
          active={activeView === "projects" && selectedProjectId === null}
          darkMode={darkMode}
          onClick={() => onSelectView("projects")}
        />
        {pinnedProjects.map((project) => (
          <SidebarItem
            key={project.id}
            icon={null}
            label={project.title}
            active={activeView === "projects" && selectedProjectId === project.id}
            darkMode={darkMode}
            child
            onClick={() => {
              onProjectShortcut(project.id);
              onClose();
            }}
          />
        ))}
        <SidebarItem
          icon={<Bell size={18} aria-hidden="true" />}
          label={messages.pages.routines}
          active={activeView === "routines"}
          darkMode={darkMode}
          onClick={() => onSelectView("routines")}
        />
        <SidebarItem
          icon={<Album size={18} aria-hidden="true" />}
          label={messages.pages.memories}
          active={activeView === "memories"}
          darkMode={darkMode}
          onClick={() => onSelectView("memories")}
        />
        <SidebarItem
          icon={<Settings size={18} aria-hidden="true" />}
          label={messages.pages.settings}
          active={activeView === "settings"}
          darkMode={darkMode}
          onClick={() => onSelectView("settings")}
        />
      </nav>

      <div
        className={`mt-auto border-t pt-4 ${
          darkMode ? "border-neutral-800" : "border-slate-200"
        }`}
      >
        <div className="grid overflow-hidden rounded-md">
          <SidebarItem
            icon={
              darkMode ? (
                <Moon size={18} aria-hidden="true" />
              ) : (
                <Sun size={18} aria-hidden="true" />
              )
            }
            label={
              darkMode ? messages.sidebar.darkMode : messages.sidebar.lightMode
            }
            darkMode={darkMode}
            onClick={() => onThemeChange(!darkMode)}
          />
          <SidebarItem
            icon={<LogOut size={18} aria-hidden="true" />}
            label={
              logoutPending ? messages.sidebar.signingOut : messages.sidebar.signOut
            }
            darkMode={darkMode}
            disabled={logoutPending}
            onClick={onLogout}
          />
        </div>
      </div>
    </aside>
  );
}

function SidebarItem({
  icon,
  label,
  active = false,
  darkMode,
  disabled = false,
  child = false,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  active?: boolean;
  darkMode: boolean;
  disabled?: boolean;
  child?: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      darkMode={darkMode}
      tone={active ? "primary" : "ghost"}
      size="md"
      className="w-full justify-start overflow-hidden !rounded-none"
      disabled={disabled}
      icon={icon}
      onClick={onClick}
    >
      <span className={`min-w-0 truncate ${child ? "pl-7" : ""}`}>
        {label}
      </span>
    </Button>
  );
}
