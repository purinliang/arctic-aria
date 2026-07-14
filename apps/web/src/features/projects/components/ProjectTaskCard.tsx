import { Ban, Check, ChevronDown, Edit3, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExpandableListItem } from "@/components/ui/list";
import { Tag } from "@/components/ui/tag";
import type { Task } from "@/features/dashboard/types";
import { titleCase } from "./project-page-helpers";

function priorityClass(priority: Task["priority"], darkMode: boolean) {
  if (priority === "high") {
    return darkMode
      ? "border-red-400/40 bg-red-500/15 text-red-200"
      : "border-red-200 bg-red-50 text-red-700";
  }

  if (priority === "medium") {
    return darkMode
      ? "border-amber-400/40 bg-amber-500/15 text-amber-200"
      : "border-amber-200 bg-amber-50 text-amber-700";
  }

  return darkMode
    ? "border-neutral-700 bg-black text-neutral-300"
    : "border-slate-200 bg-slate-50 text-slate-600";
}

export function ProjectTaskCard({
  task,
  darkMode,
  taskPending = false,
  pendingSubtaskIds = [],
  expanded,
  onToggleExpanded,
  onSubtaskToggle,
  onDone,
  onBlock,
  onSkip,
  onEdit,
}: {
  task: Task;
  darkMode: boolean;
  taskPending?: boolean;
  pendingSubtaskIds?: string[];
  expanded: boolean;
  onToggleExpanded: () => void;
  onSubtaskToggle: (subtaskId: string) => void;
  onDone: () => void;
  onBlock: () => void;
  onSkip: () => void;
  onEdit: () => void;
}) {
  return (
    <ExpandableListItem
      darkMode={darkMode}
      expanded={expanded}
      headerClassName="items-center"
      bodyClassName="grid gap-3"
      onToggle={onToggleExpanded}
      header={
        <>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="min-w-0 text-base font-semibold">{task.title}</h3>
              <span
                className={`rounded-md border px-2 py-0.5 text-xs font-semibold ${priorityClass(task.priority, darkMode)}`}
              >
                {titleCase(task.priority)}
              </span>
              <Tag darkMode={darkMode}>{titleCase(task.status)}</Tag>
            </div>
            <div
              className={`mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm ${
                darkMode ? "text-neutral-400" : "text-slate-500"
              }`}
            >
              <span>{task.projectLabel}</span>
              <span>{task.milestoneLabel}</span>
              <span>Deadline {task.deadline}</span>
              <span>{task.subtaskSummary}</span>
            </div>
          </div>
          <ChevronDown
            className={`shrink-0 transition ${expanded ? "rotate-180" : ""}`}
            size={18}
            aria-hidden="true"
          />
        </>
      }
    >
      <p
        className={`text-sm leading-6 ${
          darkMode ? "text-neutral-300" : "text-slate-600"
        }`}
      >
        {task.description || "No description."}
      </p>
      {task.subtasks?.map((subtask) => (
        <label
          key={subtask.id}
          className={`grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-md px-2 py-2 text-sm ${
            darkMode ? "text-neutral-200" : "text-slate-700"
          }`}
        >
          <input
            className="accent-emerald-500"
            type="checkbox"
            checked={subtask.done}
            disabled={pendingSubtaskIds.includes(subtask.id)}
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
              {subtask.description || "No description."}
            </span>
          </span>
        </label>
      ))}
      <div className="flex flex-wrap gap-2 pt-1">
        <Button
          darkMode={darkMode}
          disabled={taskPending || task.status === "done"}
          icon={<Check size={14} aria-hidden="true" />}
          onClick={onDone}
        >
          Done
        </Button>
        <Button
          darkMode={darkMode}
          disabled={taskPending || task.status === "blocked"}
          icon={<Ban size={14} aria-hidden="true" />}
          onClick={onBlock}
        >
          Block
        </Button>
        <Button
          darkMode={darkMode}
          disabled={taskPending || task.status === "skipped"}
          icon={<SkipForward size={14} aria-hidden="true" />}
          onClick={onSkip}
        >
          Skip
        </Button>
        <Button
          darkMode={darkMode}
          disabled={taskPending}
          icon={<Edit3 size={14} aria-hidden="true" />}
          onClick={onEdit}
        >
          Edit
        </Button>
      </div>
    </ExpandableListItem>
  );
}
