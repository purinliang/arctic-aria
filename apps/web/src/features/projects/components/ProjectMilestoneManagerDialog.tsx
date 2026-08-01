// Projects Page - Milestone Manager Dialog.
import { Edit3, Plus } from "lucide-react";
import { Button } from "@/components/button";
import { displayDescription } from "@/components/default-description";
import {
  DialogFrame,
  DialogHeader,
  DialogOverlay,
} from "@/components/dialog";
import { formatDateKey } from "@/components/forms/date-format";
import {
  ManagerDialogSection,
  ManagerList,
  ManagerListRow,
} from "@/components/manager-list";
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
        <ManagerDialogSection
          darkMode={darkMode}
          title={messages.milestonesTitle}
          action={
            <Button
              darkMode={darkMode}
              disabled={pending}
              icon={<Plus size={14} aria-hidden="true" />}
              onClick={onOpenNew}
            >
              {messages.new}
            </Button>
          }
        >
          <ManagerList
            darkMode={darkMode}
            emptyText={messages.noMilestones}
            getItemKey={(milestone) => milestone.id}
            items={sortedMilestones}
            messages={messages.milestonePagination}
            renderItem={(milestone) => (
              <ManagerListRow
                darkMode={darkMode}
                title={milestone.title}
                description={displayDescription(
                  milestone.objective,
                  milestone.title,
                  defaultDescriptions.milestone,
                )}
                descriptionClassName="line-clamp-2"
                support={milestoneTimelineText(
                  milestone,
                  messages,
                  timelineMessages,
                  durationMessages,
                  dateMessages,
                )}
                supportClassName="truncate"
                action={
                  <Button
                    darkMode={darkMode}
                    disabled={pending}
                    icon={<Edit3 size={15} aria-hidden="true" />}
                    onClick={() => onOpenEdit(milestone)}
                  >
                    {messages.edit}
                  </Button>
                }
              />
            )}
          />
        </ManagerDialogSection>
      </DialogFrame>
    </DialogOverlay>
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
