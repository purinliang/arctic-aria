// Dashboard - Project Tasks Panel.
import { ListChecks } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import { CardHeader } from "@/components/card";
import { secondaryTextColorClass } from "@/components/color";
import { displayDescription } from "@/components/default-description";
import { formatDateKey } from "@/components/forms/date-format";
import { CheckboxControl } from "@/components/forms/selection-field";
import {
  List,
  ListItem,
  ListItemContent,
  ListItemTitleButton,
} from "@/components/list";
import { LoadingLine } from "@/components/loading";
import { Panel } from "@/components/panel";
import { DescriptionText, SupportingText } from "@/components/text";
import { dashboardTaskStatusForChecked } from "@/features/dashboard/optimistic-updates";
import { todayPanelItemLimit } from "@/features/dashboard/today-panel-display";
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
    status: TaskStatus,
  ) => void;
  onTaskOpen: (projectId: string) => void;
}) {
  const visibleTasks = tasks.slice(0, todayPanelItemLimit);

  return (
    <Panel darkMode={darkMode} className="min-w-0">
      <CardHeader
        icon={<ListChecks size={18} aria-hidden="true" />}
        title={messages.title}
        description={messages.description}
        darkMode={darkMode}
      />
      <List darkMode={darkMode}>
        {loading ? (
          <LoadingLine darkMode={darkMode} text={messages.loading} />
        ) : null}
        {!loading && tasks.length === 0 ? (
          <EmptyLine darkMode={darkMode} text={messages.empty} />
        ) : null}
        {visibleTasks.map((task) => (
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
  onTaskStatus: (status: TaskStatus) => void;
  onOpen: () => void;
}) {
  const deadline = deadlineText(task, messages, dateMessages);

  return (
    <ListItem darkMode={darkMode} className="items-start">
      <div className="grid min-w-0 w-full flex-1 grid-cols-[auto_minmax(0,1fr)] gap-3">
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
          title={
            <h3 className="min-w-0 text-base font-semibold">
              <ListItemTitleButton onClick={onOpen}>
                {task.title}
              </ListItemTitleButton>
            </h3>
          }
          main={
            <DescriptionText darkMode={darkMode} className="line-clamp-3">
              {displayDescription(
                task.description,
                task.title,
                messages.defaultDescriptions,
              )}
            </DescriptionText>
          }
          support={
            <TaskSupportText
              darkMode={darkMode}
              projectLabel={task.projectLabel}
              milestoneLabel={task.milestoneLabel}
              deadline={deadline}
            />
          }
        />
      </div>
    </ListItem>
  );
}

function TaskSupportText({
  darkMode,
  projectLabel,
  milestoneLabel,
  deadline,
}: {
  darkMode: boolean;
  projectLabel: string;
  milestoneLabel: string;
  deadline: string;
}) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const fullLineRef = useRef<HTMLSpanElement>(null);
  const [showMilestone, setShowMilestone] = useState(true);
  const fullSegments = [projectLabel, milestoneLabel, deadline].filter(Boolean);
  const compactSegments = [projectLabel, deadline].filter(Boolean);
  const visibleSegments =
    showMilestone || !milestoneLabel ? fullSegments : compactSegments;

  useLayoutEffect(() => {
    const container = containerRef.current;
    const fullLine = fullLineRef.current;

    if (!container || !fullLine || !milestoneLabel) {
      setShowMilestone(true);
      return;
    }

    const containerElement = container;
    const fullLineElement = fullLine;

    function updateMilestoneVisibility() {
      const nextShowMilestone =
        fullLineElement.scrollWidth <= Math.ceil(containerElement.clientWidth);

      setShowMilestone((current) =>
        current === nextShowMilestone ? current : nextShowMilestone,
      );
    }

    updateMilestoneVisibility();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateMilestoneVisibility);

      return () =>
        window.removeEventListener("resize", updateMilestoneVisibility);
    }

    const observer = new ResizeObserver(updateMilestoneVisibility);
    observer.observe(container);

    return () => observer.disconnect();
  }, [deadline, milestoneLabel, projectLabel]);

  return (
    <SupportingText darkMode={darkMode} className="relative block min-w-0">
      <span
        ref={containerRef}
        className="block min-w-0 truncate whitespace-nowrap"
      >
        {visibleSegments.join(" · ")}
      </span>
      {milestoneLabel ? (
        <span
          ref={fullLineRef}
          aria-hidden="true"
          className="invisible pointer-events-none absolute left-0 top-0 whitespace-nowrap"
        >
          {fullSegments.join(" · ")}
        </span>
      ) : null}
    </SupportingText>
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
