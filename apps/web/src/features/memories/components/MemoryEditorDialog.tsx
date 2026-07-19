// Memories Page - Memory Editor Dialog.
import {
  Settings2,
} from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { useDefaultDescriptionPlaceholder } from "@/components/default-description-placeholder";
import { CrudEditorDialog } from "@/components/dialog";
import {
  ChoiceActionButton,
  SingleChoiceGroup,
} from "@/components/forms/choice-group";
import { FieldLabel, TextInput } from "@/components/forms/input-field";
import { TextArea } from "@/components/forms/text-area-field";
import { LabelText } from "@/components/text";
import type { MemoryCategoryOption } from "@/features/dashboard/types";
import type { MemoryInput } from "@/features/memories/actions";
import type { MemoryMessages } from "@/messages/app-messages";
import { MemoryCategoryIcon } from "./MemoryCategoryIcon";
import { getMemoryCategoryName } from "./memory-page-helpers";

export function MemoryEditorDialog({
  darkMode,
  pending,
  saving,
  editingMemory,
  memoryDraft,
  categories,
  setMemoryDraft,
  messages,
  categoryMessages,
  defaultDescriptions,
  onClose,
  onSubmit,
  onDelete,
  onManageCategories,
}: {
  darkMode: boolean;
  pending: boolean;
  saving: boolean;
  editingMemory: boolean;
  memoryDraft: MemoryInput;
  categories: MemoryCategoryOption[];
  setMemoryDraft: Dispatch<SetStateAction<MemoryInput>>;
  messages: MemoryMessages["editor"];
  categoryMessages: MemoryMessages["categories"]["builtIns"];
  defaultDescriptions: MemoryMessages["defaultDescriptions"];
  onClose: () => void;
  onSubmit: () => void;
  onDelete: () => void;
  onManageCategories: () => void;
}) {
  const descriptionPlaceholder = useDefaultDescriptionPlaceholder(
    defaultDescriptions.memory,
  );

  return (
    <CrudEditorDialog
      darkMode={darkMode}
      pending={pending}
      saving={saving}
      title={editingMemory ? messages.edit : messages.add}
      closeLabel={messages.close}
      saveText={messages.save}
      savingText={messages.saving}
      deleteText={editingMemory ? messages.delete : undefined}
      onClose={onClose}
      onSubmit={onSubmit}
      onDelete={editingMemory ? onDelete : undefined}
    >
      <FieldLabel darkMode={darkMode} label={messages.title}>
        <TextInput
          darkMode={darkMode}
          value={memoryDraft.title}
          maxLength={120}
          placeholder={messages.titlePlaceholder}
          disabled={pending}
          onChange={(event) =>
            setMemoryDraft((current) => ({
              ...current,
              title: event.target.value,
            }))
          }
        />
      </FieldLabel>
      <div className="grid gap-1.5">
        <LabelText darkMode={darkMode}>{messages.category}</LabelText>
        <SingleChoiceGroup
          darkMode={darkMode}
          value={memoryDraft.categoryId}
          disabled={pending}
          options={categories.map((category) => ({
            value: category.id,
            label: getMemoryCategoryName(category, categoryMessages),
            icon: <MemoryCategoryIcon iconName={category.iconName} />,
          }))}
          onChange={(categoryId) => {
            const category = categories.find(
              (item) => item.id === categoryId,
            );

            setMemoryDraft((current) => ({
              ...current,
              categoryId,
              categoryName: category?.name ?? current.categoryName,
            }));
          }}
        >
          <ChoiceActionButton
            darkMode={darkMode}
            disabled={pending}
            option={{
              value: "manage",
              label: messages.manage,
              icon: <Settings2 size={14} aria-hidden="true" />,
            }}
            onClick={onManageCategories}
          />
        </SingleChoiceGroup>
      </div>
      <FieldLabel darkMode={darkMode} label={messages.description} optional>
        <TextArea
          darkMode={darkMode}
          className="min-h-28"
          value={memoryDraft.description}
          maxLength={2000}
          disabled={pending}
          placeholder={descriptionPlaceholder}
          onChange={(event) =>
            setMemoryDraft((current) => ({
              ...current,
              description: event.target.value,
            }))
          }
        />
      </FieldLabel>
    </CrudEditorDialog>
  );
}
