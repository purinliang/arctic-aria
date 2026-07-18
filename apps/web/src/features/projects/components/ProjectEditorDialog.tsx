// Projects Page - Project Editor Dialog.
import type { Dispatch, SetStateAction } from "react";
import { CrudEditorDialog } from "@/components/dialog";
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
  formMessages,
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
  formMessages: FormMessages;
  onClose: () => void;
  onSubmit: () => void;
  onDelete?: () => void;
}) {
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
      onClose={onClose}
      onSubmit={onSubmit}
      onDelete={onDelete}
    >
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
      <FieldLabel darkMode={darkMode} label={messages.common.description}>
        <TextArea
          darkMode={darkMode}
          className="min-h-28"
          value={draft.description}
          maxLength={1000}
          disabled={pending}
          placeholder={messages.project.descriptionPlaceholder}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              description: event.target.value,
            }))
          }
        />
      </FieldLabel>
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
  formMessages,
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
  formMessages: FormMessages;
  onClose: () => void;
  onSubmit: () => void;
  onDelete?: () => void;
}) {
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
      onClose={onClose}
      onSubmit={onSubmit}
      onDelete={onDelete}
    >
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
          className="min-h-20"
          value={draft.objective}
          maxLength={500}
          disabled={pending}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              objective: event.target.value,
            }))
          }
        />
      </FieldLabel>
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
