// Memories Page - Category Manager Dialog.
import { Edit3, LoaderCircle, Plus, Save, Trash2, X } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { Button } from "@/components/button";
import { headerSurfaceClass, sectionBorderClass } from "@/components/color";
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
import { List, ListItem } from "@/components/list";
import { DescriptionText } from "@/components/text";
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
  return (
    <>
      <DialogOverlay>
        <DialogBackdrop
          label={messages.closeEditor}
          onClick={onCloseEditor}
        />
        <DialogFrame darkMode={darkMode} padding="none">
          <div
            className={cx(
              "flex items-center justify-between gap-3 rounded-t-md border-b px-4 py-3",
              headerSurfaceClass(darkMode),
            )}
          >
            <h3 className="text-base font-semibold">{messages.manageTitle}</h3>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                darkMode={darkMode}
                disabled={pending}
                icon={<Plus size={14} aria-hidden="true" />}
                onClick={onOpenNew}
              >
                {messages.new}
              </Button>
              <Button
                darkMode={darkMode}
                tone="ghost"
                size="icon-sm"
                aria-label={messages.closeEditor}
                icon={<X size={16} aria-hidden="true" />}
                onClick={onCloseEditor}
              />
            </div>
          </div>
          <List
            darkMode={darkMode}
            className={cx("border-b", sectionBorderClass(darkMode))}
          >
            {categories.map((category) => (
              <ListItem
                key={category.id}
                darkMode={darkMode}
                className="items-start"
              >
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
                    disabled={pending}
                    icon={<Edit3 size={15} aria-hidden="true" />}
                    onClick={() => onOpenEdit(category)}
                  >
                    {messages.edit}
                  </Button>
                )}
              </ListItem>
            ))}
          </List>
        </DialogFrame>
      </DialogOverlay>

      {categoryFormOpen ? (
        <CategoryFormDialog
          darkMode={darkMode}
          pending={pending}
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

function CategoryFormDialog({
  darkMode,
  pending,
  categoryDraft,
  messages,
  setCategoryDraft,
  onClose,
  onSubmit,
  onDelete,
}: {
  darkMode: boolean;
  pending: boolean;
  categoryDraft: MemoryCategoryInput;
  messages: MemoryMessages["categories"];
  setCategoryDraft: Dispatch<SetStateAction<MemoryCategoryInput>>;
  onClose: () => void;
  onSubmit: () => void;
  onDelete?: () => void;
}) {
  return (
    <DialogOverlay zIndex="z-[60]">
      <DialogBackdrop label={messages.closeForm} onClick={onClose} />
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
