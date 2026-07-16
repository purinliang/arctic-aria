// Dashboard - Project Tasks Panel.
import { ChevronRight, ListChecks } from "lucide-react";
import { Button } from "@/components/button";
import { CardHeader } from "@/components/card";
import { mutedTextClass } from "@/components/color";
import { CheckboxControl } from "@/components/forms/selection-field";
import { List, ListItem } from "@/components/list";
import { LoadingLine } from "@/components/loading";
import { Panel } from "@/components/panel";
import { DescriptionText, SupportingText } from "@/components/text";
import { dashboardTaskStatusForChecked } from "@/features/dashboard/optimistic-updates";
import type { Task, TaskStatus } from "@/features/dashboard/types";

export function ProjectTasksPanel({
  darkMode,
  tasks,
  loading,
  onTaskStatus,
  onTaskOpen,
}: {
  darkMode: boolean;
  tasks: Task[];
  loading: boolean;
  onTaskStatus: (
    taskId: string,
    status: Exclude<TaskStatus, "archived">,
  ) => void;
  onTaskOpen: (projectId: string) => void;
}) {
  return (
    <Panel darkMode={darkMode} className="min-w-0">
      <CardHeader
        icon={<ListChecks size={18} aria-hidden="true" />}
        title="Today's tasks to move projects forward"
        darkMode={darkMode}
      />
      <List darkMode={darkMode}>
        {loading ? (
          <LoadingLine darkMode={darkMode} text="Loading tasks..." />
        ) : null}
        {!loading && tasks.length === 0 ? (
          <EmptyLine darkMode={darkMode} text="No tasks selected for today." />
        ) : null}
        {tasks.map((task) => (
          <ProjectTaskRow
            key={task.id}
            task={task}
            darkMode={darkMode}
            onTaskStatus={(status) => onTaskStatus(task.id, status)}
            onOpen={() => onTaskOpen(task.projectId)}
          />
        ))}
      </List>
    </Panel>
  );
}

// Dashboard - Project Tasks Panel - Project task row.
function ProjectTaskRow({
  task,
  darkMode,
  onTaskStatus,
  onOpen,
}: {
  task: Task;
  darkMode: boolean;
  onTaskStatus: (status: Exclude<TaskStatus, "archived">) => void;
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
          aria-label={`Mark ${task.title} done`}
          onChange={(event) =>
            onTaskStatus(dashboardTaskStatusForChecked(event.target.checked))
          }
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
