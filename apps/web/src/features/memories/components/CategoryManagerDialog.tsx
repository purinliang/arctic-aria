// Memories Page - Category Manager Dialog.
import { Edit3, Plus, Save, Trash2 } from "lucide-react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { Button } from "@/components/button";
import { secondaryButtonBorderColorClass } from "@/components/color";
import {
  DialogActionRow,
  DialogFrame,
  DialogHeader,
  DialogOverlay,
  DialogPrimaryButton,
} from "@/components/dialog";
import { FieldLabel, TextInput } from "@/components/forms/input-field";
import { TextArea } from "@/components/forms/text-area-field";
import { List, ListItem } from "@/components/list";
import { DescriptionText, SectionTitle } from "@/components/text";
import { cx } from "@/components/utils";
import type { MemoryCategoryOption } from "@/features/dashboard/types";
import type { MemoryCategoryInput } from "@/features/memories/actions";
import type { MemoryMessages } from "@/messages/app-messages";
import { MemoryCategoryIcon } from "./MemoryCategoryIcon";
import {
  getMemoryCategoryDescription,
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
          <div className="grid gap-5">
            <CategorySection
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
              {customCategories.length > 0 ? (
                <CategoryList
                  darkMode={darkMode}
                  categories={customCategories}
                  editDisabled={pending}
                  messages={messages}
                  onOpenEdit={onOpenEdit}
                />
              ) : (
                <EmptyCategoryList
                  darkMode={darkMode}
                  message={messages.noCustomCategories}
                />
              )}
            </CategorySection>

            <CategorySection title={messages.defaultSection}>
              <CategoryList
                darkMode={darkMode}
                categories={defaultCategories}
                editDisabled={pending}
                messages={messages}
                onOpenEdit={onOpenEdit}
              />
            </CategorySection>
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

function CategorySection({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-2">
      <div className="flex items-center justify-between gap-3">
        <SectionTitle>{title}</SectionTitle>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}

function CategoryList({
  darkMode,
  categories,
  editDisabled,
  messages,
  onOpenEdit,
}: {
  darkMode: boolean;
  categories: MemoryCategoryOption[];
  editDisabled: boolean;
  messages: MemoryMessages["categories"];
  onOpenEdit: (category: MemoryCategoryOption) => void;
}) {
  return (
    <List
      darkMode={darkMode}
      className={cx("rounded-md border", secondaryButtonBorderColorClass)}
    >
      {categories.map((category) => (
        <CategoryRow
          key={category.id}
          darkMode={darkMode}
          category={category}
          editDisabled={editDisabled}
          messages={messages}
          onOpenEdit={onOpenEdit}
        />
      ))}
    </List>
  );
}

function EmptyCategoryList({
  darkMode,
  message,
}: {
  darkMode: boolean;
  message: string;
}) {
  return (
    <List
      darkMode={darkMode}
      className={cx("rounded-md border", secondaryButtonBorderColorClass)}
    >
      <ListItem darkMode={darkMode}>
        <DescriptionText darkMode={darkMode}>{message}</DescriptionText>
      </ListItem>
    </List>
  );
}

function CategoryRow({
  darkMode,
  category,
  editDisabled,
  messages,
  onOpenEdit,
}: {
  darkMode: boolean;
  category: MemoryCategoryOption;
  editDisabled: boolean;
  messages: MemoryMessages["categories"];
  onOpenEdit: (category: MemoryCategoryOption) => void;
}) {
  return (
    <ListItem darkMode={darkMode} className="items-start">
      <span className="mt-1 shrink-0">
        <MemoryCategoryIcon iconName={category.iconName} size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">
          {getMemoryCategoryName(category, messages.builtIns)}
        </p>
        <DescriptionText darkMode={darkMode} className="mt-1">
          {getMemoryCategoryDescription(category, messages.builtIns) ||
            messages.noDescription}
        </DescriptionText>
      </div>
      {category.builtInKey ? null : (
        <Button
          darkMode={darkMode}
          disabled={editDisabled}
          icon={<Edit3 size={15} aria-hidden="true" />}
          onClick={() => onOpenEdit(category)}
        >
          {messages.edit}
        </Button>
      )}
    </ListItem>
  );
}

function CategoryFormDialog({
  darkMode,
  pending,
  saving,
  categoryDraft,
  messages,
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
  setCategoryDraft: Dispatch<SetStateAction<MemoryCategoryInput>>;
  onClose: () => void;
  onSubmit: () => void;
  onDelete?: () => void;
}) {
  return (
    <DialogOverlay zIndex="z-[60]">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <DialogFrame darkMode={darkMode}>
          <DialogHeader
            darkMode={darkMode}
            title={categoryDraft.id ? messages.editTitle : messages.add}
            closeLabel={messages.closeForm}
            onClose={onClose}
          />
          <div className="grid gap-3">
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
                className="min-h-20"
                value={categoryDraft.description}
                maxLength={500}
                disabled={pending}
                placeholder={messages.descriptionPlaceholder}
                onChange={(event) =>
                  setCategoryDraft((current) => ({
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
