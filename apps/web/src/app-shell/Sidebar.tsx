// App Shell - Sidebar.
import {
  Album,
  Bell,
  CalendarDays,
  LayoutDashboard,
  Lightbulb,
  FolderKanban,
  Settings,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { ArcticAriaLogo } from "@/components/arctic-aria-logo";
import { Button } from "@/components/button";
import { ScrollArea } from "@/components/scroll-area";
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
  onClose,
  onViewChange,
  onProjectShortcut,
}: {
  open: boolean;
  darkMode: boolean;
  activeView: DashboardView;
  selectedProjectId: string | null;
  pinnedProjects: SidebarPinnedProject[];
  messages: AppShellMessages;
  onClose: () => void;
  onViewChange: (view: DashboardView) => void;
  onProjectShortcut: (projectId: string) => void;
}) {
  function selectView(view: DashboardView) {
    onViewChange(view);
    onClose();
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-transparent xl:hidden ${
          open ? "visible pointer-events-auto" : "invisible pointer-events-none"
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
          activeView={activeView}
          selectedProjectId={selectedProjectId}
          pinnedProjects={pinnedProjects}
          messages={messages}
          mobile
          onClose={onClose}
          onSelectView={selectView}
          onProjectShortcut={onProjectShortcut}
        />
      </div>

      <SidebarFrame
        darkMode={darkMode}
        open
        activeView={activeView}
        selectedProjectId={selectedProjectId}
        pinnedProjects={pinnedProjects}
        messages={messages}
        onClose={onClose}
        onSelectView={selectView}
        onProjectShortcut={onProjectShortcut}
      />
    </>
  );
}

function SidebarFrame({
  darkMode,
  open,
  activeView,
  selectedProjectId,
  pinnedProjects,
  messages,
  mobile = false,
  onClose,
  onSelectView,
  onProjectShortcut,
}: {
  darkMode: boolean;
  open: boolean;
  activeView: DashboardView;
  selectedProjectId: string | null;
  pinnedProjects: SidebarPinnedProject[];
  messages: AppShellMessages;
  mobile?: boolean;
  onClose: () => void;
  onSelectView: (view: DashboardView) => void;
  onProjectShortcut: (projectId: string) => void;
}) {
  return (
    <aside
      className={`${
        mobile
          ? `absolute left-0 top-0 flex h-full w-[300px] max-w-[86vw] shadow-xl transition-transform ${
              open ? "translate-x-0" : "-translate-x-full"
            }`
          : "hidden h-screen w-[300px] shrink-0 xl:sticky xl:top-0 xl:flex"
      } relative flex-col border-r border-[var(--aa-secondary-button-border)] bg-[var(--aa-panel-header-bg)] text-[var(--aa-primary-text)]`}
    >
      <ScrollArea
        className="relative flex-1"
        refreshKey={`${open}-${pinnedProjects.length}-${messages.workspace}`}
        scrollbar="auto-hide"
        viewportClassName="h-full overscroll-contain p-4"
      >
        <div className="flex items-start justify-between gap-3 px-4">
          <ArcticAriaLogo
            brandText={messages.brandName}
            variant="sidebar"
            workspaceLabel={messages.workspace}
          />
          {mobile ? (
            <Button
              darkMode={darkMode}
              tone="ghost"
              size="icon"
              className="-mr-4 border-0 shadow-none"
              aria-label={messages.closeNavigation}
              icon={<X size={18} aria-hidden="true" />}
              onClick={onClose}
            />
          ) : null}
        </div>

        <nav className="mt-4 grid">
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
              active={
                activeView === "projects" && selectedProjectId === project.id
              }
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
            icon={<CalendarDays size={18} aria-hidden="true" />}
            label={messages.pages.events}
            active={activeView === "events"}
            darkMode={darkMode}
            onClick={() => onSelectView("events")}
          />
          <SidebarItem
            icon={<Album size={18} aria-hidden="true" />}
            label={messages.pages.memories}
            active={activeView === "memories"}
            darkMode={darkMode}
            onClick={() => onSelectView("memories")}
          />
          <SidebarItem
            icon={<Lightbulb size={18} aria-hidden="true" />}
            label={messages.pages.ideas}
            active={activeView === "ideas"}
            darkMode={darkMode}
            onClick={() => onSelectView("ideas")}
          />
          <SidebarItem
            icon={<Settings size={18} aria-hidden="true" />}
            label={messages.pages.settings}
            active={activeView === "settings"}
            darkMode={darkMode}
            onClick={() => onSelectView("settings")}
          />
        </nav>
      </ScrollArea>
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
  label: ReactNode;
  active?: boolean;
  darkMode: boolean;
  disabled?: boolean;
  child?: boolean;
  onClick: () => void;
}) {
  const itemIcon = child ? (
    <span className="h-[18px] w-[18px] shrink-0 opacity-0" aria-hidden="true" />
  ) : (
    icon
  );

  return (
    <Button
      darkMode={darkMode}
      tone="ghost"
      active={active}
      size="md-lg"
      className="w-full min-w-0 justify-start overflow-hidden rounded-none text-left"
      disabled={disabled}
      icon={itemIcon}
      onClick={onClick}
    >
      <span
        className={`min-w-0 flex-1 truncate text-left ${child ? "pl-4" : ""}`}
        title={typeof label === "string" ? label : undefined}
      >
        {label}
      </span>
    </Button>
  );
}
