// App Shell - Sidebar.
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Album,
  Bell,
  LayoutDashboard,
  Lightbulb,
  FolderKanban,
  LogOut,
  Moon,
  Settings,
  Sun,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { ArcticAriaLogo } from "@/components/arctic-aria-logo";
import { Button } from "@/components/button";
import type { DashboardView } from "@/features/dashboard/types";
import type { AppShellMessages } from "@/messages/app-messages";

type SidebarScrollbarState = {
  canScroll: boolean;
  visible: boolean;
  thumbHeight: number;
  thumbTop: number;
};

const hiddenScrollbarState: SidebarScrollbarState = {
  canScroll: false,
  visible: false,
  thumbHeight: 0,
  thumbTop: 0,
};

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
        className={`fixed inset-0 z-40 bg-transparent transition-opacity duration-200 lg:hidden ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
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
  const sidebarRef = useRef<HTMLDivElement | null>(null);
  const scrollHideTimer = useRef<number | null>(null);
  const [scrollbarState, setScrollbarState] = useState<SidebarScrollbarState>(
    hiddenScrollbarState,
  );

  const updateScrollbarState = useCallback((visible: boolean) => {
    const sidebar = sidebarRef.current;

    if (!sidebar || sidebar.clientHeight <= 0) {
      setScrollbarState(hiddenScrollbarState);
      return;
    }

    const canScroll = sidebar.scrollHeight > sidebar.clientHeight + 1;

    if (!canScroll) {
      setScrollbarState(hiddenScrollbarState);
      return;
    }

    const trackPadding = 8;
    const trackHeight = Math.max(0, sidebar.clientHeight - trackPadding * 2);
    const thumbHeight = Math.max(
      32,
      Math.round((sidebar.clientHeight / sidebar.scrollHeight) * trackHeight),
    );
    const maxScrollTop = sidebar.scrollHeight - sidebar.clientHeight;
    const maxThumbTop = Math.max(0, trackHeight - thumbHeight);
    const thumbTop =
      trackPadding +
      (maxScrollTop > 0 ? (sidebar.scrollTop / maxScrollTop) * maxThumbTop : 0);

    setScrollbarState({
      canScroll: true,
      visible,
      thumbHeight,
      thumbTop,
    });
  }, []);

  useEffect(() => {
    updateScrollbarState(false);

    function handleResize() {
      updateScrollbarState(false);
    }

    window.addEventListener("resize", handleResize);

    return () => {
      if (scrollHideTimer.current !== null) {
        window.clearTimeout(scrollHideTimer.current);
      }

      window.removeEventListener("resize", handleResize);
    };
  }, [open, pinnedProjects.length, updateScrollbarState]);

  function handleScroll() {
    updateScrollbarState(true);

    if (scrollHideTimer.current !== null) {
      window.clearTimeout(scrollHideTimer.current);
    }

    scrollHideTimer.current = window.setTimeout(() => {
      updateScrollbarState(false);
    }, 900);
  }

  return (
    <aside
      className={`${
        mobile
          ? `absolute left-0 top-0 flex h-full w-[300px] max-w-[86vw] shadow-xl transition-transform ${
              open ? "translate-x-0" : "-translate-x-full"
            }`
          : "hidden h-screen w-[300px] shrink-0 lg:sticky lg:top-0 lg:flex"
      } relative flex-col border-r ${
        darkMode
          ? "border-neutral-800 bg-black text-white"
          : "border-slate-200 bg-white text-slate-950"
      }`}
    >
      <div
        ref={sidebarRef}
        className="sidebar-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain p-4"
        onScroll={handleScroll}
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
              size="icon-sm"
              className="border-0 shadow-none"
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
          <div
            className={`my-2 border-t ${
              darkMode ? "border-neutral-800" : "border-slate-200"
            }`}
            aria-hidden="true"
          />
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
              logoutPending
                ? messages.sidebar.signingOut
                : messages.sidebar.signOut
            }
            darkMode={darkMode}
            disabled={logoutPending}
            onClick={onLogout}
          />
        </nav>
      </div>

      {scrollbarState.canScroll ? (
        <span
          className={`pointer-events-none absolute right-1 top-0 block w-0.5 rounded-full transition-opacity duration-200 ${
            scrollbarState.visible ? "opacity-100" : "opacity-0"
          } ${darkMode ? "bg-neutral-500/70" : "bg-slate-400/70"}`}
          style={{
            height: scrollbarState.thumbHeight,
            transform: `translateY(${scrollbarState.thumbTop}px)`,
          }}
          aria-hidden="true"
        />
      ) : null}
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
  const itemIcon = child ? (
    <span className="h-[18px] w-[18px] shrink-0 opacity-0" aria-hidden="true" />
  ) : (
    icon
  );

  return (
    <Button
      darkMode={darkMode}
      tone={active ? "primary" : "ghost"}
      size="md"
      className="w-full min-w-0 justify-start overflow-hidden rounded-none text-left first:rounded-t-md last:rounded-b-md"
      disabled={disabled}
      icon={itemIcon}
      onClick={onClick}
    >
      <span
        className={`min-w-0 flex-1 truncate text-left ${child ? "pl-4" : ""}`}
        title={label}
      >
        {label}
      </span>
    </Button>
  );
}
