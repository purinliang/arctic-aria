import { Check, ChevronDown, Eye, RefreshCw, RotateCcw } from "lucide-react";
import type { PinnedMemory } from "../types";

function categoryClass(category: PinnedMemory["category"], darkMode: boolean) {
  if (category === "Cuisine") {
    return darkMode
      ? "border-amber-400/40 bg-amber-500/15 text-amber-200"
      : "border-amber-200 bg-amber-50 text-amber-700";
  }

  return darkMode
    ? "border-cyan-400/40 bg-cyan-500/15 text-cyan-200"
    : "border-cyan-200 bg-cyan-50 text-cyan-700";
}

function iconButtonClass(darkMode: boolean, active = false) {
  if (active) {
    return darkMode
      ? "border-emerald-400/50 bg-emerald-500/15 text-emerald-200"
      : "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  return darkMode
    ? "border-neutral-700 text-neutral-300 hover:border-white hover:text-white"
    : "border-slate-300 text-slate-600 hover:border-slate-500 hover:text-slate-950";
}

export function PinnedMemoryCard({
  memory,
  darkMode,
  disabled,
  expanded,
  onDone,
  onCancelDone,
  onReplace,
  onView,
  onToggleExpanded,
}: {
  memory: PinnedMemory;
  darkMode: boolean;
  disabled: boolean;
  expanded: boolean;
  onDone: () => void;
  onCancelDone: () => void;
  onReplace: () => void;
  onView: () => void;
  onToggleExpanded: () => void;
}) {
  const completed = memory.status === "completed";

  return (
    <article>
      <button
        className={`grid w-full grid-cols-[1fr_auto] items-start gap-3 px-4 py-4 text-left transition ${
          completed
            ? darkMode
              ? "bg-emerald-500/5"
              : "bg-emerald-50/60"
            : darkMode
              ? "hover:bg-neutral-900"
              : "hover:bg-slate-50"
        }`}
        type="button"
        aria-expanded={expanded}
        disabled={disabled}
        onClick={onToggleExpanded}
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3
              className={`min-w-0 text-sm font-semibold ${
                completed ? "line-through decoration-emerald-500/70" : ""
              }`}
            >
              {memory.title}
            </h3>
            <span
              className={`rounded-md border px-2 py-0.5 text-xs font-semibold ${categoryClass(memory.category, darkMode)}`}
            >
              {memory.category}
            </span>
          </div>
          <p
            className={`mt-1 line-clamp-2 text-xs leading-5 ${
              darkMode ? "text-neutral-400" : "text-slate-500"
            }`}
          >
            {memory.description}
          </p>
          <p
            className={`mt-2 text-xs ${
              completed
                ? darkMode
                  ? "text-emerald-300"
                  : "text-emerald-700"
                : darkMode
                  ? "text-neutral-500"
                  : "text-slate-500"
            }`}
          >
            {completed ? "Completed in this prototype" : memory.meta}
          </p>
        </div>

        <ChevronDown
          className={`mt-1 shrink-0 transition ${expanded ? "rotate-180" : ""}`}
          size={18}
          aria-hidden="true"
        />
      </button>

      {expanded ? (
        <div
          className={`mx-4 mb-4 grid gap-2 rounded-md border p-3 ${
            darkMode
              ? "border-neutral-800 bg-black"
              : "border-slate-200 bg-slate-50"
          }`}
        >
          <div className="grid grid-cols-3 gap-2">
            {completed ? (
              <button
                className={`flex h-9 items-center justify-center gap-2 rounded-md border px-2 text-xs font-semibold transition ${iconButtonClass(darkMode, true)}`}
                type="button"
                disabled={disabled}
                onClick={onCancelDone}
              >
                <RotateCcw size={15} aria-hidden="true" />
                Cancel
              </button>
            ) : (
              <button
                className={`flex h-9 items-center justify-center gap-2 rounded-md border px-2 text-xs font-semibold transition ${iconButtonClass(darkMode)}`}
                type="button"
                disabled={disabled}
                onClick={onDone}
              >
                <Check size={15} aria-hidden="true" />
                Done
              </button>
            )}
            <button
              className={`flex h-9 items-center justify-center gap-2 rounded-md border px-2 text-xs font-semibold transition ${iconButtonClass(darkMode)}`}
              type="button"
              disabled={disabled}
              onClick={onReplace}
            >
              <RefreshCw size={14} aria-hidden="true" />
              Replace
            </button>
            <button
              className={`flex h-9 items-center justify-center gap-2 rounded-md border px-2 text-xs font-semibold transition ${iconButtonClass(darkMode)}`}
              type="button"
              disabled={disabled}
              onClick={onView}
            >
              <Eye size={15} aria-hidden="true" />
              View
            </button>
          </div>
          <p
            className={`text-xs ${
              darkMode ? "text-neutral-500" : "text-slate-500"
            }`}
          >
            Visible for a soft window; completed items can be canceled before
            cleanup.
          </p>
        </div>
      ) : null}
    </article>
  );
}
