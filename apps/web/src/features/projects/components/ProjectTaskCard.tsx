import { CheckboxControl } from "@/components/forms/selection-field";
import { ListItem } from "@/components/list";
import { DescriptionText, SupportingText } from "@/components/text";
import type { Task } from "@/features/dashboard/types";

export function ProjectTaskCard({
  task,
  darkMode,
  taskPending = false,
  onDone,
}: {
  task: Task;
  darkMode: boolean;
  taskPending?: boolean;
  onDone: () => void;
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
    </ListItem>
  );
}

function deadlineText(deadline: string) {
  return deadline === "No deadline" ? deadline : `Deadline ${deadline}`;
}
