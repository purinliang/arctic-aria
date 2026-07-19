// Projects Page - Project Detail Page.
import { Edit3, Flag, Info, ListChecks, Plus } from "lucide-react";
import { Button } from "@/components/button";
import { Card, CardHeader } from "@/components/card";
import { secondaryTextColorClass } from "@/components/color";
import { displayDescription } from "@/components/default-description";
import { formatDateKey } from "@/components/forms/date-format";
import { CheckboxControl } from "@/components/forms/selection-field";
import { List, ListItem, ListItemContent } from "@/components/list";
import { Panel } from "@/components/panel";
import { DescriptionText, LabelText, SupportingText } from "@/components/text";
import type {
  ProjectTaskView,
  ProjectView,
} from "@/features/projects/actions";
import type { TaskStatus } from "@/features/dashboard/types";
import { projectOverviewTimelineMetadata } from "@/features/projects/project-overview-metadata";
import type { ProjectMessages } from "@/messages/app-messages";
import type { DatePickerMessages } from "@/messages/form-messages";

export function ProjectDetailPage({
  darkMode,
  pending,
  project,
  messages,
  timelineMessages,
  durationMessages,
  defaultDescriptions,
  dateMessages,
  onAddMilestone,
  onEditMilestone,
  onAddTask,
  onEditTask,
  onTaskStatus,
}: {
  darkMode: boolean;
  pending: boolean;
  project: ProjectView | null;
  messages: ProjectMessages["detail"];
  timelineMessages: ProjectMessages["timeline"];
  durationMessages: ProjectMessages["duration"];
  defaultDescriptions: ProjectMessages["defaultDescriptions"];
  dateMessages: DatePickerMessages;
  onAddMilestone: (projectId: string) => void;
  onEditMilestone: (milestone: ProjectView["milestones"][number]) => void;
  onAddTask: (projectId: string) => void;
  onEditTask: (task: ProjectTaskView) => void;
  onTaskStatus: (
    taskId: string,
    status: TaskStatus,
  ) => void;
}) {
  if (!project) {
    return (
      <Panel darkMode={darkMode} className="min-h-[60vh]">
        <div className="px-4 py-4">
          <p className={`text-sm ${secondaryTextColorClass}`}>
            {messages.selectProject}
          </p>
        </div>
      </Panel>
    );
  }

  const timelineMetadata = projectOverviewTimelineMetadata(
    project,
    {
      deadline: messages.deadlineLabel,
      expectedDuration: messages.expectedDuration,
      timeline: messages.timeline,
      openEnded: timelineMessages.openEnded,
    },
    durationMessages,
    (value) => formatDate(value, dateMessages, messages.notSet),
  );

  return (
    <section className="aa-split-container">
      <div className="aa-split-panel gap-4">
        <Card darkMode={darkMode} className="min-w-0">
          <CardHeader
            darkMode={darkMode}
            icon={<ListChecks size={18} aria-hidden="true" />}
            title={messages.tasksTitle}
            description={messages.tasksDescription}
            action={
              <Button
                darkMode={darkMode}
                disabled={pending}
                icon={<Plus size={14} aria-hidden="true" />}
                onClick={() => onAddTask(project.id)}
              >
                {messages.new}
              </Button>
            }
          />
          <List darkMode={darkMode}>
            {project.tasks.length === 0 ? (
              <p className={`px-4 py-4 text-sm ${secondaryTextColorClass}`}>
                {messages.noTasks}
              </p>
            ) : null}
            {project.tasks.map((task) => (
              <ListItem key={task.id} darkMode={darkMode} layout="block">
                <ProjectTaskRow
                  darkMode={darkMode}
                  pending={pending}
                  task={task}
            messages={messages}
            defaultDescriptions={defaultDescriptions}
            dateMessages={dateMessages}
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
              title={messages.overviewTitle}
            />
            <div className="grid min-w-0 gap-4 px-4 py-4">
              <div className="grid min-w-0 gap-1">
                <LabelText darkMode={darkMode}>{messages.description}</LabelText>
                <DescriptionText darkMode={darkMode}>
                  {displayDescription(
                    project.description,
                    project.title,
                    defaultDescriptions.project,
                  )}
                </DescriptionText>
              </div>
              <dl className="grid min-w-0 gap-3 text-sm">
                <ProjectMetadataRow
                  darkMode={darkMode}
                  label={messages.startDate}
                  value={formatDate(project.startDate, dateMessages, messages.notSet)}
                />
                <ProjectMetadataRow
                  darkMode={darkMode}
                  label={timelineMetadata.label}
                  value={timelineMetadata.value}
                />
              </dl>
            </div>
          </Card>

          <Card darkMode={darkMode}>
            <CardHeader
              darkMode={darkMode}
              icon={<Flag size={18} aria-hidden="true" />}
              title={messages.milestonesTitle}
              description={messages.milestonesDescription}
              action={
                <Button
                  darkMode={darkMode}
                  disabled={pending}
                  icon={<Plus size={14} aria-hidden="true" />}
                  onClick={() => onAddMilestone(project.id)}
                >
                  {messages.new}
                </Button>
              }
            />
            <List darkMode={darkMode}>
              {project.milestones.length === 0 ? (
                <p className={`px-4 py-4 text-sm ${secondaryTextColorClass}`}>
                  {messages.noMilestones}
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
                    <p className={`mt-1 text-sm ${secondaryTextColorClass}`}>
                      {displayDescription(
                        milestone.objective,
                        milestone.title,
                        defaultDescriptions.milestone,
                      )}
                    </p>
                  </div>
                  <Button
                    darkMode={darkMode}
                    disabled={pending}
                    icon={<Edit3 size={15} aria-hidden="true" />}
                    onClick={() => onEditMilestone(milestone)}
                  >
                    {messages.edit}
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
    <div className="grid min-w-0 gap-1">
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
  messages,
  defaultDescriptions,
  dateMessages,
  onEdit,
  onTaskStatus,
}: {
  darkMode: boolean;
  pending: boolean;
  task: ProjectTaskView;
  messages: ProjectMessages["detail"];
  defaultDescriptions: ProjectMessages["defaultDescriptions"];
  dateMessages: DatePickerMessages;
  onEdit: () => void;
  onTaskStatus: (
    taskId: string,
    status: TaskStatus,
  ) => void;
}) {
  const metadata = [task.milestoneLabel, deadlineText(task, messages, dateMessages)]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="grid gap-3">
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3">
        <CheckboxControl
          darkMode={darkMode}
          className="mt-1"
          checked={task.status === "done"}
          aria-label={messages.markDone(task.title)}
          onChange={(event) =>
            onTaskStatus(task.id, event.target.checked ? "done" : "todo")
          }
        />
        <ListItemContent
          grow={false}
          title={
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold">{task.title}</span>
            </div>
          }
          main={
            <DescriptionText darkMode={darkMode}>
              {displayDescription(
                task.description,
                task.title,
                defaultDescriptions.task,
              )}
            </DescriptionText>
          }
          support={
            metadata ? (
              <SupportingText darkMode={darkMode}>{metadata}</SupportingText>
            ) : null
          }
        />
        <Button
          darkMode={darkMode}
          disabled={pending}
          icon={<Edit3 size={15} aria-hidden="true" />}
          onClick={onEdit}
        >
          {messages.edit}
        </Button>
      </div>
    </div>
  );
}

function deadlineText(
  task: ProjectTaskView,
  messages: ProjectMessages["detail"],
  dateMessages: DatePickerMessages,
) {
  return task.deadlineDate
    ? messages.deadline(formatDate(task.deadlineDate, dateMessages, task.deadline))
    : messages.noDeadline;
}

function formatDate(
  value: string,
  messages: DatePickerMessages,
  fallback: string,
) {
  return formatDateKey(value, messages, value || fallback);
}
