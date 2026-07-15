// Dashboard - Project Tasks Panel.
import { Check, ChevronRight } from "lucide-react";
import { Button } from "@/components/button";
import { CardHeader } from "@/components/card";
import { dividerClass, mutedTextClass } from "@/components/color";
import { CheckboxControl } from "@/components/forms/selection-field";
import { ListItem } from "@/components/list";
import { Panel } from "@/components/panel";
import { DescriptionText, SupportingText } from "@/components/text";
import type { Task } from "@/features/dashboard/types";

export function ProjectTasksPanel({
  darkMode,
  tasks,
  loading,
  pendingTaskIds,
  onTaskDone,
  onTaskOpen,
}: {
  darkMode: boolean;
  tasks: Task[];
  loading: boolean;
  pendingTaskIds: string[];
  onTaskDone: (taskId: string) => void;
  onTaskOpen: (projectId: string) => void;
}) {
  return (
    <Panel darkMode={darkMode} className="min-w-0">
      <CardHeader
        icon={<Check size={18} aria-hidden="true" />}
        title="Today's tasks to move projects forward"
        meta={`${tasks.length} recommended`}
        darkMode={darkMode}
      />
      <div className={dividerClass(darkMode)}>
        {loading ? (
          <EmptyLine darkMode={darkMode} text="Loading tasks..." />
        ) : null}
        {!loading && tasks.length === 0 ? (
          <EmptyLine darkMode={darkMode} text="No tasks selected for today." />
        ) : null}
        {tasks.map((task) => (
          <ProjectTaskRow
            key={task.id}
            task={task}
            darkMode={darkMode}
            taskPending={pendingTaskIds.includes(task.id)}
            onDone={() => onTaskDone(task.id)}
            onOpen={() => onTaskOpen(task.projectId)}
          />
        ))}
      </div>
    </Panel>
  );
}

// Dashboard - Project Tasks Panel - Project task row.
function ProjectTaskRow({
  task,
  darkMode,
  taskPending = false,
  onDone,
  onOpen,
}: {
  task: Task;
  darkMode: boolean;
  taskPending?: boolean;
  onDone: () => void;
  onOpen: () => void;
}) {
  const metadata = [
    task.projectLabel,
    task.milestoneLabel,
    deadlineText(task.deadline),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <ListItem darkMode={darkMode} className="items-start">
      <div className="grid min-w-0 flex-1 grid-cols-[auto_minmax(0,1fr)] gap-3">
        <CheckboxControl
          darkMode={darkMode}
          className="mt-1"
          checked={task.status === "done"}
          disabled={taskPending || task.status === "done"}
          aria-label={`Mark ${task.title} done`}
          onChange={(event) => {
            if (event.target.checked) {
              onDone();
            }
          }}
        />
        <div className="min-w-0">
          <h3 className="min-w-0 text-base font-semibold">{task.title}</h3>
          <DescriptionText darkMode={darkMode} className="mt-1">
            {task.description || "No description."}
          </DescriptionText>
          <SupportingText darkMode={darkMode} className="mt-2 block">
            {metadata}
          </SupportingText>
        </div>
      </div>
      <Button
        darkMode={darkMode}
        tone="ghost"
        size="icon-sm"
        aria-label={`Open project for ${task.title}`}
        icon={<ChevronRight size={16} aria-hidden="true" />}
        onClick={onOpen}
      />
    </ListItem>
  );
}

function deadlineText(deadline: string) {
  return deadline === "No deadline" ? deadline : `Deadline ${deadline}`;
}

function EmptyLine({ darkMode, text }: { darkMode: boolean; text: string }) {
  return (
    <p className={`px-4 py-4 text-sm ${mutedTextClass(darkMode)}`}>
      {text}
    </p>
  );
}
