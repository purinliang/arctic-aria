// Memories Page - Memory Editor Dialog.
import {
  Save,
  Settings2,
  Trash2,
} from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { Button } from "@/components/button";
import {
  DialogActionRow,
  DialogFrame,
  DialogHeader,
  DialogOverlay,
  DialogPrimaryButton,
} from "@/components/dialog";
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
  onClose: () => void;
  onSubmit: () => void;
  onDelete: () => void;
  onManageCategories: () => void;
}) {
  return (
    <DialogOverlay>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <DialogFrame darkMode={darkMode}>
          <DialogHeader
            darkMode={darkMode}
            title={editingMemory ? messages.edit : messages.add}
            closeLabel={messages.close}
            onClose={onClose}
          />
          <div className="grid gap-3">
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
            <FieldLabel darkMode={darkMode} label={messages.description}>
              <TextArea
                darkMode={darkMode}
                className="min-h-28"
                value={memoryDraft.description}
                maxLength={2000}
                disabled={pending}
                onChange={(event) =>
                  setMemoryDraft((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
              />
            </FieldLabel>
          </div>
          <DialogActionRow>
            <DialogPrimaryButton
              darkMode={darkMode}
              type="submit"
              disabled={pending}
              icon={<Save size={14} aria-hidden="true" />}
            >
              {saving ? messages.saving : messages.save}
            </DialogPrimaryButton>
            {editingMemory ? (
              <Button
                darkMode={darkMode}
                disabled={pending}
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
