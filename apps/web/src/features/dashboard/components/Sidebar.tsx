import {
  Bell,
  ClipboardList,
  LayoutDashboard,
  ListChecks,
  ListTodo,
  LogOut,
  Moon,
  Settings,
  Sun,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { mutedTextClass } from "@/components/ui/color";
import { Switch } from "@/components/ui/switch";
import type { AuthUser } from "@/features/auth/server/auth-service";
import type { DashboardView } from "../types";

export function Sidebar({
  open,
  darkMode,
  activeView,
  currentUser,
  logoutPending,
  onClose,
  onViewChange,
  onThemeChange,
  onLogout,
  onReviewOpen,
  onUnavailableFeature,
}: {
  open: boolean;
  darkMode: boolean;
  activeView: DashboardView;
  currentUser: AuthUser;
  logoutPending: boolean;
  onClose: () => void;
  onViewChange: (view: DashboardView) => void;
  onThemeChange: (darkMode: boolean) => void;
  onLogout: () => void;
  onReviewOpen: () => void;
  onUnavailableFeature: (featureName: string) => void;
}) {
  function selectView(view: DashboardView) {
    onViewChange(view);
    onClose();
  }

  function openReview() {
    onReviewOpen();
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
          currentUser={currentUser}
          logoutPending={logoutPending}
          activeView={activeView}
          mobile
          onClose={onClose}
          onSelectView={selectView}
          onThemeChange={onThemeChange}
          onLogout={onLogout}
          onReviewOpen={openReview}
          onUnavailableFeature={onUnavailableFeature}
        />
      </div>

      <SidebarFrame
        darkMode={darkMode}
        open
        currentUser={currentUser}
        logoutPending={logoutPending}
        activeView={activeView}
        onClose={onClose}
        onSelectView={selectView}
        onThemeChange={onThemeChange}
        onLogout={onLogout}
        onReviewOpen={openReview}
        onUnavailableFeature={onUnavailableFeature}
      />
    </>
  );
}

function SidebarFrame({
  darkMode,
  open,
  currentUser,
  logoutPending,
  activeView,
  mobile = false,
  onClose,
  onSelectView,
  onThemeChange,
  onLogout,
  onReviewOpen,
  onUnavailableFeature,
}: {
  darkMode: boolean;
  open: boolean;
  currentUser: AuthUser;
  logoutPending: boolean;
  activeView: DashboardView;
  mobile?: boolean;
  onClose: () => void;
  onSelectView: (view: DashboardView) => void;
  onThemeChange: (darkMode: boolean) => void;
  onLogout: () => void;
  onReviewOpen: () => void;
  onUnavailableFeature: (featureName: string) => void;
}) {
  return (
    <aside
      className={`${
        mobile
          ? `absolute left-0 top-0 h-full w-[300px] max-w-[86vw] shadow-xl transition-transform ${
              open ? "translate-x-0" : "-translate-x-full"
            }`
          : "hidden min-h-screen w-[300px] shrink-0 lg:flex"
      } flex-col border-r p-4 ${
        darkMode
          ? "border-neutral-800 bg-black text-white"
          : "border-slate-200 bg-white text-slate-950"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className={`text-xs font-semibold uppercase ${mutedTextClass(darkMode)}`}>
            Arctic Aria
          </p>
          <h2 className="text-lg font-semibold">Workspace</h2>
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

      <div
        className={`mt-4 rounded-md border p-3 ${
          darkMode
            ? "border-neutral-800 bg-neutral-950"
            : "border-slate-200 bg-slate-50"
        }`}
      >
        <p className={`text-xs font-semibold uppercase ${mutedTextClass(darkMode)}`}>
          Signed in
        </p>
        <p
          className="mt-1 truncate text-sm font-semibold"
          title={currentUser.username}
        >
          {currentUser.displayName}
        </p>
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
          icon={<ListTodo size={18} aria-hidden="true" />}
          label="Tasks"
          darkMode={darkMode}
          onClick={() => onUnavailableFeature("Tasks")}
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
          icon={<ListChecks size={18} aria-hidden="true" />}
          label="Review"
          darkMode={darkMode}
          onClick={onReviewOpen}
        />
        <SidebarItem
          icon={<Settings size={18} aria-hidden="true" />}
          label="Settings"
          darkMode={darkMode}
          onClick={() => onUnavailableFeature("Settings")}
        />
      </nav>

      <div
        className={`mt-auto grid gap-3 rounded-md border p-3 ${
          darkMode
            ? "border-neutral-800 bg-neutral-950"
            : "border-slate-200 bg-slate-50"
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {darkMode ? (
              <Moon size={18} aria-hidden="true" />
            ) : (
              <Sun size={18} aria-hidden="true" />
            )}
            <span className="text-sm font-semibold">Dark mode</span>
          </div>
          <Switch
            checked={darkMode}
            darkMode={darkMode}
            label="Toggle dark mode"
            onChange={onThemeChange}
          />
        </div>
        <Button
          darkMode={darkMode}
          disabled={logoutPending}
          icon={<LogOut size={17} aria-hidden="true" />}
          onClick={onLogout}
        >
          {logoutPending ? "Signing out..." : "Sign out"}
        </Button>
      </div>
    </aside>
  );
}

function SidebarItem({
  icon,
  label,
  active = false,
  darkMode,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  active?: boolean;
  darkMode: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      darkMode={darkMode}
      tone={active ? "primary" : "ghost"}
      size="md"
      className="w-full justify-start"
      icon={icon}
      onClick={onClick}
    >
      {label}
    </Button>
  );
}
