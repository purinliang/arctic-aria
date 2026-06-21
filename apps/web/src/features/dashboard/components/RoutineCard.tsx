import { ChevronDown } from "lucide-react";
import type { Routine, RoutineStatus } from "../types";

function routineStatusClass(status: RoutineStatus, darkMode: boolean) {
  if (status === "done") {
    return darkMode
      ? "border-white/20 bg-white text-black"
      : "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "reminding") {
    return darkMode
      ? "border-white/20 bg-white/10 text-white"
      : "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "skipped") {
    return darkMode
      ? "border-neutral-700 bg-neutral-900 text-neutral-300"
      : "border-slate-200 bg-slate-100 text-slate-600";
  }

  return darkMode
    ? "border-neutral-700 bg-black text-neutral-300"
    : "border-blue-200 bg-blue-50 text-blue-700";
}

export function RoutineCard({
  routine,
  darkMode,
  expanded,
  onToggleExpanded,
  onStatusChange,
}: {
  routine: Routine;
  darkMode: boolean;
  expanded: boolean;
  onToggleExpanded: () => void;
  onStatusChange: (status: RoutineStatus) => void;
}) {
  return (
    <article>
      <button
        className={`grid w-full grid-cols-[1fr_auto] gap-3 px-4 py-4 text-left transition ${
          darkMode ? "hover:bg-neutral-900" : "hover:bg-slate-50"
        }`}
        type="button"
        aria-expanded={expanded}
        onClick={onToggleExpanded}
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="min-w-0 text-sm font-semibold">{routine.title}</h3>
          </div>
          <div
            className={`mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs ${
              darkMode ? "text-neutral-400" : "text-slate-500"
            }`}
          >
            <span>{routine.scheduledTime}</span>
            <span>{routine.streakText}</span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span
            className={`rounded-md border px-2 py-0.5 text-xs font-semibold ${routineStatusClass(routine.status, darkMode)}`}
          >
            {routine.status}
          </span>
          <ChevronDown
            className={`transition ${expanded ? "rotate-180" : ""}`}
            size={18}
            aria-hidden="true"
          />
        </div>
      </button>
      {expanded ? (
        <div
          className={`mx-4 mb-4 grid grid-cols-3 gap-2 rounded-md border p-3 ${
            darkMode
              ? "border-neutral-800 bg-black"
              : "border-slate-200 bg-slate-50"
          }`}
        >
          <button
            className={routineButtonClass(darkMode)}
            type="button"
            onClick={() => onStatusChange("done")}
          >
            Done
          </button>
          <button
            className={routineButtonClass(darkMode)}
            type="button"
            onClick={() => onStatusChange("pending")}
          >
            Busy
          </button>
          <button
            className={routineButtonClass(darkMode)}
            type="button"
            onClick={() => onStatusChange("skipped")}
          >
            Skip
          </button>
        </div>
      ) : null}
    </article>
  );
}

function routineButtonClass(darkMode: boolean) {
  return `h-9 rounded-md border px-2 text-xs font-semibold transition ${
    darkMode
      ? "border-neutral-700 text-neutral-200 hover:border-white hover:text-white"
      : "border-slate-300 text-slate-700 hover:border-slate-500"
  }`;
}
