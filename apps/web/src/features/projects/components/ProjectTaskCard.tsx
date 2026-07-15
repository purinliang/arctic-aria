import { ChevronDown, Edit3 } from "lucide-react";
import { Button } from "@/components/button";
import { CheckboxField } from "@/components/forms/selection-field";
import { ExpandableListItem } from "@/components/list";
import type { Task } from "@/features/dashboard/types";

export function ProjectTaskCard({
  task,
  darkMode,
  taskPending = false,
  expanded,
  onToggleExpanded,
  onDone,
  onEdit,
}: {
  task: Task;
  darkMode: boolean;
  taskPending?: boolean;
  expanded: boolean;
  onToggleExpanded: () => void;
  onDone: () => void;
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
            </div>
            <div
              className={`mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm ${
                darkMode ? "text-neutral-400" : "text-slate-500"
              }`}
            >
              <span>{task.projectLabel}</span>
              <span>{task.milestoneLabel}</span>
              <span>Deadline {task.deadline}</span>
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
      <div className="flex flex-wrap gap-2 pt-1">
        <CheckboxField
          darkMode={darkMode}
          label="Done"
          checked={task.status === "done"}
          disabled={taskPending || task.status === "done"}
          onChange={() => onDone()}
        />
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
