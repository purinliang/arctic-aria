import { Check, Edit3, Flag, Info, Plus } from "lucide-react";
import { Button } from "@/components/button";
import { Card, CardHeader } from "@/components/card";
import { mutedTextClass } from "@/components/color";
import { List, ListItem } from "@/components/list";
import { Panel } from "@/components/panel";
import { Tag } from "@/components/tag";
import { cx } from "@/components/utils";
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
  onEditProject,
  onAddMilestone,
  onEditMilestone,
  onAddTask,
  onEditTask,
  onTaskStatus,
  onSubtaskToggle,
}: {
  darkMode: boolean;
  pending: boolean;
  project: ProjectView | null;
  onEditProject: (project: ProjectView) => void;
  onAddMilestone: (projectId: string) => void;
  onEditMilestone: (milestone: ProjectView["milestones"][number]) => void;
  onAddTask: (projectId: string, milestoneId: string) => void;
  onEditTask: (task: ProjectTaskView) => void;
  onTaskStatus: (
    taskId: string,
    status: Exclude<TaskStatus, "archived">,
  ) => void;
  onSubtaskToggle: (subtaskId: string, done: boolean) => void;
}) {
  if (!project) {
    return (
      <Panel darkMode={darkMode} className="min-h-[60vh]">
        <div className="px-4 py-4">
          <p className={`text-sm ${mutedTextClass(darkMode)}`}>
            Select a project to view milestones and tasks.
          </p>
        </div>
      </Panel>
    );
  }

  return (
    <section className="aa-split-container">
      <div className="aa-split-panel gap-4">
        <Card darkMode={darkMode} className="min-w-0">
          <CardHeader
            darkMode={darkMode}
            icon={<Flag size={18} aria-hidden="true" />}
            title="Milestones"
            description="Detailed tasks and subtasks grouped by project phase."
            action={
              <Button
                darkMode={darkMode}
                disabled={pending}
                icon={<Plus size={14} aria-hidden="true" />}
                onClick={() => onAddMilestone(project.id)}
              >
                New
              </Button>
            }
          />
          <List darkMode={darkMode}>
            {project.milestones.map((milestone) => (
              <ListItem key={milestone.id} darkMode={darkMode} layout="block">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold">
                        {milestone.title}
                      </h3>
                      <Tag darkMode={darkMode}>
                        {titleCase(milestone.status)}
                      </Tag>
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
                      onSubtaskToggle={onSubtaskToggle}
                    />
                  ))}
                  <Button
                    darkMode={darkMode}
                    size="xs"
                    className="justify-self-start"
                    disabled={pending}
                    icon={<Plus size={13} aria-hidden="true" />}
                    onClick={() => onAddTask(project.id, milestone.id)}
                  >
                    New task
                  </Button>
                </div>
              </ListItem>
            ))}
          </List>
        </Card>

        <aside className="grid content-start gap-4">
          <Card darkMode={darkMode}>
            <CardHeader
              darkMode={darkMode}
              icon={<Info size={18} aria-hidden="true" />}
              title="Overview"
              action={
                <Button
                  darkMode={darkMode}
                  disabled={pending}
                  icon={<Edit3 size={14} aria-hidden="true" />}
                  onClick={() => onEditProject(project)}
                >
                  Edit project
                </Button>
              }
            />
            <div className="grid gap-4 px-4 py-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold">{project.title}</h2>
                  <Tag darkMode={darkMode}>{titleCase(project.status)}</Tag>
                </div>
                <p
                  className={`mt-2 text-sm leading-6 ${mutedTextClass(darkMode)}`}
                >
                  {project.description}
                </p>
              </div>
              <dl className="grid gap-3 text-sm">
                <ProjectMetadataRow
                  darkMode={darkMode}
                  label="Priority"
                  value={titleCase(project.priority)}
                />
                <ProjectMetadataRow
                  darkMode={darkMode}
                  label="Started"
                  value={project.startDate}
                />
                <ProjectMetadataRow
                  darkMode={darkMode}
                  label="Timeline"
                  value={project.timelineText}
                />
              </dl>
            </div>
          </Card>
        </aside>
      </div>
    </section>
  );
}

function ProjectMetadataRow({
  darkMode,
  label,
  value,
}: {
  darkMode: boolean;
  label: string;
  value: string;
}) {
  return (
    <div className="grid gap-1">
      <dt className={`text-xs ${mutedTextClass(darkMode)}`}>{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}

function ProjectTaskRow({
  darkMode,
  pending,
  task,
  onEdit,
  onTaskStatus,
  onSubtaskToggle,
}: {
  darkMode: boolean;
  pending: boolean;
  task: ProjectTaskView;
  onEdit: () => void;
  onTaskStatus: (
    taskId: string,
    status: Exclude<TaskStatus, "archived">,
  ) => void;
  onSubtaskToggle: (subtaskId: string, done: boolean) => void;
}) {
  const subtasks = task.subtasks ?? [];

  return (
    <div
      className={cx(
        "rounded-md border px-3 py-3",
        darkMode ? "border-neutral-800 bg-black" : "border-slate-200 bg-white",
      )}
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
            disabled={pending || task.status === "done"}
            icon={<Check size={13} aria-hidden="true" />}
            onClick={() => onTaskStatus(task.id, "done")}
          >
            Done
          </Button>
          <Button
            darkMode={darkMode}
            size="xs"
            disabled={pending}
            onClick={onEdit}
          >
            Edit
          </Button>
        </div>
      </div>

      {subtasks.length > 0 ? (
        <div className="mt-3 grid gap-2">
          {subtasks.map((subtask) => (
            <label
              key={subtask.id}
              className={cx(
                "grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 rounded-md px-3 py-2 text-sm",
                darkMode
                  ? "bg-neutral-950 text-neutral-200"
                  : "bg-slate-50 text-slate-700",
              )}
            >
              <input
                className="mt-1 accent-emerald-500"
                type="checkbox"
                checked={subtask.isDone}
                disabled={pending}
                onChange={() => onSubtaskToggle(subtask.id, subtask.isDone)}
              />
              <span className="min-w-0">
                <span className="block font-semibold">{subtask.title}</span>
                <span className={`block text-xs ${mutedTextClass(darkMode)}`}>
                  {subtask.description || "No description."}
                </span>
              </span>
            </label>
          ))}
        </div>
      ) : null}
    </div>
  );
}
