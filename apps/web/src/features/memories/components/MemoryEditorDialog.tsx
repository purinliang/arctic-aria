import {
  LoaderCircle,
  Save,
  Settings2,
  Trash2,
} from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { Button } from "@/components/button";
import {
  DialogActionRow,
  DialogBackdrop,
  DialogFrame,
  DialogHeader,
  DialogOverlay,
  DialogPrimaryButton,
} from "@/components/dialog";
import { SingleChoiceGroup } from "@/components/forms/choice-group";
import { FieldLabel, TextInput } from "@/components/forms/input-field";
import { TextArea } from "@/components/forms/text-area-field";
import { LabelText } from "@/components/text";
import type { MemoryCategoryOption } from "@/features/dashboard/types";
import type { MemoryInput } from "@/features/memories/actions";

export function MemoryEditorDialog({
  darkMode,
  pending,
  editingMemory,
  memoryDraft,
  categories,
  setMemoryDraft,
  onClose,
  onSubmit,
  onDelete,
  onManageCategories,
}: {
  darkMode: boolean;
  pending: boolean;
  editingMemory: boolean;
  memoryDraft: MemoryInput;
  categories: MemoryCategoryOption[];
  setMemoryDraft: Dispatch<SetStateAction<MemoryInput>>;
  onClose: () => void;
  onSubmit: () => void;
  onDelete: () => void;
  onManageCategories: () => void;
}) {
  return (
    <DialogOverlay>
      <DialogBackdrop label="Close memory editor" onClick={onClose} />
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <DialogFrame darkMode={darkMode}>
          <DialogHeader
            darkMode={darkMode}
            title={editingMemory ? "Edit a memory" : "Add a new memory"}
            closeLabel="Close memory editor"
            onClose={onClose}
          />
          <div className="grid gap-3">
            <FieldLabel darkMode={darkMode} label="Title">
              <TextInput
                darkMode={darkMode}
                value={memoryDraft.title}
                maxLength={120}
                placeholder="Memory title"
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
              <LabelText darkMode={darkMode}>Category</LabelText>
              <div className="flex flex-wrap items-center gap-2">
                <SingleChoiceGroup
                  darkMode={darkMode}
                  value={memoryDraft.categoryId}
                  disabled={pending}
                  options={categories.map((category) => ({
                    value: category.id,
                    label: category.name,
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
                />
                <Button
                  darkMode={darkMode}
                  size="xs"
                  disabled={pending}
                  icon={<Settings2 size={14} aria-hidden="true" />}
                  onClick={onManageCategories}
                >
                  Manage
                </Button>
              </div>
            </div>
            <FieldLabel darkMode={darkMode} label="Description">
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
              Save
            </DialogPrimaryButton>
            {editingMemory ? (
              <Button
                darkMode={darkMode}
                disabled={pending}
                icon={<Trash2 size={14} aria-hidden="true" />}
                onClick={onDelete}
              >
                Delete
              </Button>
            ) : null}
          </DialogActionRow>
        </DialogFrame>
      </form>
    </DialogOverlay>
  );
}
