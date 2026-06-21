import { ChevronDown } from "lucide-react";
import type { Task } from "../types";

function priorityClass(priority: Task["priority"], darkMode: boolean) {
  if (priority === "High") {
    return darkMode
      ? "border-red-400/40 bg-red-500/15 text-red-200"
      : "border-red-200 bg-red-50 text-red-700";
  }

  if (priority === "Medium") {
    return darkMode
      ? "border-amber-400/40 bg-amber-500/15 text-amber-200"
      : "border-amber-200 bg-amber-50 text-amber-700";
  }

  return darkMode
    ? "border-neutral-700 bg-black text-neutral-300"
    : "border-slate-200 bg-slate-50 text-slate-600";
}

function progressTrackColor(darkMode: boolean) {
  return darkMode ? "#404040" : "#d1d5db";
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
          className="grid h-5 w-5 shrink-0 place-items-center rounded-full"
          style={{
            background: `conic-gradient(#22c55e ${progress * 3.6}deg, ${progressTrackColor(darkMode)} 0deg)`,
          }}
          aria-label={`${progress}% complete`}
        >
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              darkMode ? "bg-black" : "bg-white"
            }`}
          />
        </span>
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
                          ? "border-neutral-300 bg-black"
                          : "border-slate-500 bg-white"
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
