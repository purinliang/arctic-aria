import { ChevronDown } from "lucide-react";
import type { Task } from "../types";

function priorityClass(priority: Task["priority"], darkMode: boolean) {
  if (priority === "High") {
    return darkMode
      ? "border-white/20 bg-white/10 text-white"
      : "border-red-200 bg-red-50 text-red-700";
  }

  if (priority === "Medium") {
    return darkMode
      ? "border-neutral-600 bg-neutral-900 text-neutral-200"
      : "border-amber-200 bg-amber-50 text-amber-700";
  }

  return darkMode
    ? "border-neutral-700 bg-black text-neutral-300"
    : "border-slate-200 bg-slate-50 text-slate-600";
}

function progressCircleClass(progress: number, darkMode: boolean) {
  if (progress >= 100) {
    return "bg-emerald-500";
  }

  if (progress > 0) {
    return "bg-emerald-500/70";
  }

  return darkMode
    ? "border border-neutral-600 bg-transparent"
    : "border border-slate-300 bg-white";
}

export function TaskCard({
  task,
  darkMode,
  expanded,
  onToggleExpanded,
  onSubtaskToggle,
}: {
  task: Task;
  darkMode: boolean;
  expanded: boolean;
  onToggleExpanded: () => void;
  onSubtaskToggle: (subtaskId: string) => void;
}) {
  const progress = Math.round((task.completedWeight / task.weight) * 100);

  return (
    <article>
      <button
        className={`grid w-full grid-cols-[28px_1fr_auto] items-center gap-3 px-4 py-4 text-left transition ${
          darkMode ? "hover:bg-neutral-900" : "hover:bg-slate-50"
        }`}
        type="button"
        aria-expanded={expanded}
        onClick={onToggleExpanded}
      >
        <span
          className={`h-4 w-4 rounded-full ${progressCircleClass(progress, darkMode)}`}
          aria-label={`${progress}% complete`}
        />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="min-w-0 text-base font-semibold">{task.title}</h3>
            <span
              className={`rounded-md border px-2 py-0.5 text-xs font-semibold ${priorityClass(task.priority, darkMode)}`}
            >
              {task.priority}
            </span>
          </div>
          <div
            className={`mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm ${
              darkMode ? "text-neutral-400" : "text-slate-500"
            }`}
          >
            <span>{task.planLabel}</span>
            <span>Deadline {task.deadline}</span>
            <span>
              Weight {task.completedWeight}/{task.weight}
            </span>
          </div>
        </div>
        <ChevronDown
          className={`shrink-0 transition ${expanded ? "rotate-180" : ""}`}
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
          {task.subtasks?.map((subtask) => (
            <label
              key={subtask.id}
              className={`grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-md px-2 py-2 text-sm ${
                darkMode ? "text-neutral-200" : "text-slate-700"
              }`}
              onClick={(event) => event.stopPropagation()}
            >
              <input
                className="accent-emerald-500"
                type="checkbox"
                checked={subtask.done}
                onChange={() => onSubtaskToggle(subtask.id)}
              />
              <span className="min-w-0">
                <span className="block truncate font-semibold">
                  {subtask.title}
                </span>
                <span
                  className={`block truncate text-xs ${
                    darkMode ? "text-neutral-500" : "text-slate-500"
                  }`}
                >
                  {subtask.description}
                </span>
              </span>
              <span className="flex shrink-0 gap-1" aria-label={`${subtask.weight} weight`}>
                {Array.from({ length: subtask.weight }).map((_, index) => (
                  <span
                    key={index}
                    className={`h-3 w-3 rounded-full border ${
                      subtask.done
                        ? "border-emerald-500 bg-emerald-500"
                        : darkMode
                          ? "border-neutral-500"
                          : "border-slate-300"
                    }`}
                  />
                ))}
              </span>
            </label>
          ))}
        </div>
      ) : null}
    </article>
  );
}
