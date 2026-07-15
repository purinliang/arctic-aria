import { ClipboardList, Edit3, Flag, Info, Plus } from "lucide-react";
import { Button } from "@/components/button";
import { Card, CardHeader } from "@/components/card";
import { mutedTextClass } from "@/components/color";
import { List, ListItem } from "@/components/list";
import { Panel } from "@/components/panel";
import type {
  ProjectTaskView,
  ProjectView,
} from "@/features/projects/actions";
import type { TaskStatus } from "@/features/dashboard/types";

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
}: {
  darkMode: boolean;
  pending: boolean;
  project: ProjectView | null;
  onEditProject: (project: ProjectView) => void;
  onAddMilestone: (projectId: string) => void;
  onEditMilestone: (milestone: ProjectView["milestones"][number]) => void;
  onAddTask: (projectId: string) => void;
  onEditTask: (task: ProjectTaskView) => void;
  onTaskStatus: (
    taskId: string,
    status: Exclude<TaskStatus, "archived">,
  ) => void;
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

  const taskRows = project.milestones.flatMap((milestone) =>
    milestone.tasks.map((task) => ({
      task,
      milestoneTitle: milestone.title,
    })),
  ).sort(compareTaskRows);

  return (
    <section className="aa-split-container">
      <div className="aa-split-panel gap-4">
        <Card darkMode={darkMode} className="min-w-0">
          <CardHeader
            darkMode={darkMode}
            icon={<ClipboardList size={18} aria-hidden="true" />}
            title="Tasks"
            description="Concrete work items for this project."
            action={
              <Button
                darkMode={darkMode}
                disabled={pending}
                icon={<Plus size={14} aria-hidden="true" />}
                onClick={() => onAddTask(project.id)}
              >
                New
              </Button>
            }
          />
          <List darkMode={darkMode}>
            {taskRows.length === 0 ? (
              <p className={`px-4 py-4 text-sm ${mutedTextClass(darkMode)}`}>
                No tasks yet. Add the next concrete task.
              </p>
            ) : null}
            {taskRows.map(({ task, milestoneTitle }) => (
              <ListItem key={task.id} darkMode={darkMode} layout="block">
                <ProjectTaskRow
                  darkMode={darkMode}
                  pending={pending}
                  task={task}
                  milestoneTitle={milestoneTitle}
                  onEdit={() => onEditTask(task)}
                  onTaskStatus={onTaskStatus}
                />
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

          <Card darkMode={darkMode}>
            <CardHeader
              darkMode={darkMode}
              icon={<Flag size={18} aria-hidden="true" />}
              title="Milestones"
              description="Lightweight phase boundaries."
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
                <ListItem
                  key={milestone.id}
                  darkMode={darkMode}
                  className="items-center"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold">
                        {milestone.title}
                      </span>
                    </div>
                    <p className={`mt-1 text-sm ${mutedTextClass(darkMode)}`}>
                      {milestone.objective || milestone.progressText}
                    </p>
                  </div>
                  <Button
                    darkMode={darkMode}
                    size="xs"
                    disabled={pending}
                    icon={<Edit3 size={13} aria-hidden="true" />}
                    onClick={() => onEditMilestone(milestone)}
                  >
                    Edit
                  </Button>
                </ListItem>
              ))}
            </List>
          </Card>
        </aside>
      </div>
    </section>
  );
}

function compareTaskRows(
  left: { task: ProjectTaskView; milestoneTitle: string },
  right: { task: ProjectTaskView; milestoneTitle: string },
) {
  const leftStatusRank = left.task.status === "done" ? 1 : 0;
  const rightStatusRank = right.task.status === "done" ? 1 : 0;

  if (leftStatusRank !== rightStatusRank) {
    return leftStatusRank - rightStatusRank;
  }

  return (
    dateSortValue(left.task.deadlineDate) -
      dateSortValue(right.task.deadlineDate) ||
    dateSortValue(left.task.startDate) - dateSortValue(right.task.startDate)
  );
}

function dateSortValue(date: string) {
  return date ? Date.parse(date) : Number.POSITIVE_INFINITY;
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
  milestoneTitle,
  onEdit,
  onTaskStatus,
}: {
  darkMode: boolean;
  pending: boolean;
  task: ProjectTaskView;
  milestoneTitle: string;
  onEdit: () => void;
  onTaskStatus: (
    taskId: string,
    status: Exclude<TaskStatus, "archived">,
  ) => void;
}) {
  return (
    <div className="grid gap-3">
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3">
        <input
          className="mt-1 accent-emerald-500"
          type="checkbox"
          checked={task.status === "done"}
          disabled={pending}
          aria-label={`Mark ${task.title} done`}
          onChange={(event) =>
            onTaskStatus(task.id, event.target.checked ? "done" : "todo")
          }
        />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold">{task.title}</span>
          </div>
          <p className={`mt-1 text-sm ${mutedTextClass(darkMode)}`}>
            {milestoneTitle} · Deadline {task.deadline}
          </p>
        </div>
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
  );
}
