import { Check, Edit3 } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import {
  dividerClass,
  mutedTextClass,
  sectionBorderClass,
} from "@/components/ui/color";
import { ListItem } from "@/components/ui/list";
import { Tag } from "@/components/ui/tag";
import { cx } from "@/components/ui/utils";
import type {
  Subtask,
  Task,
  TaskStatus,
} from "@/features/dashboard/types";
import {
  completedText,
  statusOptions,
  titleCase,
} from "./task-page-helpers";

export function TaskFilters({
  darkMode,
  statusFilter,
  planFilter,
  planOptions,
  onStatusChange,
  onPlanChange,
}: {
  darkMode: boolean;
  statusFilter: "all" | TaskStatus;
  planFilter: string;
  planOptions: string[];
  onStatusChange: (status: "all" | TaskStatus) => void;
  onPlanChange: (plan: string) => void;
}) {
  return (
    <div className={cx("grid gap-3 border-b px-4 py-3", sectionBorderClass(darkMode))}>
      <div className="flex flex-wrap gap-2">
        {statusOptions.map((option) => (
          <Button
            key={option.value}
            darkMode={darkMode}
            size="xs"
            active={statusFilter === option.value}
            onClick={() => onStatusChange(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>
      {planOptions.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          <Button
            darkMode={darkMode}
            size="xs"
            active={planFilter === "all"}
            onClick={() => onPlanChange("all")}
          >
            All plans
          </Button>
          {planOptions.map((plan) => (
            <Button
              key={plan}
              darkMode={darkMode}
              size="xs"
              active={planFilter === plan}
              onClick={() => onPlanChange(plan)}
            >
              {plan}
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function TasksList({
  darkMode,
  loading,
  pending,
  tasks,
  expandedTaskId,
  setExpandedTaskId,
  onTaskStatus,
  onProgressEdit,
  onTaskEdit,
}: {
  darkMode: boolean;
  loading: boolean;
  pending: boolean;
  tasks: Task[];
  expandedTaskId: string | null;
  setExpandedTaskId: Dispatch<SetStateAction<string | null>>;
  onTaskStatus: (taskId: string, status: Exclude<TaskStatus, "archived">) => void;
  onProgressEdit: (task: Task) => void;
  onTaskEdit: (task: Task) => void;
}) {
  return (
    <div className={dividerClass(darkMode)}>
      {loading ? (
        <p className={`px-4 py-4 text-sm ${mutedTextClass(darkMode)}`}>
          Loading tasks...
        </p>
      ) : null}
      {!loading && tasks.length === 0 ? (
        <p className={`px-4 py-4 text-sm ${mutedTextClass(darkMode)}`}>
          No tasks yet. Add a task to start planning concrete work.
        </p>
      ) : null}
      {tasks.map((task) => (
        <TaskListItem
          key={task.id}
          task={task}
          darkMode={darkMode}
          pending={pending}
          expanded={expandedTaskId === task.id}
          onToggle={() =>
            setExpandedTaskId((current) =>
              current === task.id ? null : task.id,
            )
          }
          onTaskStatus={onTaskStatus}
          onProgressEdit={onProgressEdit}
          onTaskEdit={onTaskEdit}
        />
      ))}
    </div>
  );
}

function TaskListItem({
  task,
  darkMode,
  pending,
  expanded,
  onToggle,
  onTaskStatus,
  onProgressEdit,
  onTaskEdit,
}: {
  task: Task;
  darkMode: boolean;
  pending: boolean;
  expanded: boolean;
  onToggle: () => void;
  onTaskStatus: (taskId: string, status: Exclude<TaskStatus, "archived">) => void;
  onProgressEdit: (task: Task) => void;
  onTaskEdit: (task: Task) => void;
}) {
  return (
    <ListItem darkMode={darkMode} expanded={expanded} layout="block">
      <button
        className="grid w-full grid-cols-[1fr_auto] items-start gap-3 text-left"
        type="button"
        aria-expanded={expanded}
        onClick={onToggle}
      >
        <span className="min-w-0">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold">{task.title}</span>
            <Tag darkMode={darkMode}>{task.planLabel}</Tag>
            <Tag darkMode={darkMode}>{titleCase(task.priority)}</Tag>
            <Tag darkMode={darkMode}>{titleCase(task.status)}</Tag>
          </span>
          <span className={`mt-1 block text-sm ${mutedTextClass(darkMode)}`}>
            Deadline {task.deadline} · {completedText(task)}
          </span>
        </span>
        <span className={`text-xs font-semibold ${mutedTextClass(darkMode)}`}>
          {expanded ? "Collapse" : "Expand"}
        </span>
      </button>

      {expanded ? (
        <TaskListItemDetails
          task={task}
          darkMode={darkMode}
          pending={pending}
          onTaskStatus={onTaskStatus}
          onProgressEdit={onProgressEdit}
          onTaskEdit={onTaskEdit}
        />
      ) : null}
    </ListItem>
  );
}

function TaskListItemDetails({
  task,
  darkMode,
  pending,
  onTaskStatus,
  onProgressEdit,
  onTaskEdit,
}: {
  task: Task;
  darkMode: boolean;
  pending: boolean;
  onTaskStatus: (taskId: string, status: Exclude<TaskStatus, "archived">) => void;
  onProgressEdit: (task: Task) => void;
  onTaskEdit: (task: Task) => void;
}) {
  return (
    <div className="mt-3 grid gap-3">
      <p className={`text-sm leading-6 ${mutedTextClass(darkMode)}`}>
        {task.description || "No description."}
      </p>
      {task.subtasks && task.subtasks.length > 0 ? (
        <div className="grid gap-2">
          {task.subtasks.map((subtask) => (
            <SubtaskRow key={subtask.id} darkMode={darkMode} subtask={subtask} />
          ))}
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button
          darkMode={darkMode}
          tone="success"
          disabled={pending || task.status === "done"}
          icon={<Check size={14} aria-hidden="true" />}
          onClick={() => onTaskStatus(task.id, "done")}
        >
          Done
        </Button>
        <Button darkMode={darkMode} disabled={pending} onClick={() => onProgressEdit(task)}>
          Progress
        </Button>
        <Button
          darkMode={darkMode}
          disabled={pending || task.status === "blocked"}
          onClick={() => onTaskStatus(task.id, "blocked")}
        >
          Block
        </Button>
        <Button
          darkMode={darkMode}
          disabled={pending || task.status === "skipped"}
          onClick={() => onTaskStatus(task.id, "skipped")}
        >
          Skip
        </Button>
        <Button
          darkMode={darkMode}
          icon={<Edit3 size={14} aria-hidden="true" />}
          onClick={() => onTaskEdit(task)}
        >
          Edit
        </Button>
      </div>
    </div>
  );
}

function SubtaskRow({
  darkMode,
  subtask,
}: {
  darkMode: boolean;
  subtask: Subtask;
}) {
  return (
    <div
      className={`grid grid-cols-[minmax(0,1fr)_auto] gap-3 rounded-md px-2 py-2 text-sm ${
        darkMode ? "bg-white/5 text-neutral-200" : "bg-white text-slate-700"
      }`}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold">{subtask.title}</span>
          <Tag darkMode={darkMode}>{titleCase(subtask.status)}</Tag>
        </div>
        <p className={`mt-1 truncate text-xs ${mutedTextClass(darkMode)}`}>
          {subtask.description || "No description."}
        </p>
      </div>
      <span className="flex shrink-0 gap-1" aria-label={`${subtask.weight} weight`}>
        {Array.from({ length: Math.ceil(subtask.weight) }).map((_, index) => (
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
    </div>
  );
}
