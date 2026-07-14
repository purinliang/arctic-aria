import { Check, Edit3, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mutedTextClass, sectionBorderClass } from "@/components/ui/color";
import { SelectInput } from "@/components/ui/input-field";
import { List, ListItem } from "@/components/ui/list";
import { Panel } from "@/components/ui/panel";
import { Tag } from "@/components/ui/tag";
import { cx } from "@/components/ui/utils";
import type {
  ProjectTaskView,
  ProjectView,
} from "@/features/projects/actions";
import type { TaskStatus } from "@/features/dashboard/types";
import { titleCase } from "./project-page-helpers";

export function ProjectDetailPage({
  darkMode,
  pending,
  projects,
  project,
  onBackToList,
  onSelectProject,
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
  projects: ProjectView[];
  project: ProjectView | null;
  onBackToList: () => void;
  onSelectProject: (projectId: string) => void;
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
          <Button darkMode={darkMode} size="xs" onClick={onBackToList}>
            Projects
          </Button>
          <p className={`mt-3 text-sm ${mutedTextClass(darkMode)}`}>
            Select a project to view milestones and tasks.
          </p>
        </div>
      </Panel>
    );
  }

  return (
    <Panel darkMode={darkMode} className="min-h-[60vh]">
      <section className="grid gap-4">
        <nav
          className={cx(
            "flex flex-wrap items-center gap-2 border-b px-4 py-3",
            sectionBorderClass(darkMode),
          )}
          aria-label="Project breadcrumb"
        >
          <Button
            darkMode={darkMode}
            size="xs"
            tone="ghost"
            onClick={onBackToList}
          >
            Projects
          </Button>
          <span className={`text-sm ${mutedTextClass(darkMode)}`}>/</span>
          <label className="sr-only" htmlFor="project-switcher">
            Current project
          </label>
          <SelectInput
            id="project-switcher"
            darkMode={darkMode}
            className="h-9 min-w-[min(260px,100%)] font-semibold"
            value={project.id}
            onChange={(event) => onSelectProject(event.target.value)}
          >
            {projects.map((projectOption) => (
              <option key={projectOption.id} value={projectOption.id}>
                {projectOption.title}
              </option>
            ))}
          </SelectInput>
        </nav>

        <div className="grid gap-4 px-4 pb-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold">{project.title}</h2>
              <Tag darkMode={darkMode}>{titleCase(project.status)}</Tag>
            </div>
            <p className={`mt-2 text-sm leading-6 ${mutedTextClass(darkMode)}`}>
              {project.description}
            </p>
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
              icon={<Edit3 size={14} aria-hidden="true" />}
              onClick={() => onEditProject(project)}
            >
              Edit project
            </Button>
            <Button
              darkMode={darkMode}
              disabled={pending}
              icon={<Plus size={14} aria-hidden="true" />}
              onClick={() => onAddMilestone(project.id)}
            >
              Add milestone
            </Button>
          </div>

          <List darkMode={darkMode}>
            {project.milestones.map((milestone) => (
              <ListItem key={milestone.id} darkMode={darkMode} layout="block">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold">
                        {milestone.title}
                      </h3>
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
                      onSubtaskToggle={onSubtaskToggle}
                    />
                  ))}
                </div>
              </ListItem>
            ))}
          </List>
        </div>
      </section>
    </Panel>
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
