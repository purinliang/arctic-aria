// Projects Page - Project Detail Side Panels.
import { Edit3, Flag, FolderKanban, Settings2 } from "lucide-react";
import { Button } from "@/components/button";
import { Card, CardHeader } from "@/components/card";
import { secondaryTextColorClass } from "@/components/color";
import { displayDescription } from "@/components/default-description";
import { formatDateKey } from "@/components/forms/date-format";
import { HorizontalProgressBar } from "@/components/horizontal-progress-bar";
import {
  List,
  ListItem,
  ListItemSupportingText,
  ListItemTitle,
} from "@/components/list";
import { DescriptionText, SupportingText } from "@/components/text";
import { durationRangeForDays } from "@/features/projects/project-duration";
import { projectOverviewTimelineMetadata } from "@/features/projects/project-overview-metadata";
import type { ProjectView } from "@/features/projects/actions";
import type { ProjectMessages } from "@/messages/app-messages";
import type { DatePickerMessages } from "@/messages/form-messages";
import { cx } from "@/components/utils";

export type MilestoneChoice = {
  id: string;
  title: string;
  description: string;
  doneTaskCount: number;
  taskCount: number;
  milestone: ProjectView["milestones"][number] | null;
};

export type ProjectDetailSidePanelMessages = {
  detail: ProjectMessages["detail"];
  timeline: ProjectMessages["timeline"];
  duration: ProjectMessages["duration"];
  defaults: ProjectMessages["defaultDescriptions"];
  dates: DatePickerMessages;
};

export function ProjectOverviewPanel({
  darkMode,
  pending,
  project,
  messages,
  onEditProject,
}: {
  darkMode: boolean;
  pending: boolean;
  project: ProjectView;
  messages: ProjectDetailSidePanelMessages;
  onEditProject: (project: ProjectView) => void;
}) {
  const timelineMetadata = projectOverviewTimelineMetadata(
    project,
    {
      deadline: messages.detail.deadlineLabel,
      expectedDuration: messages.detail.expectedDuration,
      timeline: messages.detail.timeline,
      openEnded: messages.timeline.openEnded,
    },
    messages.duration,
    (value) => formatDate(value, messages.dates, ""),
  );
  const overviewObjective = displayDescription(
    project.description,
    project.title,
    messages.defaults.project,
  );
  const overviewTimeline = projectOverviewTimelineText(
    project,
    timelineMetadata.value,
    messages.dates,
  );
  const doneTasks = doneTaskCount(project);
  const taskProgress =
    project.tasks.length > 0 ? doneTasks / project.tasks.length : 0;
  const deadlineProgress = project.deadlineDate
    ? dateRangeProgress(project.startDate, project.deadlineDate)
    : null;

  return (
    <Card darkMode={darkMode}>
      <CardHeader
        darkMode={darkMode}
        icon={<FolderKanban size={18} aria-hidden="true" />}
        title={messages.detail.projectOverviewTitle}
        description={messages.detail.projectOverviewDescription}
        action={
          <Button
            darkMode={darkMode}
            disabled={pending}
            icon={<Edit3 size={15} aria-hidden="true" />}
            onClick={() => onEditProject(project)}
          >
            {messages.detail.edit}
          </Button>
        }
      />
      <div className="grid gap-2 px-4 py-4">
        <DescriptionText darkMode={darkMode}>
          {overviewObjective}
        </DescriptionText>
        <SupportingText darkMode={darkMode} className="truncate">
          {overviewTimeline}
        </SupportingText>
        <HorizontalProgressBar
          primary={taskProgress}
          secondary={deadlineProgress}
          ariaLabel={progressAriaLabel(taskProgress, deadlineProgress)}
        />
      </div>
    </Card>
  );
}

export function ProjectProgressPanel({
  darkMode,
  project,
  messages,
}: {
  darkMode: boolean;
  project: ProjectView;
  messages: ProjectDetailSidePanelMessages;
}) {
  const doneTasks = doneTaskCount(project);
  const taskProgress =
    project.tasks.length > 0 ? doneTasks / project.tasks.length : 0;
  const deadlineProgress = project.deadlineDate
    ? dateRangeProgress(project.startDate, project.deadlineDate)
    : null;
  const overviewObjective = displayDescription(
    project.description,
    project.title,
    messages.defaults.project,
  );
  const timelineMetadata = projectOverviewTimelineMetadata(
    project,
    {
      deadline: messages.detail.deadlineLabel,
      expectedDuration: messages.detail.expectedDuration,
      timeline: messages.detail.timeline,
      openEnded: messages.timeline.openEnded,
    },
    messages.duration,
    (value) => formatDate(value, messages.dates, ""),
  );
  const overviewTimeline = projectOverviewTimelineText(
    project,
    timelineMetadata.value,
    messages.dates,
  );
  const milestoneMarkers = projectMilestoneProgressMarkers(project);

  return (
    <Card darkMode={darkMode}>
      <CardHeader
        darkMode={darkMode}
        icon={<FolderKanban size={18} aria-hidden="true" />}
        title={messages.detail.projectOverviewTitle}
        description={messages.detail.projectOverviewDescription}
      />
      <div className="grid gap-3 px-4 py-4">
        <DescriptionText darkMode={darkMode}>
          {overviewObjective}
        </DescriptionText>
        <SupportingText darkMode={darkMode} className="truncate">
          {overviewTimeline}
        </SupportingText>
        <div className="grid gap-2">
          <div className="relative pt-1">
            <HorizontalProgressBar
              primary={taskProgress}
              secondary={deadlineProgress}
              className="h-2"
              ariaLabel={progressAriaLabel(taskProgress, deadlineProgress)}
            />
            {milestoneMarkers.map((marker) => (
              <button
                key={marker.id}
                className="group absolute top-0 h-4 w-3 -translate-x-1/2 cursor-default rounded-sm outline-none"
                style={{ left: `${marker.percent}%` }}
                type="button"
                aria-label={marker.title}
              >
                <span className="mx-auto block h-4 w-px rounded-full bg-[var(--aa-primary-text)]" />
                <span
                  className={cx(
                    "pointer-events-none absolute top-5 z-10 hidden max-w-[10rem] truncate rounded-sm border bg-[var(--aa-panel-bg)] px-2 py-1 text-xs font-semibold text-[var(--aa-primary-text)] shadow-md group-hover:block group-focus-visible:block",
                    marker.percent <= 8
                      ? "left-0"
                      : marker.percent >= 92
                        ? "right-0"
                        : "left-1/2 -translate-x-1/2",
                  )}
                >
                  {marker.title}
                </span>
              </button>
            ))}
          </div>
        </div>
        <SupportingText darkMode={darkMode} className="truncate">
          {messages.timeline.progress(doneTasks, project.tasks.length)}
        </SupportingText>
      </div>
    </Card>
  );
}

export function MilestoneSwitchPanel({
  darkMode,
  pending,
  choices,
  selectedMilestoneId,
  messages,
  onManageMilestones,
  onSelectMilestone,
}: {
  darkMode: boolean;
  pending: boolean;
  choices: MilestoneChoice[];
  selectedMilestoneId: string | null;
  messages: ProjectDetailSidePanelMessages;
  onManageMilestones: () => void;
  onSelectMilestone: (milestoneId: string) => void;
}) {
  return (
    <Card darkMode={darkMode}>
      <CardHeader
        darkMode={darkMode}
        icon={<Flag size={18} aria-hidden="true" />}
        title={messages.detail.milestonesTitle}
        description={messages.detail.milestonesDescription}
        action={
          <Button
            darkMode={darkMode}
            disabled={pending}
            icon={<Settings2 size={14} aria-hidden="true" />}
            onClick={onManageMilestones}
          >
            {messages.detail.manage}
          </Button>
        }
      />
      <List darkMode={darkMode}>
        {choices.length === 0 ? (
          <p className={`px-4 py-4 text-sm ${secondaryTextColorClass}`}>
            {messages.detail.noMilestones}
          </p>
        ) : null}
        {choices.map((choice) => (
          <ListItem
            key={choice.id || "no-milestone"}
            darkMode={darkMode}
            selected={choice.id === selectedMilestoneId}
            layout="block"
            className="p-0"
          >
            <button
              className="grid h-9 w-full min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-left"
              type="button"
              title={choice.title}
              onClick={() => onSelectMilestone(choice.id)}
            >
              <ListItemTitle
                truncate
                className={
                  choice.id === selectedMilestoneId
                    ? "font-medium text-[var(--aa-primary-button-text)]"
                    : `font-medium ${secondaryTextColorClass}`
                }
              >
                {choice.title}
              </ListItemTitle>
              <ListItemSupportingText
                tone={choice.id === selectedMilestoneId ? "selected" : "default"}
                className="shrink-0"
              >
                {compactProgressText(choice, messages.detail)}
              </ListItemSupportingText>
            </button>
          </ListItem>
        ))}
      </List>
    </Card>
  );
}

function timelineMessageInput(messages: ProjectDetailSidePanelMessages) {
  return {
    deadline: messages.detail.deadlineLabel,
    expectedDuration: messages.detail.expectedDuration,
    timeline: messages.detail.timeline,
    openEnded: messages.timeline.openEnded,
  };
}

function formatDate(
  value: string,
  messages: DatePickerMessages,
  fallback: string,
) {
  return formatDateKey(value, messages, value || fallback);
}

function compactProgressText(
  choice: MilestoneChoice,
  messages: ProjectMessages["detail"],
) {
  return choice.taskCount > 0
    ? `${choice.doneTaskCount}/${choice.taskCount}`
    : messages.noTasksShort;
}

function milestoneTimelineText(
  milestone: ProjectView["milestones"][number],
  messages: ProjectDetailSidePanelMessages,
) {
  const metadata = projectOverviewTimelineMetadata(
    {
      deadlineDate: milestone.deadlineDate,
      expectedDurationDays: milestone.expectedDurationDays,
      durationRange: durationRangeForDays(
        Number(milestone.expectedDurationDays),
      ),
    },
    timelineMessageInput(messages),
    messages.duration,
    (value) => formatDate(value, messages.dates, messages.detail.notSet),
  );

  if (metadata.label === messages.detail.deadlineLabel) {
    return messages.timeline.due(metadata.value);
  }

  if (metadata.label === messages.detail.expectedDuration) {
    return messages.timeline.expected(metadata.value);
  }

  return metadata.value;
}

export function milestoneMetadataText(
  milestone: ProjectView["milestones"][number],
  objective: string,
  messages: ProjectDetailSidePanelMessages,
) {
  return [milestoneTimelineText(milestone, messages), objective].join(" · ");
}

function projectOverviewTimelineText(
  project: ProjectView,
  timelineText: string,
  messages: DatePickerMessages,
) {
  const startText = formatDate(project.startDate, messages, project.startDate);

  if (project.deadlineDate) {
    return `${startText} - ${formatDate(project.deadlineDate, messages, project.deadlineDate)}`;
  }

  return `${startText} · ${timelineText}`;
}

function doneTaskCount(project: ProjectView) {
  return project.tasks.filter((task) => task.status === "done").length;
}

function dateRangeProgress(startDate: string, deadlineDate: string) {
  const startDay = dateKeyToUtcDay(startDate);
  const deadlineDay = dateKeyToUtcDay(deadlineDate);

  if (startDay === null || deadlineDay === null) {
    return null;
  }

  const today = localTodayToUtcDay();

  if (deadlineDay <= startDay) {
    return today >= deadlineDay ? 1 : 0;
  }

  return (today - startDay) / (deadlineDay - startDay);
}

function projectMilestoneProgressMarkers(project: ProjectView) {
  const projectStart = dateKeyToUtcDay(project.startDate);
  const projectEnd = project.deadlineDate
    ? dateKeyToUtcDay(project.deadlineDate)
    : null;

  return project.milestones
    .map((milestone, index) => {
      const progress =
        projectStart !== null && projectEnd !== null && milestone.deadlineDate
          ? positionInRange(
              projectStart,
              projectEnd,
              dateKeyToUtcDay(milestone.deadlineDate),
            )
          : project.milestones.length > 1
            ? index / (project.milestones.length - 1)
            : 0.5;

      return {
        id: milestone.id,
        percent: Math.round(clampFraction(progress) * 100),
        title: milestone.title,
      };
    })
    .sort(
      (left, right) =>
        left.percent - right.percent || left.title.localeCompare(right.title),
    );
}

function positionInRange(
  startDay: number,
  endDay: number,
  valueDay: number | null,
) {
  if (valueDay === null) {
    return 1;
  }

  if (endDay <= startDay) {
    return valueDay >= endDay ? 1 : 0;
  }

  return (valueDay - startDay) / (endDay - startDay);
}

function dateKeyToUtcDay(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  const timestamp = Date.UTC(year, monthIndex, day);
  const parsed = new Date(timestamp);

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== monthIndex ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }

  return timestamp;
}

function localTodayToUtcDay(date = new Date()) {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
}

function progressAriaLabel(primary: number, secondary: number | null) {
  const taskText = `${Math.round(clampFraction(primary) * 100)}% tasks complete`;

  if (secondary === null) {
    return taskText;
  }

  return `${taskText}; ${Math.round(clampFraction(secondary) * 100)}% timeline elapsed`;
}

function clampFraction(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(1, value));
}
