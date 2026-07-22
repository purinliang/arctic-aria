// Projects Page - Milestone Manager Dialog.
import { Edit3, Plus } from "lucide-react";
import { Button } from "@/components/button";
import { secondaryButtonBorderColorClass } from "@/components/color";
import { displayDescription } from "@/components/default-description";
import {
  DialogFrame,
  DialogHeader,
  DialogOverlay,
} from "@/components/dialog";
import { formatDateKey } from "@/components/forms/date-format";
import {
  List,
  ListItem,
  ListItemActions,
  ListItemContent,
  ListItemDescription,
  ListItemSupportingText,
  ListItemTitle,
} from "@/components/list";
import {
  DescriptionText,
  SectionTitle,
} from "@/components/text";
import { cx } from "@/components/utils";
import { durationRangeForDays } from "@/features/projects/project-duration";
import { projectOverviewTimelineMetadata } from "@/features/projects/project-overview-metadata";
import type { ProjectView } from "@/features/projects/actions";
import type { ProjectMessages } from "@/messages/app-messages";
import type { DatePickerMessages } from "@/messages/form-messages";

export function ProjectMilestoneManagerDialog({
  darkMode,
  pending,
  milestones,
  messages,
  timelineMessages,
  durationMessages,
  defaultDescriptions,
  dateMessages,
  onClose,
  onOpenNew,
  onOpenEdit,
}: {
  darkMode: boolean;
  pending: boolean;
  milestones: ProjectView["milestones"];
  messages: ProjectMessages["detail"];
  timelineMessages: ProjectMessages["timeline"];
  durationMessages: ProjectMessages["duration"];
  defaultDescriptions: ProjectMessages["defaultDescriptions"];
  dateMessages: DatePickerMessages;
  onClose: () => void;
  onOpenNew: () => void;
  onOpenEdit: (milestone: ProjectView["milestones"][number]) => void;
}) {
  const sortedMilestones = [...milestones].sort(compareMilestones);

  return (
    <DialogOverlay>
      <DialogFrame darkMode={darkMode}>
        <DialogHeader
          darkMode={darkMode}
          title={messages.manageMilestonesTitle}
          closeLabel={messages.closeMilestoneManager}
          onClose={onClose}
        />
        <section className="grid gap-2">
          <div className="flex items-center gap-3">
            <SectionTitle>{messages.milestonesTitle}</SectionTitle>
            <Button
              darkMode={darkMode}
              disabled={pending}
              icon={<Plus size={14} aria-hidden="true" />}
              onClick={onOpenNew}
            >
              {messages.new}
            </Button>
          </div>
          {sortedMilestones.length > 0 ? (
            <MilestoneList
              darkMode={darkMode}
              pending={pending}
              milestones={sortedMilestones}
              messages={messages}
              timelineMessages={timelineMessages}
              durationMessages={durationMessages}
              defaultDescriptions={defaultDescriptions}
              dateMessages={dateMessages}
              onOpenEdit={onOpenEdit}
            />
          ) : (
            <List
              darkMode={darkMode}
              className={cx(
                "rounded-md border",
                secondaryButtonBorderColorClass,
              )}
            >
              <ListItem darkMode={darkMode}>
                <DescriptionText darkMode={darkMode}>
                  {messages.noMilestones}
                </DescriptionText>
              </ListItem>
            </List>
          )}
        </section>
      </DialogFrame>
    </DialogOverlay>
  );
}

function MilestoneList({
  darkMode,
  pending,
  milestones,
  messages,
  timelineMessages,
  durationMessages,
  defaultDescriptions,
  dateMessages,
  onOpenEdit,
}: {
  darkMode: boolean;
  pending: boolean;
  milestones: ProjectView["milestones"];
  messages: ProjectMessages["detail"];
  timelineMessages: ProjectMessages["timeline"];
  durationMessages: ProjectMessages["duration"];
  defaultDescriptions: ProjectMessages["defaultDescriptions"];
  dateMessages: DatePickerMessages;
  onOpenEdit: (milestone: ProjectView["milestones"][number]) => void;
}) {
  return (
    <List
      darkMode={darkMode}
      className={cx("rounded-md border", secondaryButtonBorderColorClass)}
    >
      {milestones.map((milestone) => (
        <ListItem key={milestone.id} darkMode={darkMode} className="items-start">
          <ListItemContent
            title={<ListItemTitle truncate>{milestone.title}</ListItemTitle>}
            main={
              <ListItemDescription className="line-clamp-2">
                {displayDescription(
                  milestone.objective,
                  milestone.title,
                  defaultDescriptions.milestone,
                )}
              </ListItemDescription>
            }
            support={
              <ListItemSupportingText className="truncate">
                {milestoneTimelineText(
                  milestone,
                  messages,
                  timelineMessages,
                  durationMessages,
                  dateMessages,
                )}
              </ListItemSupportingText>
            }
          />
          <ListItemActions>
            <Button
              darkMode={darkMode}
              disabled={pending}
              icon={<Edit3 size={15} aria-hidden="true" />}
              onClick={() => onOpenEdit(milestone)}
            >
              {messages.edit}
            </Button>
          </ListItemActions>
        </ListItem>
      ))}
    </List>
  );
}

function milestoneTimelineText(
  milestone: ProjectView["milestones"][number],
  messages: ProjectMessages["detail"],
  timelineMessages: ProjectMessages["timeline"],
  durationMessages: ProjectMessages["duration"],
  dateMessages: DatePickerMessages,
) {
  const metadata = projectOverviewTimelineMetadata(
    {
      deadlineDate: milestone.deadlineDate,
      expectedDurationDays: milestone.expectedDurationDays,
      durationRange: durationRangeForDays(
        Number(milestone.expectedDurationDays),
      ),
    },
    {
      deadline: messages.deadlineLabel,
      expectedDuration: messages.expectedDuration,
      timeline: messages.timeline,
      openEnded: timelineMessages.openEnded,
    },
    durationMessages,
    (value) => formatDateKey(value, dateMessages, value || messages.notSet),
  );

  if (metadata.label === messages.deadlineLabel) {
    return timelineMessages.due(metadata.value);
  }

  if (metadata.label === messages.expectedDuration) {
    return timelineMessages.expected(metadata.value);
  }

  return metadata.value;
}

function compareMilestones(
  left: ProjectView["milestones"][number],
  right: ProjectView["milestones"][number],
) {
  return (
    dateSortValue(left.deadlineDate) - dateSortValue(right.deadlineDate) ||
    dateSortValue(left.startDate) - dateSortValue(right.startDate) ||
    left.title.localeCompare(right.title)
  );
}

function dateSortValue(date: string) {
  return date ? Date.parse(`${date}T00:00:00.000Z`) : Number.POSITIVE_INFINITY;
}
