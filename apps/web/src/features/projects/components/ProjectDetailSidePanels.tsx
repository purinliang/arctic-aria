// Projects Page - Project Detail Side Panels.
import { Flag, Settings2 } from "lucide-react";
import { Button } from "@/components/button";
import { Card, CardHeader } from "@/components/card";
import { secondaryTextColorClass } from "@/components/color";
import { formatDateKey } from "@/components/forms/date-format";
import { List, ListItem } from "@/components/list";
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

type SidePanelMessages = {
  detail: ProjectMessages["detail"];
  timeline: ProjectMessages["timeline"];
  duration: ProjectMessages["duration"];
  defaults: ProjectMessages["defaultDescriptions"];
  dates: DatePickerMessages;
};

export function MilestoneOverviewPanel({
  darkMode,
  choice,
  messages,
}: {
  darkMode: boolean;
  choice: MilestoneChoice | null;
  messages: SidePanelMessages;
}) {
  const selectedMilestone = choice?.milestone ?? null;
  const supportText = choice
    ? selectedMilestone
      ? milestoneTimelineText(selectedMilestone, messages)
      : messages.detail.noMilestoneDescription
    : "";

  return (
    <section className="grid min-w-0 gap-2 px-1 pb-1">
      {choice ? (
        <div className="grid min-w-0 gap-1">
          <h2 className="min-w-0 truncate text-xl font-semibold leading-7 text-[var(--aa-primary-text)] sm:text-2xl sm:leading-8">
            {choice.title}
          </h2>
          <DescriptionText darkMode={darkMode} className="line-clamp-2">
            {choice.description}
          </DescriptionText>
          <SupportingText darkMode={darkMode} className="truncate">
            {supportText}
          </SupportingText>
        </div>
      ) : (
        <DescriptionText darkMode={darkMode}>
          {messages.detail.noMilestones}
        </DescriptionText>
      )}
    </section>
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
  messages: SidePanelMessages;
  onManageMilestones: () => void;
  onSelectMilestone: (milestoneId: string) => void;
}) {
  return (
    <Card darkMode={darkMode}>
      <CardHeader
        darkMode={darkMode}
        icon={<Flag size={18} aria-hidden="true" />}
        title={messages.detail.milestonesTitle}
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
              <span
                className={
                  choice.id === selectedMilestoneId
                    ? "block min-w-0 truncate text-sm font-semibold text-[var(--aa-primary-button-text)]"
                    : `block min-w-0 truncate text-sm font-semibold ${secondaryTextColorClass}`
                }
              >
                {choice.title}
              </span>
              {compactProgressText(choice) ? (
                <span
                  className={
                    choice.id === selectedMilestoneId
                      ? "shrink-0 text-xs leading-5 text-[var(--aa-primary-button-text)]"
                      : `shrink-0 text-xs leading-5 ${secondaryTextColorClass}`
                  }
                >
                  {compactProgressText(choice)}
                </span>
              ) : null}
            </button>
          </ListItem>
        ))}
      </List>
    </Card>
  );
}

function timelineMessageInput(messages: SidePanelMessages) {
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

function compactProgressText(choice: MilestoneChoice) {
  return choice.taskCount > 0 ? `${choice.doneTaskCount}/${choice.taskCount}` : "";
}

function milestoneTimelineText(
  milestone: ProjectView["milestones"][number],
  messages: SidePanelMessages,
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
