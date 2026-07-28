// Projects Page - Project Timeline Fields.
import type { Dispatch, SetStateAction } from "react";
import { formFieldClass } from "@/components/control-layout";
import { SingleChoiceGroup } from "@/components/forms/choice-group";
import { DatePickerField } from "@/components/forms/date-picker-field";
import { FormSection } from "@/components/forms/form-layout";
import { FieldLabel } from "@/components/forms/input-field";
import { LabelText } from "@/components/text";
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
    <FormSection>
      <StartDateField
        darkMode={darkMode}
        pending={pending}
        startDate={draft.startDate}
        messages={messages}
        formMessages={formMessages}
        onStartDate={(startDate) =>
          setDraft((current) => ({ ...current, startDate }))
        }
      />
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
      <TimelineEndField
        darkMode={darkMode}
        pending={pending}
        timelineType={draft.timelineType}
        deadlineDate={draft.deadlineDate}
        durationRange={draft.durationRange}
        messages={messages}
        durationMessages={durationMessages}
        formMessages={formMessages}
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
    </FormSection>
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
    <FormSection>
      <StartDateField
        darkMode={darkMode}
        pending={pending}
        startDate={draft.startDate}
        messages={messages}
        formMessages={formMessages}
        onStartDate={(startDate) =>
          setDraft((current) => ({ ...current, startDate }))
        }
      />
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
      <TimelineEndField
        darkMode={darkMode}
        pending={pending}
        timelineType={draft.timelineType}
        deadlineDate={draft.deadlineDate}
        durationRange={draft.durationRange}
        messages={messages}
        durationMessages={durationMessages}
        formMessages={formMessages}
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
    </FormSection>
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
    <div className={formFieldClass}>
      <LabelText darkMode={darkMode}>{messages.common.timeline}</LabelText>
      <SingleChoiceGroup
        darkMode={darkMode}
        disabled={pending}
        value={value}
        options={[
          { value: "deadline", label: messages.common.deadlineOption },
          { value: "duration", label: messages.common.noFixedDeadlineOption },
        ]}
        onChange={onChange}
      />
    </div>
  );
}

function StartDateField({
  darkMode,
  pending,
  startDate,
  messages,
  formMessages,
  onStartDate,
}: {
  darkMode: boolean;
  pending: boolean;
  startDate: string;
  messages: ProjectMessages["editor"];
  formMessages: FormMessages;
  onStartDate: (value: string) => void;
}) {
  return (
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
  );
}

function TimelineEndField({
  darkMode,
  pending,
  timelineType,
  deadlineDate,
  durationRange,
  messages,
  durationMessages,
  formMessages,
  onDeadlineDate,
  onDurationRange,
}: {
  darkMode: boolean;
  pending: boolean;
  timelineType: string;
  deadlineDate: string;
  durationRange: string;
  messages: ProjectMessages["editor"];
  durationMessages: ProjectMessages["duration"];
  formMessages: FormMessages;
  onDeadlineDate: (value: string) => void;
  onDurationRange: (value: string) => void;
}) {
  return (
    <>
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
        <FieldLabel darkMode={darkMode} label={messages.common.expectedDuration}>
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
