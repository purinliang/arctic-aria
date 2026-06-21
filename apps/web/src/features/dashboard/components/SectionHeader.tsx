import type { ReactNode } from "react";

export function SectionHeader({
  icon,
  title,
  meta,
  darkMode,
}: {
  icon: ReactNode;
  title: string;
  meta: string;
  darkMode: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-3 border-b px-4 py-3 ${
        darkMode ? "border-neutral-800" : "border-slate-200"
      }`}
    >
      <div className="flex min-w-0 items-center gap-2">
        <span className={darkMode ? "text-neutral-400" : "text-slate-500"}>
          {icon}
        </span>
        <h2 className="truncate text-base font-semibold">{title}</h2>
      </div>
      <span
        className={`shrink-0 text-sm ${
          darkMode ? "text-neutral-400" : "text-slate-500"
        }`}
      >
        {meta}
      </span>
    </div>
  );
}
