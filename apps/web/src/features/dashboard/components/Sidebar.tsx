import {
  Bell,
  ClipboardList,
  LayoutDashboard,
  Moon,
  Settings,
  Sun,
  X,
} from "lucide-react";
import type { ReactNode } from "react";

export function Sidebar({
  open,
  darkMode,
  onClose,
  onThemeChange,
}: {
  open: boolean;
  darkMode: boolean;
  onClose: () => void;
  onThemeChange: (darkMode: boolean) => void;
}) {
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
            <p
              className={`text-xs font-semibold uppercase ${
                darkMode ? "text-neutral-500" : "text-slate-500"
              }`}
            >
              Arctic Aria
            </p>
            <h2 className="text-lg font-semibold">Workspace</h2>
          </div>
          <button
            className={`flex h-9 w-9 items-center justify-center rounded-md border transition ${
              darkMode
                ? "border-neutral-800 hover:border-white"
                : "border-slate-300 hover:border-slate-500"
            }`}
            type="button"
            aria-label="Close navigation"
            onClick={onClose}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <nav className="mt-6 grid gap-2">
          <SidebarItem
            icon={<LayoutDashboard size={18} aria-hidden="true" />}
            label="Dashboard"
            active
            darkMode={darkMode}
          />
          <SidebarItem
            icon={<ClipboardList size={18} aria-hidden="true" />}
            label="Tasks"
            darkMode={darkMode}
          />
          <SidebarItem
            icon={<Bell size={18} aria-hidden="true" />}
            label="Routines"
            darkMode={darkMode}
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
            <button
              className={`h-7 w-12 rounded-full border p-1 transition ${
                darkMode
                  ? "border-white bg-white"
                  : "border-slate-300 bg-slate-200"
              }`}
              type="button"
              role="switch"
              aria-checked={darkMode}
              onClick={() => onThemeChange(!darkMode)}
            >
              <span
                className={`block h-4 w-4 rounded-full transition ${
                  darkMode ? "translate-x-5 bg-black" : "translate-x-0 bg-white"
                }`}
              />
            </button>
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
}: {
  icon: ReactNode;
  label: string;
  active?: boolean;
  darkMode: boolean;
}) {
  return (
    <button
      className={`flex h-10 items-center gap-3 rounded-md px-3 text-sm font-semibold transition ${
        active
          ? darkMode
            ? "bg-white text-black"
            : "bg-slate-950 text-white"
          : darkMode
            ? "text-neutral-300 hover:bg-neutral-900"
            : "text-slate-700 hover:bg-slate-100"
      }`}
      type="button"
    >
      {icon}
      {label}
    </button>
  );
}
