// Memories Page - Category Manager Dialog.
import { Edit3, Plus } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { Button } from "@/components/button";
import { textAreaMinHeightSmClass } from "@/components/control-layout";
import { useDefaultDescriptionPlaceholder } from "@/components/default-description-placeholder";
import {
  CrudEditorDialog,
  DialogFrame,
  DialogHeader,
  DialogOverlay,
} from "@/components/dialog";
import { FieldLabel, TextInput } from "@/components/forms/input-field";
import { TextArea } from "@/components/forms/text-area-field";
import {
  ManagerDialogSection,
  ManagerList,
  ManagerListRow,
} from "@/components/manager-list";
import type { MemoryCategoryOption } from "@/features/dashboard/types";
import type { MemoryCategoryInput } from "@/features/memories/actions";
import type { MemoryMessages } from "@/messages/app-messages";
import { MemoryCategoryIcon } from "./MemoryCategoryIcon";
import {
  getMemoryCategoryDisplayDescription,
  getMemoryCategoryName,
} from "./memory-page-helpers";

type CategoryDeleteTarget = Pick<
  MemoryCategoryOption,
  "id" | "name" | "description" | "builtInKey"
>;

export function CategoryManagerDialog({
  darkMode,
  pending,
  saving,
  categories,
  categoryDraft,
  categoryFormOpen,
  messages,
  defaultDescriptions,
  setCategoryDraft,
  onCloseEditor,
  onCloseForm,
  onOpenNew,
  onOpenEdit,
  onSubmit,
  onDelete,
}: {
  darkMode: boolean;
  pending: boolean;
  saving: boolean;
  categories: MemoryCategoryOption[];
  categoryDraft: MemoryCategoryInput;
  categoryFormOpen: boolean;
  messages: MemoryMessages["categories"];
  defaultDescriptions: MemoryMessages["defaultDescriptions"];
  setCategoryDraft: Dispatch<SetStateAction<MemoryCategoryInput>>;
  onCloseEditor: () => void;
  onCloseForm: () => void;
  onOpenNew: () => void;
  onOpenEdit: (category: MemoryCategoryOption) => void;
  onSubmit: () => void;
  onDelete: (category: CategoryDeleteTarget) => void;
}) {
  const customCategories = categories.filter((category) => !category.builtInKey);
  const defaultCategories = categories.filter((category) => category.builtInKey);

  return (
    <>
      <DialogOverlay>
        <DialogFrame darkMode={darkMode}>
          <DialogHeader
            darkMode={darkMode}
            title={messages.manageTitle}
            closeLabel={messages.closeEditor}
            onClose={onCloseEditor}
          />
          <div className="grid gap-[var(--aa-form-section-gap)]">
            <ManagerDialogSection
              darkMode={darkMode}
              title={messages.customSection}
              action={
                <Button
                  darkMode={darkMode}
                  disabled={pending}
                  icon={<Plus size={14} aria-hidden="true" />}
                  onClick={onOpenNew}
                >
                  {messages.new}
                </Button>
              }
            >
              <CategoryList
                darkMode={darkMode}
                categories={customCategories}
                emptyText={messages.noCustomCategories}
                editDisabled={pending}
                messages={messages}
                defaultDescriptions={defaultDescriptions}
                onOpenEdit={onOpenEdit}
              />
            </ManagerDialogSection>

            <ManagerDialogSection
              darkMode={darkMode}
              title={messages.defaultSection}
            >
              <CategoryList
                darkMode={darkMode}
                categories={defaultCategories}
                emptyText={messages.noCustomCategories}
                editDisabled={pending}
                messages={messages}
                defaultDescriptions={defaultDescriptions}
                pageSize={10}
                onOpenEdit={onOpenEdit}
              />
            </ManagerDialogSection>
          </div>
        </DialogFrame>
      </DialogOverlay>

      {categoryFormOpen ? (
        <CategoryFormDialog
          darkMode={darkMode}
          pending={pending}
          saving={saving}
          categoryDraft={categoryDraft}
          messages={messages}
          defaultDescriptions={defaultDescriptions}
          setCategoryDraft={setCategoryDraft}
          onClose={onCloseForm}
          onSubmit={onSubmit}
          onDelete={
            categoryDraft.id
              ? () =>
                  onDelete({
                    id: categoryDraft.id ?? "",
                    name: categoryDraft.name,
                    description: categoryDraft.description,
                    builtInKey: null,
                  })
              : undefined
          }
        />
      ) : null}
    </>
  );
}

function CategoryList({
  darkMode,
  categories,
  emptyText,
  editDisabled,
  messages,
  defaultDescriptions,
  pageSize,
  onOpenEdit,
}: {
  darkMode: boolean;
  categories: MemoryCategoryOption[];
  emptyText: string;
  editDisabled: boolean;
  messages: MemoryMessages["categories"];
  defaultDescriptions: MemoryMessages["defaultDescriptions"];
  pageSize?: number;
  onOpenEdit: (category: MemoryCategoryOption) => void;
}) {
  return (
    <ManagerList
      darkMode={darkMode}
      emptyText={emptyText}
      getItemKey={(category) => category.id}
      items={categories}
      messages={messages.pagination}
      pageSize={pageSize}
      renderItem={(category) => (
        <ManagerListRow
          darkMode={darkMode}
          title={getMemoryCategoryName(category, messages.builtIns)}
          description={getMemoryCategoryDisplayDescription(
            category,
            messages.builtIns,
            defaultDescriptions.category,
          )}
          leading={<MemoryCategoryIcon iconName={category.iconName} size={16} />}
          action={
            category.builtInKey ? null : (
              <Button
                darkMode={darkMode}
                disabled={editDisabled}
                icon={<Edit3 size={15} aria-hidden="true" />}
                onClick={() => onOpenEdit(category)}
              >
                {messages.edit}
              </Button>
            )
          }
        />
      )}
    />
  );
}

function CategoryFormDialog({
  darkMode,
  pending,
  saving,
  categoryDraft,
  messages,
  defaultDescriptions,
  setCategoryDraft,
  onClose,
  onSubmit,
  onDelete,
}: {
  darkMode: boolean;
  pending: boolean;
  saving: boolean;
  categoryDraft: MemoryCategoryInput;
  messages: MemoryMessages["categories"];
  defaultDescriptions: MemoryMessages["defaultDescriptions"];
  setCategoryDraft: Dispatch<SetStateAction<MemoryCategoryInput>>;
  onClose: () => void;
  onSubmit: () => void;
  onDelete?: () => void;
}) {
  const descriptionPlaceholder = useDefaultDescriptionPlaceholder(
    defaultDescriptions.category,
    categoryDraft.name,
  );

  return (
    <CrudEditorDialog
      darkMode={darkMode}
      pending={pending}
      saving={saving}
      title={categoryDraft.id ? messages.editTitle : messages.add}
      closeLabel={messages.closeForm}
      saveText={messages.save}
      savingText={messages.saving}
      deleteText={onDelete ? messages.delete : undefined}
      zIndex="z-[60]"
      onClose={onClose}
      onSubmit={onSubmit}
      onDelete={onDelete}
    >
      <FieldLabel darkMode={darkMode} label={messages.name}>
        <TextInput
          darkMode={darkMode}
          value={categoryDraft.name}
          maxLength={40}
          placeholder={messages.namePlaceholder}
          disabled={pending}
          onChange={(event) =>
            setCategoryDraft((current) => ({
              ...current,
              name: event.target.value,
            }))
          }
        />
      </FieldLabel>
      <FieldLabel darkMode={darkMode} label={messages.description} optional>
        <TextArea
          darkMode={darkMode}
          className={textAreaMinHeightSmClass}
          value={categoryDraft.description}
          maxLength={500}
          disabled={pending}
          placeholder={descriptionPlaceholder}
          onChange={(event) =>
            setCategoryDraft((current) => ({
              ...current,
              description: event.target.value,
            }))
          }
        />
      </FieldLabel>
    </CrudEditorDialog>
  );
}
