// Dashboard - Project Tasks Panel.
import { ChevronRight, ListChecks } from "lucide-react";
import { Button } from "@/components/button";
import { CardHeader } from "@/components/card";
import { secondaryTextColorClass } from "@/components/color";
import { displayDescription } from "@/components/default-description";
import { formatDateKey } from "@/components/forms/date-format";
import { CheckboxControl } from "@/components/forms/selection-field";
import { List, ListItem, ListItemContent } from "@/components/list";
import { LoadingLine } from "@/components/loading";
import { Panel } from "@/components/panel";
import { DescriptionText, SupportingText } from "@/components/text";
import { dashboardTaskStatusForChecked } from "@/features/dashboard/optimistic-updates";
import type { Task, TaskStatus } from "@/features/dashboard/types";
import type { DashboardMessages } from "@/messages/app-messages";
import type { DatePickerMessages } from "@/messages/form-messages";

export function ProjectTasksPanel({
  darkMode,
  tasks,
  loading,
  messages,
  dateMessages,
  onTaskStatus,
  onTaskOpen,
}: {
  darkMode: boolean;
  tasks: Task[];
  loading: boolean;
  messages: DashboardMessages["projectTasks"];
  dateMessages: DatePickerMessages;
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
        title={messages.title}
        darkMode={darkMode}
      />
      <List darkMode={darkMode}>
        {loading ? (
          <LoadingLine darkMode={darkMode} text={messages.loading} />
        ) : null}
        {!loading && tasks.length === 0 ? (
          <EmptyLine darkMode={darkMode} text={messages.empty} />
        ) : null}
        {tasks.map((task) => (
          <ProjectTaskRow
            key={task.id}
            task={task}
            darkMode={darkMode}
            messages={messages}
            dateMessages={dateMessages}
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
  messages,
  dateMessages,
  onTaskStatus,
  onOpen,
}: {
  task: Task;
  darkMode: boolean;
  messages: DashboardMessages["projectTasks"];
  dateMessages: DatePickerMessages;
  onTaskStatus: (status: Exclude<TaskStatus, "archived">) => void;
  onOpen: () => void;
}) {
  const metadata = [
    task.projectLabel,
    task.milestoneLabel,
    deadlineText(task, messages, dateMessages),
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
          aria-label={messages.markDone(task.title)}
          onChange={(event) =>
            onTaskStatus(dashboardTaskStatusForChecked(event.target.checked))
          }
        />
        <ListItemContent
          grow={false}
          title={<h3 className="min-w-0 text-base font-semibold">{task.title}</h3>}
          main={
            <DescriptionText darkMode={darkMode}>
              {displayDescription(
                task.description,
                task.title,
                messages.defaultDescriptions,
              )}
            </DescriptionText>
          }
          support={<SupportingText darkMode={darkMode}>{metadata}</SupportingText>}
        />
      </div>
      <Button
        darkMode={darkMode}
        tone="ghost"
        size="icon-sm"
        aria-label={messages.openProject(task.title)}
        icon={<ChevronRight size={16} aria-hidden="true" />}
        onClick={onOpen}
      />
    </ListItem>
  );
}

function deadlineText(
  task: Task,
  messages: DashboardMessages["projectTasks"],
  dateMessages: DatePickerMessages,
) {
  return task.deadlineDate
    ? messages.deadline(formatDate(task.deadlineDate, dateMessages))
    : messages.noDeadline;
}

function formatDate(value: string, messages: DatePickerMessages) {
  return formatDateKey(value, messages);
}

function EmptyLine({ text }: { darkMode: boolean; text: string }) {
  return (
    <p className={`px-4 py-4 text-sm ${secondaryTextColorClass}`}>
      {text}
    </p>
  );
}
