// Projects Page - Project Editor Dialog.
import { LoaderCircle, Save, Trash2 } from "lucide-react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { Button } from "@/components/button";
import {
  DialogActionRow,
  DialogBackdrop,
  DialogFrame,
  DialogHeader,
  DialogOverlay,
  DialogPrimaryButton,
} from "@/components/dialog";
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
    <DialogShell
      darkMode={darkMode}
      pending={pending}
      title={draft.id ? messages.project.edit : messages.project.add}
      closeLabel={messages.project.close}
      messages={messages.common}
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
    </DialogShell>
  );
}

export function MilestoneEditorDialog({
  darkMode,
  pending,
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
    <DialogShell
      darkMode={darkMode}
      pending={pending}
      title={draft.id ? messages.milestone.edit : messages.milestone.add}
      closeLabel={messages.milestone.close}
      messages={messages.common}
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
    </DialogShell>
  );
}

function DialogShell({
  darkMode,
  pending,
  title,
  closeLabel,
  messages,
  children,
  onClose,
  onSubmit,
  onDelete,
}: {
  darkMode: boolean;
  pending: boolean;
  title: string;
  closeLabel: string;
  messages: ProjectMessages["editor"]["common"];
  children: ReactNode;
  onClose: () => void;
  onSubmit: () => void;
  onDelete?: () => void;
}) {
  return (
    <DialogOverlay>
      <DialogBackdrop label={closeLabel} onClick={onClose} />
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <DialogFrame darkMode={darkMode}>
          <DialogHeader
            darkMode={darkMode}
            title={title}
            closeLabel={closeLabel}
            onClose={onClose}
          />
          <div className="grid gap-3">{children}</div>
          <DialogActionRow>
            <DialogPrimaryButton
              darkMode={darkMode}
              type="submit"
              loading={pending}
              icon={<Save size={14} aria-hidden="true" />}
              loadingIcon={
                <LoaderCircle
                  className="animate-spin"
                  size={14}
                  aria-hidden="true"
                />
              }
            >
              {messages.save}
            </DialogPrimaryButton>
            {onDelete ? (
              <Button
                darkMode={darkMode}
                disabled={pending}
                className="w-full"
                icon={<Trash2 size={14} aria-hidden="true" />}
                onClick={onDelete}
              >
                {messages.delete}
              </Button>
            ) : null}
          </DialogActionRow>
        </DialogFrame>
      </form>
    </DialogOverlay>
  );
}
