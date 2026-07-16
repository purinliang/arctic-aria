// Projects Page - Project Timeline Fields.
import type { Dispatch, SetStateAction } from "react";
import { SingleChoiceGroup } from "@/components/forms/choice-group";
import { DatePickerField } from "@/components/forms/date-picker-field";
import { FieldLabel } from "@/components/forms/input-field";
import { SelectInput } from "@/components/forms/selection-field";
import type {
  MilestoneInput,
  ProjectInput,
} from "@/features/projects/actions";
import { projectDurationOptions } from "@/features/projects/project-duration";
import type { FormMessages, ProjectMessages } from "@/messages/app-messages";

export function ProjectTimelineFields({
  darkMode,
  pending,
  draft,
  setDraft,
  messages,
  durationMessages,
  formMessages,
}: {
  darkMode: boolean;
  pending: boolean;
  draft: ProjectInput;
  setDraft: Dispatch<SetStateAction<ProjectInput>>;
  messages: ProjectMessages["editor"];
  durationMessages: ProjectMessages["duration"];
  formMessages: FormMessages;
}) {
  return (
    <>
      <TimelineTypeField
        darkMode={darkMode}
        pending={pending}
        value={draft.timelineType}
        messages={messages}
        onChange={(timelineType) =>
          setDraft((current) => ({
            ...current,
            timelineType: timelineType as ProjectInput["timelineType"],
            deadlineDate: timelineType === "duration" ? "" : current.deadlineDate,
          }))
        }
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <DateFields
          darkMode={darkMode}
          pending={pending}
          timelineType={draft.timelineType}
          startDate={draft.startDate}
          deadlineDate={draft.deadlineDate}
          durationRange={draft.durationRange}
          messages={messages}
          durationMessages={durationMessages}
          formMessages={formMessages}
          onStartDate={(startDate) =>
            setDraft((current) => ({ ...current, startDate }))
          }
          onDeadlineDate={(deadlineDate) =>
            setDraft((current) => ({ ...current, deadlineDate }))
          }
          onDurationRange={(durationRange) =>
            setDraft((current) => ({
              ...current,
              durationRange: durationRange as ProjectInput["durationRange"],
            }))
          }
        />
      </div>
    </>
  );
}

export function MilestoneTimelineFields({
  darkMode,
  pending,
  draft,
  setDraft,
  messages,
  durationMessages,
  formMessages,
}: {
  darkMode: boolean;
  pending: boolean;
  draft: MilestoneInput;
  setDraft: Dispatch<SetStateAction<MilestoneInput>>;
  messages: ProjectMessages["editor"];
  durationMessages: ProjectMessages["duration"];
  formMessages: FormMessages;
}) {
  return (
    <>
      <TimelineTypeField
        darkMode={darkMode}
        pending={pending}
        value={draft.timelineType}
        messages={messages}
        onChange={(timelineType) =>
          setDraft((current) => ({
            ...current,
            timelineType: timelineType as MilestoneInput["timelineType"],
            deadlineDate: timelineType === "duration" ? "" : current.deadlineDate,
          }))
        }
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <DateFields
          darkMode={darkMode}
          pending={pending}
          timelineType={draft.timelineType}
          startDate={draft.startDate}
          deadlineDate={draft.deadlineDate}
          durationRange={draft.durationRange}
          messages={messages}
          durationMessages={durationMessages}
          formMessages={formMessages}
          onStartDate={(startDate) =>
            setDraft((current) => ({ ...current, startDate }))
          }
          onDeadlineDate={(deadlineDate) =>
            setDraft((current) => ({ ...current, deadlineDate }))
          }
          onDurationRange={(durationRange) =>
            setDraft((current) => ({
              ...current,
              durationRange: durationRange as MilestoneInput["durationRange"],
            }))
          }
        />
      </div>
    </>
  );
}

function TimelineTypeField({
  darkMode,
  pending,
  value,
  messages,
  onChange,
}: {
  darkMode: boolean;
  pending: boolean;
  value: string;
  messages: ProjectMessages["editor"];
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-1.5">
      <span className="text-xs font-semibold">{messages.common.timeline}</span>
      <SingleChoiceGroup
        darkMode={darkMode}
        disabled={pending}
        value={value}
        options={[
          { value: "deadline", label: messages.common.deadlineOption },
          { value: "duration", label: messages.common.durationOption },
        ]}
        onChange={onChange}
      />
    </div>
  );
}

function DateFields({
  darkMode,
  pending,
  timelineType,
  startDate,
  deadlineDate,
  durationRange,
  messages,
  durationMessages,
  formMessages,
  onStartDate,
  onDeadlineDate,
  onDurationRange,
}: {
  darkMode: boolean;
  pending: boolean;
  timelineType: string;
  startDate: string;
  deadlineDate: string;
  durationRange: string;
  messages: ProjectMessages["editor"];
  durationMessages: ProjectMessages["duration"];
  formMessages: FormMessages;
  onStartDate: (value: string) => void;
  onDeadlineDate: (value: string) => void;
  onDurationRange: (value: string) => void;
}) {
  return (
    <>
      <FieldLabel darkMode={darkMode} label={messages.common.startDate}>
        <DatePickerField
          darkMode={darkMode}
          value={startDate}
          placeholder={messages.common.selectStartDate}
          messages={formMessages.datePicker}
          disabled={pending}
          onChange={onStartDate}
        />
      </FieldLabel>
      {timelineType === "deadline" ? (
        <FieldLabel darkMode={darkMode} label={messages.common.deadline}>
          <DatePickerField
            darkMode={darkMode}
            value={deadlineDate}
            placeholder={messages.common.selectDeadline}
            messages={formMessages.datePicker}
            disabled={pending}
            onChange={onDeadlineDate}
          />
        </FieldLabel>
      ) : (
        <FieldLabel darkMode={darkMode} label={messages.common.duration}>
          <SelectInput
            darkMode={darkMode}
            value={durationRange}
            disabled={pending}
            options={projectDurationOptions.map((option) => ({
              ...option,
              label: durationMessages[option.value],
            }))}
            onChange={onDurationRange}
          />
        </FieldLabel>
      )}
    </>
  );
}
