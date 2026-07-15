import { ChevronDown, Edit3 } from "lucide-react";
import { Button } from "@/components/button";
import { mutedTextClass } from "@/components/color";
import { CheckboxControl } from "@/components/forms/selection-field";
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
      leading={
        <CheckboxControl
          darkMode={darkMode}
          checked={task.status === "done"}
          disabled={taskPending || task.status === "done"}
          aria-label={`Mark ${task.title} done`}
          onChange={(event) => {
            if (event.target.checked) {
              onDone();
            }
          }}
        />
      }
      headerClassName="items-center"
      bodyClassName="flex flex-wrap gap-2"
      onToggle={onToggleExpanded}
      header={
        <>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="min-w-0 text-base font-semibold">{task.title}</h3>
            </div>
            <p className={`mt-1 text-sm leading-6 ${mutedTextClass(darkMode)}`}>
              {task.description || "No description."}
            </p>
            <p className={`mt-2 text-xs ${mutedTextClass(darkMode)}`}>
              {task.projectLabel} · {task.milestoneLabel} ·{" "}
              {deadlineText(task.deadline)}
            </p>
          </div>
          <ChevronDown
            className={`shrink-0 transition ${expanded ? "rotate-180" : ""}`}
            size={18}
            aria-hidden="true"
          />
        </>
      }
    >
      <Button
        darkMode={darkMode}
        disabled={taskPending}
        icon={<Edit3 size={14} aria-hidden="true" />}
        onClick={onEdit}
      >
        Edit
      </Button>
    </ExpandableListItem>
  );
}

function deadlineText(deadline: string) {
  return deadline === "No deadline" ? deadline : `Deadline ${deadline}`;
}
