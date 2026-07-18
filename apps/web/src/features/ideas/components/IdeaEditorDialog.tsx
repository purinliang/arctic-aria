// Ideas Page - Idea Editor Dialog.
import type { Dispatch, SetStateAction } from "react";
import { CrudEditorDialog } from "@/components/dialog";
import { FieldLabel } from "@/components/forms/input-field";
import { TextArea } from "@/components/forms/text-area-field";
import type { IdeaInput } from "@/features/ideas/actions";
import type { IdeaMessages } from "@/messages/app-messages";

export function IdeaEditorDialog({
  darkMode,
  pending,
  saving,
  draft,
  messages,
  setDraft,
  onClose,
  onSubmit,
  onDelete,
}: {
  darkMode: boolean;
  pending: boolean;
  saving: boolean;
  draft: IdeaInput;
  messages: IdeaMessages["editor"];
  setDraft: Dispatch<SetStateAction<IdeaInput>>;
  onClose: () => void;
  onSubmit: () => void;
  onDelete?: () => void;
}) {
  return (
    <CrudEditorDialog
      darkMode={darkMode}
      pending={pending}
      saving={saving}
      title={draft.id ? messages.edit : messages.add}
      closeLabel={messages.close}
      saveText={messages.save}
      savingText={messages.saving}
      deleteText={draft.id ? messages.delete : undefined}
      onClose={onClose}
      onSubmit={onSubmit}
      onDelete={draft.id ? onDelete : undefined}
    >
      <FieldLabel darkMode={darkMode} label={messages.idea}>
        <TextArea
          darkMode={darkMode}
          className="min-h-32"
          value={draft.rawText}
          maxLength={2000}
          disabled={pending}
          placeholder={messages.placeholder}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              rawText: event.target.value,
            }))
          }
        />
      </FieldLabel>
    </CrudEditorDialog>
  );
}
