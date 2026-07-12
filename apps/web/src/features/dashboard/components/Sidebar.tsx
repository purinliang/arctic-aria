import {
  Bell,
  ClipboardList,
  LayoutDashboard,
  ListTodo,
  Moon,
  Settings,
  Sun,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { mutedTextClass } from "@/components/ui/color";
import { Switch } from "@/components/ui/switch";
import type { DashboardView } from "../types";

export function Sidebar({
  open,
  darkMode,
  activeView,
  onClose,
  onViewChange,
  onThemeChange,
}: {
  open: boolean;
  darkMode: boolean;
  activeView: DashboardView;
  onClose: () => void;
  onViewChange: (view: DashboardView) => void;
  onThemeChange: (darkMode: boolean) => void;
}) {
  function selectView(view: DashboardView) {
    onViewChange(view);
    onClose();
  }

  return (
    <div
      className={`fixed inset-0 z-40 transition ${
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
      <aside
        className={`absolute left-0 top-0 flex h-full w-[300px] max-w-[86vw] flex-col border-r p-4 shadow-xl transition-transform ${
          open ? "translate-x-0" : "-translate-x-full"
        } ${
          darkMode
            ? "border-neutral-800 bg-black text-white"
            : "border-slate-200 bg-white text-slate-950"
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className={`text-xs font-semibold uppercase ${mutedTextClass(darkMode)}`}>
              Arctic Aria
            </p>
            <h2 className="text-lg font-semibold">Workspace</h2>
          </div>
          <Button
            darkMode={darkMode}
            size="icon-sm"
            aria-label="Close navigation"
            icon={<X size={18} aria-hidden="true" />}
            onClick={onClose}
          />
        </div>

        <nav className="mt-6 grid gap-2">
          <SidebarItem
            icon={<LayoutDashboard size={18} aria-hidden="true" />}
            label="Dashboard"
            active={activeView === "dashboard"}
            darkMode={darkMode}
            onClick={() => selectView("dashboard")}
          />
          <SidebarItem
            icon={<ListTodo size={18} aria-hidden="true" />}
            label="Tasks"
            darkMode={darkMode}
          />
          <SidebarItem
            icon={<Bell size={18} aria-hidden="true" />}
            label="Routines"
            active={activeView === "routines"}
            darkMode={darkMode}
            onClick={() => selectView("routines")}
          />
          <SidebarItem
            icon={<ClipboardList size={18} aria-hidden="true" />}
            label="Memories"
            active={activeView === "memories"}
            darkMode={darkMode}
            onClick={() => selectView("memories")}
          />
          <SidebarItem
            icon={<Settings size={18} aria-hidden="true" />}
            label="Settings"
            darkMode={darkMode}
          />
        </nav>

        <div
          className={`mt-auto rounded-md border p-3 ${
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
        </div>
      </aside>
    </div>
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
  onClick?: () => void;
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
