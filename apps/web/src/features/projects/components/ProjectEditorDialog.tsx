// Projects Page - Project Editor Dialog.
import { FileText, MoreHorizontal, Trash2 } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import { useDefaultDescriptionPlaceholder } from "@/components/default-description-placeholder";
import { CrudEditorDialog } from "@/components/dialog";
import { Button } from "@/components/button";
import {
  textAreaMinHeightLgClass,
  textAreaMinHeightSmClass,
} from "@/components/control-layout";
import { FloatingPopover, PopoverDismissLayer } from "@/components/floating-popover";
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
  onTemplate,
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
  onTemplate?: () => void;
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
      deleteText={onDelete && !onTemplate ? messages.common.delete : undefined}
      headerActions={
        onTemplate || onDelete ? (
          <ProjectEditorMenu
            darkMode={darkMode}
            disabled={pending}
            messages={messages}
            onTemplate={onTemplate}
            onDelete={onDelete}
          />
        ) : undefined
      }
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

function ProjectEditorMenu({
  darkMode,
  disabled,
  messages,
  onTemplate,
  onDelete,
}: {
  darkMode: boolean;
  disabled: boolean;
  messages: ProjectMessages["editor"];
  onTemplate?: () => void;
  onDelete?: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        darkMode={darkMode}
        tone="ghost"
        size="icon"
        disabled={disabled}
        aria-label={messages.template.menuAriaLabel}
        aria-expanded={open}
        aria-haspopup="menu"
        icon={<MoreHorizontal size={16} aria-hidden="true" />}
        onClick={() => setOpen((current) => !current)}
      />
      {open ? (
        <>
          <PopoverDismissLayer
            label={messages.template.close}
            onDismiss={() => setOpen(false)}
          />
          <FloatingPopover
            title={messages.template.menuLabel}
            className="w-48 p-2"
            bodyClassName="gap-1"
          >
            {onTemplate ? (
              <Button
                darkMode={darkMode}
                tone="ghost"
                className="w-full justify-start"
                icon={<FileText size={14} aria-hidden="true" />}
                onClick={() => {
                  setOpen(false);
                  onTemplate();
                }}
              >
                {messages.template.menuLabel}
              </Button>
            ) : null}
            {onDelete ? (
              <Button
                darkMode={darkMode}
                tone="ghost"
                className="w-full justify-start"
                icon={<Trash2 size={14} aria-hidden="true" />}
                onClick={() => {
                  setOpen(false);
                  onDelete();
                }}
              >
                {messages.common.delete}
              </Button>
            ) : null}
          </FloatingPopover>
        </>
      ) : null}
    </div>
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
