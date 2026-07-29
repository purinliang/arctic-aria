// Projects Page - Project Task Editor Dialog.
import type { Dispatch, SetStateAction } from "react";
import { useDefaultDescriptionPlaceholder } from "@/components/default-description-placeholder";
import { CrudEditorDialog } from "@/components/dialog";
import { DatePickerField } from "@/components/forms/date-picker-field";
import { EstimatedDurationMinutesField } from "@/components/forms/estimated-duration-field";
import { FormGrid, FormSection } from "@/components/forms/form-layout";
import { FieldLabel, TextInput } from "@/components/forms/input-field";
import { SelectInput } from "@/components/forms/selection-field";
import { TextArea } from "@/components/forms/text-area-field";
import type {
  ProjectTaskInput,
  ProjectView,
} from "@/features/projects/actions";
import type { FormMessages, ProjectMessages } from "@/messages/app-messages";

export function ProjectTaskEditorDialog({
  darkMode,
  pending,
  saving,
  draft,
  milestones,
  messages,
  defaultDescriptions,
  formMessages,
  setDraft,
  onClose,
  onSubmit,
  onDelete,
}: {
  darkMode: boolean;
  pending: boolean;
  saving: boolean;
  draft: ProjectTaskInput;
  milestones: ProjectView["milestones"];
  messages: ProjectMessages["editor"];
  defaultDescriptions: ProjectMessages["defaultDescriptions"];
  formMessages: FormMessages;
  setDraft: Dispatch<SetStateAction<ProjectTaskInput>>;
  onClose: () => void;
  onSubmit: () => void;
  onDelete?: () => void;
}) {
  const descriptionPlaceholder = useDefaultDescriptionPlaceholder(
    defaultDescriptions.task,
    draft.title,
  );

  return (
    <CrudEditorDialog
      darkMode={darkMode}
      pending={pending}
      saving={saving}
      title={draft.id ? messages.task.edit : messages.task.add}
      closeLabel={messages.task.close}
      saveText={messages.common.save}
      savingText={messages.common.saving}
      deleteText={onDelete ? messages.common.delete : undefined}
      onClose={onClose}
      onSubmit={onSubmit}
      onDelete={onDelete}
      layout="sections"
    >
      <TaskBasics
        darkMode={darkMode}
        pending={pending}
        draft={draft}
        messages={messages}
        descriptionPlaceholder={descriptionPlaceholder}
        setDraft={setDraft}
      />
      <TaskMeta
        darkMode={darkMode}
        pending={pending}
        draft={draft}
        milestones={milestones}
        messages={messages}
        formMessages={formMessages}
        setDraft={setDraft}
      />
    </CrudEditorDialog>
  );
}

function TaskBasics({
  darkMode,
  pending,
  draft,
  messages,
  descriptionPlaceholder,
  setDraft,
}: {
  darkMode: boolean;
  pending: boolean;
  draft: ProjectTaskInput;
  messages: ProjectMessages["editor"];
  descriptionPlaceholder: string;
  setDraft: Dispatch<SetStateAction<ProjectTaskInput>>;
}) {
  return (
    <FormSection>
      <FieldLabel darkMode={darkMode} label={messages.common.title}>
        <TextInput
          darkMode={darkMode}
          value={draft.title}
          maxLength={120}
          disabled={pending}
          placeholder={messages.task.titlePlaceholder}
          onChange={(event) =>
            setDraft((current) => ({ ...current, title: event.target.value }))
          }
        />
      </FieldLabel>
      <FieldLabel darkMode={darkMode} label={messages.common.description} optional>
        <TextArea
          darkMode={darkMode}
          value={draft.description}
          maxLength={2000}
          disabled={pending}
          placeholder={descriptionPlaceholder}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              description: event.target.value,
            }))
          }
        />
      </FieldLabel>
    </FormSection>
  );
}

function TaskMeta({
  darkMode,
  pending,
  draft,
  milestones,
  messages,
  formMessages,
  setDraft,
}: {
  darkMode: boolean;
  pending: boolean;
  draft: ProjectTaskInput;
  milestones: ProjectView["milestones"];
  messages: ProjectMessages["editor"];
  formMessages: FormMessages;
  setDraft: Dispatch<SetStateAction<ProjectTaskInput>>;
}) {
  return (
    <FormSection>
      <FieldLabel darkMode={darkMode} label={messages.task.milestone} optional>
        <SelectInput
          darkMode={darkMode}
          value={draft.milestoneId}
          disabled={pending}
          options={[
            { value: "", label: messages.task.noMilestone },
            ...milestones.map((milestone) => ({
              value: milestone.id,
              label: milestone.title,
            })),
          ]}
          onChange={(milestoneId) =>
            setDraft((current) => ({
              ...current,
              milestoneId,
            }))
          }
        />
      </FieldLabel>
      <FormGrid columns={2}>
        <FieldLabel darkMode={darkMode} label={messages.common.startDate} optional>
          <DatePickerField
            darkMode={darkMode}
            value={draft.startDate}
            placeholder={messages.common.selectStartDate}
            messages={formMessages.datePicker}
            disabled={pending}
            onChange={(startDate) =>
              setDraft((current) => ({
                ...current,
                startDate,
              }))
            }
          />
        </FieldLabel>
        <FieldLabel darkMode={darkMode} label={messages.common.deadline} optional>
          <DatePickerField
            darkMode={darkMode}
            value={draft.deadlineDate}
            placeholder={messages.common.selectDeadline}
            messages={formMessages.datePicker}
            disabled={pending}
            onChange={(deadlineDate) =>
              setDraft((current) => ({
                ...current,
                deadlineDate,
              }))
            }
          />
        </FieldLabel>
        <EstimatedDurationMinutesField
          darkMode={darkMode}
          value={draft.estimatedDurationMinutes ?? ""}
          disabled={pending}
          label={messages.task.estimatedDuration}
          placeholder={messages.task.estimatedDurationPlaceholder}
          onChange={(estimatedDurationMinutes) =>
            setDraft((current) => ({
              ...current,
              estimatedDurationMinutes,
            }))
          }
        />
      </FormGrid>
    </FormSection>
  );
}
