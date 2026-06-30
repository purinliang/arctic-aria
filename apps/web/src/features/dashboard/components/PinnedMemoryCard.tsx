import { Check, RefreshCw } from "lucide-react";
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
  onDone,
  onReplace,
}: {
  memory: PinnedMemory;
  darkMode: boolean;
  onDone: () => void;
  onReplace: () => void;
}) {
  const completed = memory.status === "completed";

  return (
    <article
      className={`grid gap-3 px-4 py-4 transition ${
        completed
          ? darkMode
            ? "bg-emerald-500/5"
            : "bg-emerald-50/60"
          : darkMode
            ? "hover:bg-neutral-900"
            : "hover:bg-slate-50"
      }`}
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
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

        <div className="flex shrink-0 items-center gap-2">
          <button
            className={`flex h-9 w-9 items-center justify-center rounded-md border transition ${iconButtonClass(darkMode, completed)}`}
            type="button"
            aria-label={`Mark ${memory.title} done`}
            title="Done"
            onClick={onDone}
          >
            <Check size={16} aria-hidden="true" />
          </button>
          <button
            className={`flex h-9 w-9 items-center justify-center rounded-md border transition ${iconButtonClass(darkMode)}`}
            type="button"
            aria-label={`Replace ${memory.title}`}
            title="Replace"
            onClick={onReplace}
          >
            <RefreshCw size={15} aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
}
