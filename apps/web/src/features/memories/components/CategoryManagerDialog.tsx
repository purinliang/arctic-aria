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
import { SingleChoiceGroup } from "@/components/forms/choice-group";
import { FieldLabel, TextInput } from "@/components/forms/input-field";
import { TextArea } from "@/components/forms/text-area-field";
import { List, ListItem } from "@/components/list";
import { DescriptionText, LabelText, SupportingText } from "@/components/text";
import { cx } from "@/components/utils";
import type { MemoryCategoryOption } from "@/features/dashboard/types";
import type { MemoryCategoryInput } from "@/features/memories/actions";
import {
  categoryPeriodFromWeight,
  categoryPeriodWeights,
  type CategoryPeriod,
} from "./memory-page-helpers";

export function CategoryManagerDialog({
  darkMode,
  pending,
  categories,
  categoryDraft,
  categoryFormOpen,
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
  setCategoryDraft: Dispatch<SetStateAction<MemoryCategoryInput>>;
  onCloseEditor: () => void;
  onCloseForm: () => void;
  onOpenNew: () => void;
  onOpenEdit: (category: MemoryCategoryOption) => void;
  onSubmit: () => void;
  onDelete: (category: MemoryCategoryOption) => void;
}) {
  return (
    <>
      <DialogOverlay>
        <DialogBackdrop
          label="Close category editor"
          onClick={onCloseEditor}
        />
        <DialogFrame darkMode={darkMode} padding="none">
          <div
            className={cx(
              "flex items-center justify-between gap-3 rounded-t-md border-b px-4 py-3",
              headerSurfaceClass(darkMode),
            )}
          >
            <h3 className="text-base font-semibold">Manage Categories</h3>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                darkMode={darkMode}
                disabled={pending}
                icon={<Plus size={14} aria-hidden="true" />}
                onClick={onOpenNew}
              >
                New
              </Button>
              <Button
                darkMode={darkMode}
                tone="ghost"
                size="icon-sm"
                aria-label="Close category editor"
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
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{category.name}</p>
                  <DescriptionText darkMode={darkMode} className="mt-1">
                    {category.description || "No description."}
                  </DescriptionText>
                  <SupportingText darkMode={darkMode} className="mt-2 block">
                    {categoryPeriodFromWeight(category.baseWeight)}
                  </SupportingText>
                </div>
                <Button
                  darkMode={darkMode}
                  disabled={pending}
                  icon={<Edit3 size={14} aria-hidden="true" />}
                  onClick={() => onOpenEdit(category)}
                >
                  Edit
                </Button>
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
                    baseWeight: categoryDraft.baseWeight,
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
  setCategoryDraft,
  onClose,
  onSubmit,
  onDelete,
}: {
  darkMode: boolean;
  pending: boolean;
  categoryDraft: MemoryCategoryInput;
  setCategoryDraft: Dispatch<SetStateAction<MemoryCategoryInput>>;
  onClose: () => void;
  onSubmit: () => void;
  onDelete?: () => void;
}) {
  return (
    <DialogOverlay zIndex="z-[60]">
      <DialogBackdrop label="Close category form" onClick={onClose} />
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <DialogFrame darkMode={darkMode}>
          <DialogHeader
            darkMode={darkMode}
            title={categoryDraft.id ? "Edit category" : "Add category"}
            closeLabel="Close category form"
            onClose={onClose}
          />
          <div className="grid gap-3">
            <FieldLabel darkMode={darkMode} label="Category name">
              <TextInput
                darkMode={darkMode}
                value={categoryDraft.name}
                maxLength={40}
                placeholder="Category name"
                disabled={pending}
                onChange={(event) =>
                  setCategoryDraft((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
              />
            </FieldLabel>
            <FieldLabel darkMode={darkMode} label="Description" optional>
              <TextArea
                darkMode={darkMode}
                className="min-h-20"
                value={categoryDraft.description}
                maxLength={500}
                disabled={pending}
                placeholder="When should this category be suggested?"
                onChange={(event) =>
                  setCategoryDraft((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
              />
            </FieldLabel>
            <CategoryPeriodField
              darkMode={darkMode}
              pending={pending}
              value={categoryPeriodFromWeight(categoryDraft.baseWeight)}
              onChange={(period) =>
                setCategoryDraft((current) => ({
                  ...current,
                  baseWeight: categoryPeriodWeights[period],
                }))
              }
            />
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
            {onDelete ? (
              <Button
                darkMode={darkMode}
                disabled={pending}
                className="w-full"
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

function CategoryPeriodField({
  darkMode,
  pending,
  value,
  onChange,
}: {
  darkMode: boolean;
  pending: boolean;
  value: CategoryPeriod;
  onChange: (period: CategoryPeriod) => void;
}) {
  return (
    <div className="grid gap-1.5">
      <LabelText darkMode={darkMode}>Suggestion period</LabelText>
      <SingleChoiceGroup
        darkMode={darkMode}
        disabled={pending}
        value={value}
        options={(["Weekly", "Monthly"] as CategoryPeriod[]).map((period) => ({
          value: period,
          label: period,
        }))}
        onChange={(nextValue) => onChange(nextValue as CategoryPeriod)}
      />
    </div>
  );
}
