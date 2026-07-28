// Projects Page - Project Editor Dialog.
import type { Dispatch, SetStateAction } from "react";
import { useDefaultDescriptionPlaceholder } from "@/components/default-description-placeholder";
import { CrudEditorDialog } from "@/components/dialog";
import {
  textAreaMinHeightLgClass,
  textAreaMinHeightSmClass,
} from "@/components/control-layout";
import { FormSection } from "@/components/forms/form-layout";
import { FieldLabel, TextInput } from "@/components/forms/input-field";
import { TextArea } from "@/components/forms/text-area-field";
import type {
  MilestoneInput,
  ProjectInput,
} from "@/features/projects/actions";
import type { FormMessages, ProjectMessages } from "@/messages/app-messages";
import {
  MilestoneTimelineFields,
  ProjectTimelineFields,
} from "./ProjectTimelineFields";

export function ProjectEditorDialog({
  darkMode,
  pending,
  saving,
  draft,
  setDraft,
  messages,
  durationMessages,
  defaultDescriptions,
  formMessages,
  zIndex,
  onClose,
  onSubmit,
  onDelete,
}: {
  darkMode: boolean;
  pending: boolean;
  saving: boolean;
  draft: ProjectInput;
  setDraft: Dispatch<SetStateAction<ProjectInput>>;
  messages: ProjectMessages["editor"];
  durationMessages: ProjectMessages["duration"];
  defaultDescriptions: ProjectMessages["defaultDescriptions"];
  formMessages: FormMessages;
  zIndex?: "z-50" | "z-[60]";
  onClose: () => void;
  onSubmit: () => void;
  onDelete?: () => void;
}) {
  const objectivePlaceholder = useDefaultDescriptionPlaceholder(
    defaultDescriptions.project,
    draft.title,
  );

  return (
    <CrudEditorDialog
      darkMode={darkMode}
      pending={pending}
      saving={saving}
      title={draft.id ? messages.project.edit : messages.project.add}
      closeLabel={messages.project.close}
      saveText={messages.common.save}
      savingText={messages.common.saving}
      deleteText={onDelete ? messages.common.delete : undefined}
      zIndex={zIndex}
      onClose={onClose}
      onSubmit={onSubmit}
      onDelete={onDelete}
      layout="sections"
    >
      <FormSection>
        <FieldLabel darkMode={darkMode} label={messages.common.title}>
          <TextInput
            darkMode={darkMode}
            value={draft.title}
            maxLength={120}
            disabled={pending}
            placeholder={messages.project.titlePlaceholder}
            onChange={(event) =>
              setDraft((current) => ({ ...current, title: event.target.value }))
            }
          />
        </FieldLabel>
        <FieldLabel darkMode={darkMode} label={messages.project.objective} optional>
          <TextArea
            darkMode={darkMode}
            className={textAreaMinHeightLgClass}
            value={draft.description}
            maxLength={1000}
            disabled={pending}
            placeholder={objectivePlaceholder}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
          />
        </FieldLabel>
      </FormSection>
      <ProjectTimelineFields
        darkMode={darkMode}
        pending={pending}
        draft={draft}
        setDraft={setDraft}
        messages={messages}
        durationMessages={durationMessages}
        formMessages={formMessages}
      />
    </CrudEditorDialog>
  );
}

export function MilestoneEditorDialog({
  darkMode,
  pending,
  saving,
  draft,
  setDraft,
  messages,
  durationMessages,
  defaultDescriptions,
  formMessages,
  zIndex,
  onClose,
  onSubmit,
  onDelete,
}: {
  darkMode: boolean;
  pending: boolean;
  saving: boolean;
  draft: MilestoneInput;
  setDraft: Dispatch<SetStateAction<MilestoneInput>>;
  messages: ProjectMessages["editor"];
  durationMessages: ProjectMessages["duration"];
  defaultDescriptions: ProjectMessages["defaultDescriptions"];
  formMessages: FormMessages;
  zIndex?: "z-50" | "z-[60]";
  onClose: () => void;
  onSubmit: () => void;
  onDelete?: () => void;
}) {
  const objectivePlaceholder = useDefaultDescriptionPlaceholder(
    defaultDescriptions.milestone,
    draft.title,
  );

  return (
    <CrudEditorDialog
      darkMode={darkMode}
      pending={pending}
      saving={saving}
      title={draft.id ? messages.milestone.edit : messages.milestone.add}
      closeLabel={messages.milestone.close}
      saveText={messages.common.save}
      savingText={messages.common.saving}
      deleteText={onDelete ? messages.common.delete : undefined}
      zIndex={zIndex}
      onClose={onClose}
      onSubmit={onSubmit}
      onDelete={onDelete}
      layout="sections"
    >
      <FormSection>
        <FieldLabel darkMode={darkMode} label={messages.common.title}>
          <TextInput
            darkMode={darkMode}
            value={draft.title}
            maxLength={120}
            disabled={pending}
            placeholder={messages.milestone.titlePlaceholder}
            onChange={(event) =>
              setDraft((current) => ({ ...current, title: event.target.value }))
            }
          />
        </FieldLabel>
        <FieldLabel darkMode={darkMode} label={messages.milestone.objective} optional>
          <TextArea
            darkMode={darkMode}
            className={textAreaMinHeightSmClass}
            value={draft.objective}
            maxLength={500}
            disabled={pending}
            placeholder={objectivePlaceholder}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                objective: event.target.value,
              }))
            }
          />
        </FieldLabel>
      </FormSection>
      <MilestoneTimelineFields
        darkMode={darkMode}
        pending={pending}
        draft={draft}
        setDraft={setDraft}
        messages={messages}
        durationMessages={durationMessages}
        formMessages={formMessages}
      />
    </CrudEditorDialog>
  );
}
