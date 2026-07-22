// Projects Page - Project Detail Tasks Panel.
import { Edit3, ListChecks, Plus } from "lucide-react";
import { Button } from "@/components/button";
import { Card, CardHeader } from "@/components/card";
import { secondaryTextColorClass } from "@/components/color";
import { displayDescription } from "@/components/default-description";
import { formatDateKey } from "@/components/forms/date-format";
import { CheckboxControl } from "@/components/forms/selection-field";
import {
  List,
  ListItem,
  ListItemActions,
  ListItemContent,
  ListItemDescription,
  ListItemSupportingText,
  ListItemTitle,
} from "@/components/list";
import type { TaskStatus } from "@/features/dashboard/types";
import type { ProjectTaskView } from "@/features/projects/actions";
import type { ProjectMessages } from "@/messages/app-messages";
import type { DatePickerMessages } from "@/messages/form-messages";

export function ProjectDetailTasksPanel({
  darkMode,
  pending,
  tasks,
  messages,
  defaultDescriptions,
  dateMessages,
  onAddTask,
  onEditTask,
  onTaskStatus,
}: {
  darkMode: boolean;
  pending: boolean;
  tasks: ProjectTaskView[];
  messages: ProjectMessages["detail"];
  defaultDescriptions: ProjectMessages["defaultDescriptions"];
  dateMessages: DatePickerMessages;
  onAddTask: () => void;
  onEditTask: (task: ProjectTaskView) => void;
  onTaskStatus: (
    taskId: string,
    status: TaskStatus,
  ) => void;
}) {
  return (
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
            onClick={onAddTask}
          >
            {messages.new}
          </Button>
        }
      />
      <List darkMode={darkMode}>
        {tasks.length === 0 ? (
          <p className={`px-4 py-4 text-sm ${secondaryTextColorClass}`}>
            {messages.noTasks}
          </p>
        ) : null}
        {tasks.map((task) => (
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
  );
}

export function compareDetailTasks(
  left: ProjectTaskView,
  right: ProjectTaskView,
) {
  return (
    dateSortValue(left.deadlineDate) - dateSortValue(right.deadlineDate) ||
    dateSortValue(left.startDate) - dateSortValue(right.startDate) ||
    left.title.localeCompare(right.title)
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
  const metadata = deadlineText(task, messages, dateMessages);

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
          title={<ListItemTitle>{task.title}</ListItemTitle>}
          main={
            <ListItemDescription>
              {displayDescription(
                task.description,
                task.title,
                defaultDescriptions.task,
              )}
            </ListItemDescription>
          }
          support={
            metadata ? (
              <ListItemSupportingText>{metadata}</ListItemSupportingText>
            ) : null
          }
        />
        <ListItemActions>
          <Button
            darkMode={darkMode}
            disabled={pending}
            icon={<Edit3 size={15} aria-hidden="true" />}
            onClick={onEdit}
          >
            {messages.edit}
          </Button>
        </ListItemActions>
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
    ? messages.due(formatDateKey(task.deadlineDate, dateMessages))
    : messages.noDeadline;
}

function dateSortValue(date: string) {
  return date ? Date.parse(`${date}T00:00:00.000Z`) : Number.POSITIVE_INFINITY;
}
