// Projects Page - Project Detail Side Panels.
import { Edit3, Flag, Info, Plus } from "lucide-react";
import { Button } from "@/components/button";
import { Card, CardHeader } from "@/components/card";
import { secondaryTextColorClass } from "@/components/color";
import { displayDescription } from "@/components/default-description";
import { formatDateKey } from "@/components/forms/date-format";
import { List, ListItem } from "@/components/list";
import { DescriptionText, LabelText } from "@/components/text";
import { durationRangeForDays } from "@/features/projects/project-duration";
import { projectOverviewTimelineMetadata } from "@/features/projects/project-overview-metadata";
import type { ProjectView } from "@/features/projects/actions";
import type { ProjectMessages } from "@/messages/app-messages";
import type { DatePickerMessages } from "@/messages/form-messages";

export type MilestoneChoice = {
  id: string;
  title: string;
  description: string;
  milestone: ProjectView["milestones"][number] | null;
};

type SidePanelMessages = {
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
  messages: SidePanelMessages;
  onEditProject: (project: ProjectView) => void;
}) {
  const timelineMetadata = projectOverviewTimelineMetadata(
    project,
    timelineMessageInput(messages),
    messages.duration,
    (value) => formatDate(value, messages.dates, messages.detail.notSet),
  );

  return (
    <Card darkMode={darkMode}>
      <CardHeader
        darkMode={darkMode}
        icon={<Info size={18} aria-hidden="true" />}
        title={messages.detail.projectOverviewTitle}
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
      <div className="grid min-w-0 gap-4 px-4 py-4">
        <div className="grid min-w-0 gap-1">
          <LabelText darkMode={darkMode}>
            {messages.detail.description}
          </LabelText>
          <DescriptionText darkMode={darkMode}>
            {displayDescription(
              project.description,
              project.title,
              messages.defaults.project,
            )}
          </DescriptionText>
        </div>
        <dl className="grid min-w-0 gap-3 text-sm">
          <ProjectMetadataRow
            darkMode={darkMode}
            label={messages.detail.startDate}
            value={formatDate(
              project.startDate,
              messages.dates,
              messages.detail.notSet,
            )}
          />
          <ProjectMetadataRow
            darkMode={darkMode}
            label={timelineMetadata.label}
            value={timelineMetadata.value}
          />
        </dl>
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
  choice: MilestoneChoice | null;
  messages: SidePanelMessages;
  onEditMilestone: (milestone: ProjectView["milestones"][number]) => void;
}) {
  const selectedMilestone = choice?.milestone ?? null;
  const milestoneTimelineMetadata = selectedMilestone
    ? projectOverviewTimelineMetadata(
        {
          deadlineDate: selectedMilestone.deadlineDate,
          expectedDurationDays: selectedMilestone.expectedDurationDays,
          durationRange: durationRangeForDays(
            Number(selectedMilestone.expectedDurationDays),
          ),
        },
        timelineMessageInput(messages),
        messages.duration,
        (value) => formatDate(value, messages.dates, messages.detail.notSet),
      )
    : null;

  return (
    <Card darkMode={darkMode}>
      <CardHeader
        darkMode={darkMode}
        icon={<Flag size={18} aria-hidden="true" />}
        title={messages.detail.milestoneOverviewTitle}
        action={
          selectedMilestone ? (
            <Button
              darkMode={darkMode}
              disabled={pending}
              icon={<Edit3 size={15} aria-hidden="true" />}
              onClick={() => onEditMilestone(selectedMilestone)}
            >
              {messages.detail.edit}
            </Button>
          ) : null
        }
      />
      <div className="grid min-w-0 gap-4 px-4 py-4">
        {choice ? (
          <>
            <div className="grid min-w-0 gap-1">
              <LabelText darkMode={darkMode}>{choice.title}</LabelText>
              <DescriptionText darkMode={darkMode}>
                {choice.description}
              </DescriptionText>
            </div>
            {selectedMilestone ? (
              <dl className="grid min-w-0 gap-3 text-sm">
                <ProjectMetadataRow
                  darkMode={darkMode}
                  label={messages.detail.startDate}
                  value={formatDate(
                    selectedMilestone.startDate,
                    messages.dates,
                    messages.detail.notSet,
                  )}
                />
                {milestoneTimelineMetadata ? (
                  <ProjectMetadataRow
                    darkMode={darkMode}
                    label={milestoneTimelineMetadata.label}
                    value={milestoneTimelineMetadata.value}
                  />
                ) : null}
              </dl>
            ) : null}
          </>
        ) : (
          <DescriptionText darkMode={darkMode}>
            {messages.detail.noMilestones}
          </DescriptionText>
        )}
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
  onAddMilestone,
  onSelectMilestone,
}: {
  darkMode: boolean;
  pending: boolean;
  choices: MilestoneChoice[];
  selectedMilestoneId: string | null;
  messages: SidePanelMessages;
  onAddMilestone: () => void;
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
            icon={<Plus size={14} aria-hidden="true" />}
            onClick={onAddMilestone}
          >
            {messages.detail.new}
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
          >
            <button
              className="block w-full min-w-0 truncate text-left text-sm font-semibold"
              type="button"
              title={choice.title}
              onClick={() => onSelectMilestone(choice.id)}
            >
              {choice.title}
            </button>
          </ListItem>
        ))}
      </List>
    </Card>
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
