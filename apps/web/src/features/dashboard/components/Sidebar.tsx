import {
  Bell,
  ClipboardList,
  LayoutDashboard,
  FolderKanban,
  LogOut,
  Moon,
  Settings,
  Sparkles,
  Sun,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import type { DashboardView } from "../types";

export function Sidebar({
  open,
  darkMode,
  activeView,
  logoutPending,
  onClose,
  onViewChange,
  onThemeChange,
  onLogout,
  onUnavailableFeature,
}: {
  open: boolean;
  darkMode: boolean;
  activeView: DashboardView;
  logoutPending: boolean;
  onClose: () => void;
  onViewChange: (view: DashboardView) => void;
  onThemeChange: (darkMode: boolean) => void;
  onLogout: () => void;
  onUnavailableFeature: (featureName: string) => void;
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
          aria-label="Close navigation overlay"
          onClick={onClose}
        />
        <SidebarFrame
          darkMode={darkMode}
          open={open}
          logoutPending={logoutPending}
          activeView={activeView}
          mobile
          onClose={onClose}
          onSelectView={selectView}
          onThemeChange={onThemeChange}
          onLogout={onLogout}
          onUnavailableFeature={onUnavailableFeature}
        />
      </div>

      <SidebarFrame
        darkMode={darkMode}
        open
        logoutPending={logoutPending}
        activeView={activeView}
        onClose={onClose}
        onSelectView={selectView}
        onThemeChange={onThemeChange}
        onLogout={onLogout}
        onUnavailableFeature={onUnavailableFeature}
      />
    </>
  );
}

function SidebarFrame({
  darkMode,
  open,
  logoutPending,
  activeView,
  mobile = false,
  onClose,
  onSelectView,
  onThemeChange,
  onLogout,
  onUnavailableFeature,
}: {
  darkMode: boolean;
  open: boolean;
  logoutPending: boolean;
  activeView: DashboardView;
  mobile?: boolean;
  onClose: () => void;
  onSelectView: (view: DashboardView) => void;
  onThemeChange: (darkMode: boolean) => void;
  onLogout: () => void;
  onUnavailableFeature: (featureName: string) => void;
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
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Sparkles size={22} aria-hidden="true" />
          <h2 className="truncate text-2xl font-semibold tracking-normal">
            Arctic Aria
          </h2>
        </div>
        {mobile ? (
          <Button
            darkMode={darkMode}
            size="icon-sm"
            aria-label="Close navigation"
            icon={<X size={18} aria-hidden="true" />}
            onClick={onClose}
          />
        ) : null}
      </div>

      <nav className="mt-6 grid gap-2">
        <SidebarItem
          icon={<LayoutDashboard size={18} aria-hidden="true" />}
          label="Dashboard"
          active={activeView === "dashboard"}
          darkMode={darkMode}
          onClick={() => onSelectView("dashboard")}
        />
        <SidebarItem
          icon={<FolderKanban size={18} aria-hidden="true" />}
          label="Projects"
          active={activeView === "projects"}
          darkMode={darkMode}
          onClick={() => onSelectView("projects")}
        />
        <SidebarItem
          icon={<Bell size={18} aria-hidden="true" />}
          label="Routines"
          active={activeView === "routines"}
          darkMode={darkMode}
          onClick={() => onSelectView("routines")}
        />
        <SidebarItem
          icon={<ClipboardList size={18} aria-hidden="true" />}
          label="Memories"
          active={activeView === "memories"}
          darkMode={darkMode}
          onClick={() => onSelectView("memories")}
        />
        <SidebarItem
          icon={<Settings size={18} aria-hidden="true" />}
          label="Settings"
          darkMode={darkMode}
          onClick={() => onUnavailableFeature("Settings")}
        />
      </nav>

      <div
        className={`mt-auto grid gap-3 border-t pt-4 ${
          darkMode ? "border-neutral-800" : "border-slate-200"
        }`}
      >
        <SidebarItem
          icon={
            darkMode ? (
              <Moon size={18} aria-hidden="true" />
            ) : (
              <Sun size={18} aria-hidden="true" />
            )
          }
          label={darkMode ? "Dark mode" : "Light mode"}
          darkMode={darkMode}
          onClick={() => onThemeChange(!darkMode)}
        />
        <SidebarItem
          icon={<LogOut size={18} aria-hidden="true" />}
          label={logoutPending ? "Signing out..." : "Sign out"}
          darkMode={darkMode}
          disabled={logoutPending}
          onClick={onLogout}
        />
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
  onClick,
}: {
  icon: ReactNode;
  label: string;
  active?: boolean;
  darkMode: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      darkMode={darkMode}
      tone={active ? "primary" : "ghost"}
      size="md"
      className="w-full justify-start"
      disabled={disabled}
      icon={icon}
      onClick={onClick}
    >
      {label}
    </Button>
  );
}
