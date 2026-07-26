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
      <div className="grid gap-3 px-4 py-4">
        <DescriptionText darkMode={darkMode}>
          {overviewObjective}
        </DescriptionText>
        <SupportingText darkMode={darkMode} className="truncate">
          {overviewTimeline}
        </SupportingText>
        <HorizontalProgressBar
          primary={taskProgress}
          secondary={deadlineProgress}
          className="h-2"
          ariaLabel={progressAriaLabel(taskProgress, deadlineProgress)}
        />
        <SupportingText darkMode={darkMode} className="truncate">
          {messages.timeline.progress(doneTasks, project.tasks.length)}
        </SupportingText>
      </div>
    </Card>
  );
}

export function MilestoneOverviewPanel({
  darkMode,
  pending,
  choice,
  messages,
  onEditMilestone,
}: {
  darkMode: boolean;
  pending: boolean;
  choice: MilestoneChoice;
  messages: ProjectDetailSidePanelMessages;
  onEditMilestone: (milestone: ProjectView["milestones"][number]) => void;
}) {
  const milestone = choice.milestone;
  const taskProgress =
    choice.taskCount > 0 ? choice.doneTaskCount / choice.taskCount : 0;
  const deadlineProgress = milestone?.deadlineDate
    ? dateRangeProgress(milestone.startDate, milestone.deadlineDate)
    : null;

  return (
    <Card darkMode={darkMode}>
      <CardHeader
        darkMode={darkMode}
        icon={<Flag size={18} aria-hidden="true" />}
        title={messages.detail.milestoneOverviewTitle}
        description={messages.detail.milestoneOverviewDescription}
        action={
          milestone ? (
            <Button
              darkMode={darkMode}
              disabled={pending}
              icon={<Edit3 size={15} aria-hidden="true" />}
              onClick={() => onEditMilestone(milestone)}
            >
              {messages.detail.edit}
            </Button>
          ) : undefined
        }
      />
      <div className="grid gap-3 px-4 py-4">
        <DescriptionText darkMode={darkMode}>{choice.description}</DescriptionText>
        {milestone ? (
          <SupportingText darkMode={darkMode} className="truncate">
            {milestoneOverviewTimelineText(milestone, messages)}
          </SupportingText>
        ) : null}
        <HorizontalProgressBar
          primary={taskProgress}
          secondary={deadlineProgress}
          className="h-2"
          ariaLabel={progressAriaLabel(taskProgress, deadlineProgress)}
        />
        <SupportingText darkMode={darkMode} className="truncate">
          {messages.timeline.progress(choice.doneTaskCount, choice.taskCount)}
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

function milestoneOverviewTimelineText(
  milestone: ProjectView["milestones"][number],
  messages: ProjectDetailSidePanelMessages,
) {
  const timelineText = milestoneTimelineText(milestone, messages);
  const startText = formatDate(
    milestone.startDate,
    messages.dates,
    milestone.startDate,
  );

  if (milestone.deadlineDate) {
    return `${startText} - ${formatDate(
      milestone.deadlineDate,
      messages.dates,
      milestone.deadlineDate,
    )}`;
  }

  return `${startText} · ${timelineText}`;
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
