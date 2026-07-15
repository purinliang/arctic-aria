import {
  Edit3,
  LoaderCircle,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { Button } from "@/components/button";
import { sectionBorderClass } from "@/components/color";
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
import { List, ListItem } from "@/components/list";
import { LabelText } from "@/components/text";
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
        <DialogFrame darkMode={darkMode}>
          <DialogHeader
            darkMode={darkMode}
            title="Manage Categories"
            closeLabel="Close category editor"
            onClose={onCloseEditor}
          />
          <Button
            darkMode={darkMode}
            disabled={pending}
            icon={<Plus size={14} aria-hidden="true" />}
            onClick={onOpenNew}
          >
            New
          </Button>
          <List
            darkMode={darkMode}
            className={cx("-mx-4 mt-4 border-y", sectionBorderClass(darkMode))}
          >
            {categories.map((category) => (
              <ListItem
                key={category.id}
                darkMode={darkMode}
                className="items-center"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {category.name}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    darkMode={darkMode}
                    size="icon-sm"
                    className="h-8 w-8"
                    disabled={pending}
                    aria-label={`Edit ${category.name}`}
                    icon={<Edit3 size={14} aria-hidden="true" />}
                    onClick={() => onOpenEdit(category)}
                  />
                  <Button
                    darkMode={darkMode}
                    size="icon-sm"
                    className="h-8 w-8"
                    disabled={pending}
                    aria-label={`Delete ${category.name}`}
                    icon={<Trash2 size={14} aria-hidden="true" />}
                    onClick={() => onDelete(category)}
                  />
                </div>
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
}: {
  darkMode: boolean;
  pending: boolean;
  categoryDraft: MemoryCategoryInput;
  setCategoryDraft: Dispatch<SetStateAction<MemoryCategoryInput>>;
  onClose: () => void;
  onSubmit: () => void;
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
