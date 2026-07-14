import { Check, Edit3, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mutedTextClass } from "@/components/ui/color";
import { ListItem } from "@/components/ui/list";
import { Tag } from "@/components/ui/tag";
import type {
  ProjectTaskView,
  ProjectView,
} from "@/features/projects/actions";
import type { TaskStatus } from "@/features/dashboard/types";
import { titleCase } from "./project-page-helpers";

export function ProjectDetailPage({
  darkMode,
  pending,
  project,
  onAddMilestone,
  onEditMilestone,
  onAddTask,
  onEditTask,
  onTaskStatus,
}: {
  darkMode: boolean;
  pending: boolean;
  project: ProjectView | null;
  onAddMilestone: (projectId: string) => void;
  onEditMilestone: (milestone: ProjectView["milestones"][number]) => void;
  onAddTask: (projectId: string, milestoneId: string) => void;
  onEditTask: (task: ProjectTaskView) => void;
  onTaskStatus: (
    taskId: string,
    status: Exclude<TaskStatus, "archived">,
  ) => void;
}) {
  if (!project) {
    return (
      <div className="px-4 py-4">
        <p className={`text-sm ${mutedTextClass(darkMode)}`}>
          Select a project to view milestones and tasks.
        </p>
      </div>
    );
  }

  return (
    <section className="grid gap-4 px-4 py-4">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-semibold">{project.title}</h2>
          <Tag darkMode={darkMode}>{titleCase(project.status)}</Tag>
        </div>
        <p className={`mt-2 text-sm leading-6 ${mutedTextClass(darkMode)}`}>
          {project.objective}
        </p>
        {project.importanceReason ? (
          <p className={`mt-2 text-sm leading-6 ${mutedTextClass(darkMode)}`}>
            {project.importanceReason}
          </p>
        ) : null}
        <div
          className={`mt-3 flex flex-wrap gap-x-3 gap-y-1 text-sm ${mutedTextClass(darkMode)}`}
        >
          <span>Started {project.startDate}</span>
          <span>{project.timelineText}</span>
          <span>{project.progressText}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          darkMode={darkMode}
          disabled={pending}
          icon={<Plus size={14} aria-hidden="true" />}
          onClick={() => onAddMilestone(project.id)}
        >
          Add milestone
        </Button>
      </div>

      <div className="grid gap-3">
        {project.milestones.map((milestone) => (
          <ListItem key={milestone.id} darkMode={darkMode} layout="block">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-semibold">{milestone.title}</h3>
                  <Tag darkMode={darkMode}>{titleCase(milestone.status)}</Tag>
                </div>
                <p className={`mt-1 text-sm ${mutedTextClass(darkMode)}`}>
                  {milestone.objective || milestone.progressText}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  darkMode={darkMode}
                  size="xs"
                  disabled={pending}
                  icon={<Edit3 size={13} aria-hidden="true" />}
                  onClick={() => onEditMilestone(milestone)}
                >
                  Edit
                </Button>
                <Button
                  darkMode={darkMode}
                  size="xs"
                  disabled={pending}
                  icon={<Plus size={13} aria-hidden="true" />}
                  onClick={() => onAddTask(project.id, milestone.id)}
                >
                  Add task
                </Button>
              </div>
            </div>
            <div className="mt-3 grid gap-2">
              {milestone.tasks.length === 0 ? (
                <p className={`text-sm ${mutedTextClass(darkMode)}`}>
                  No tasks in this milestone yet. Add the next concrete task.
                </p>
              ) : null}
              {milestone.tasks.map((task) => (
                <ProjectTaskRow
                  key={task.id}
                  darkMode={darkMode}
                  pending={pending}
                  task={task}
                  onEdit={() => onEditTask(task)}
                  onTaskStatus={onTaskStatus}
                />
              ))}
            </div>
          </ListItem>
        ))}
      </div>
    </section>
  );
}

function ProjectTaskRow({
  darkMode,
  pending,
  task,
  onEdit,
  onTaskStatus,
}: {
  darkMode: boolean;
  pending: boolean;
  task: ProjectTaskView;
  onEdit: () => void;
  onTaskStatus: (
    taskId: string,
    status: Exclude<TaskStatus, "archived">,
  ) => void;
}) {
  return (
    <div
      className={`rounded-md border px-3 py-3 ${
        darkMode ? "border-neutral-800 bg-black" : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold">{task.title}</span>
            <Tag darkMode={darkMode}>{titleCase(task.status)}</Tag>
            <Tag darkMode={darkMode}>{titleCase(task.priority)}</Tag>
          </div>
          <p className={`mt-1 text-sm ${mutedTextClass(darkMode)}`}>
            {task.subtaskSummary} · Deadline {task.deadline}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            darkMode={darkMode}
            size="xs"
            tone="success"
            disabled={pending || task.status === "done"}
            icon={<Check size={13} aria-hidden="true" />}
            onClick={() => onTaskStatus(task.id, "done")}
          >
            Done
          </Button>
          <Button darkMode={darkMode} size="xs" disabled={pending} onClick={onEdit}>
            Edit
          </Button>
        </div>
      </div>
    </div>
  );
}
