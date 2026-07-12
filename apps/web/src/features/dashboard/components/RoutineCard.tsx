import { ChevronDown } from "lucide-react";
import type { Routine, RoutineStatus } from "../types";
import {
  DashboardButton,
  Tag,
  mutedTextClass,
} from "./ui/primitives";

export function RoutineCard({
  routine,
  darkMode,
  disabled,
  expanded,
  onToggleExpanded,
  onStatusChange,
  onBusy,
}: {
  routine: Routine;
  darkMode: boolean;
  disabled: boolean;
  expanded: boolean;
  onToggleExpanded: () => void;
  onStatusChange: (status: RoutineStatus) => void;
  onBusy: () => void;
}) {
  return (
    <article>
      <button
        className={`grid w-full grid-cols-[1fr_auto] gap-3 px-4 py-4 text-left transition ${
          darkMode ? "hover:bg-neutral-900" : "hover:bg-slate-50"
        }`}
        type="button"
        aria-expanded={expanded}
        disabled={disabled}
        onClick={onToggleExpanded}
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="min-w-0 text-sm font-semibold">{routine.title}</h3>
          </div>
          <div
            className={`mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs ${mutedTextClass(darkMode)}`}
          >
            <span>{routine.scheduledTime}</span>
            <span>{routine.streakText}</span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Tag darkMode={darkMode} tone={routineStatusTone(routine.status)}>
            {routine.status}
          </Tag>
          {routine.reminderState !== "idle" ? (
            <Tag darkMode={darkMode}>
              {routine.reminderState}
            </Tag>
          ) : null}
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
          <DashboardButton
            darkMode={darkMode}
            className="px-2"
            disabled={disabled}
            onClick={() => onStatusChange("completed")}
          >
            Done
          </DashboardButton>
          <DashboardButton
            darkMode={darkMode}
            className="px-2"
            disabled={disabled}
            onClick={onBusy}
          >
            Busy
          </DashboardButton>
          <DashboardButton
            darkMode={darkMode}
            className="px-2"
            disabled={disabled}
            onClick={() => onStatusChange("skipped")}
          >
            Skip
          </DashboardButton>
        </div>
      ) : null}
    </article>
  );
}

function routineStatusTone(status: RoutineStatus) {
  if (status === "completed") {
    return "emerald";
  }

  if (status === "skipped") {
    return "neutral";
  }

  return "blue";
}
