import { ClipboardList, Edit3, Flag, Info, Plus } from "lucide-react";
import { Button } from "@/components/button";
import { Card, CardHeader } from "@/components/card";
import { mutedTextClass } from "@/components/color";
import { CheckboxControl } from "@/components/forms/selection-field";
import { List, ListItem } from "@/components/list";
import { Panel } from "@/components/panel";
import { DescriptionText, LabelText, SupportingText } from "@/components/text";
import type {
  ProjectTaskView,
  ProjectView,
} from "@/features/projects/actions";
import type { TaskStatus } from "@/features/dashboard/types";

const overviewDateFormatter = new Intl.DateTimeFormat("en", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

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
            {project.tasks.length === 0 ? (
              <p className={`px-4 py-4 text-sm ${mutedTextClass(darkMode)}`}>
                No tasks yet. Add the next concrete task.
              </p>
            ) : null}
            {project.tasks.map((task) => (
              <ListItem key={task.id} darkMode={darkMode} layout="block">
                <ProjectTaskRow
                  darkMode={darkMode}
                  pending={pending}
                  task={task}
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
            />
            <div className="grid gap-4 px-4 py-4">
              <div className="grid gap-1">
                <LabelText darkMode={darkMode}>Description</LabelText>
                <DescriptionText darkMode={darkMode}>
                  {project.description}
                </DescriptionText>
              </div>
              <dl className="grid gap-3 text-sm">
                <ProjectMetadataRow
                  darkMode={darkMode}
                  label="Start date"
                  value={formatOverviewDate(project.startDate)}
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
              {project.milestones.length === 0 ? (
                <p className={`px-4 py-4 text-sm ${mutedTextClass(darkMode)}`}>
                  No milestones yet. Add one when the project needs a phase boundary.
                </p>
              ) : null}
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
      <dt>
        <LabelText darkMode={darkMode}>{label}</LabelText>
      </dt>
      <dd>
        <DescriptionText darkMode={darkMode}>{value}</DescriptionText>
      </dd>
    </div>
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
  const metadata = [task.milestoneLabel, deadlineText(task.deadline)]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="grid gap-3">
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3">
        <CheckboxControl
          darkMode={darkMode}
          className="mt-1"
          checked={task.status === "done"}
          aria-label={`Mark ${task.title} done`}
          onChange={(event) =>
            onTaskStatus(task.id, event.target.checked ? "done" : "todo")
          }
        />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold">{task.title}</span>
          </div>
          <DescriptionText darkMode={darkMode} className="mt-1">
            {task.description || "No description."}
          </DescriptionText>
          {metadata ? (
            <SupportingText darkMode={darkMode} className="mt-2 block">
              {metadata}
            </SupportingText>
          ) : null}
        </div>
        <Button
          darkMode={darkMode}
          size="xs"
          disabled={pending}
          icon={<Edit3 size={14} aria-hidden="true" />}
          onClick={onEdit}
        >
          Edit
        </Button>
      </div>
    </div>
  );
}

function deadlineText(deadline: string) {
  return deadline === "No deadline" ? deadline : `Deadline ${deadline}`;
}

function formatOverviewDate(date: string) {
  return date
    ? overviewDateFormatter.format(new Date(`${date}T00:00:00.000Z`))
    : "Not set";
}
