import {
  Edit3,
  LoaderCircle,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { Button } from "@/components/button";
import { dividerClass } from "@/components/color";
import {
  DialogActionRow,
  DialogPrimaryButton,
  dialogFrameClass,
} from "@/components/dialog";
import { TextInput } from "@/components/forms/input-field";
import { ListItem } from "@/components/list";
import { InlineMessage } from "@/components/text";
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
  message,
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
  message: string | null;
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
      <div className="fixed inset-0 z-50 grid place-items-center bg-black/65 px-4 py-6">
        <button
          className="absolute inset-0 cursor-default"
          type="button"
          aria-label="Close category editor"
          onClick={onCloseEditor}
        />
        <section className={dialogFrameClass(darkMode)}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold">Manage Categories</h3>
            <Button
              darkMode={darkMode}
              tone="ghost"
              size="icon-sm"
              aria-label="Close category editor"
              icon={<X size={16} aria-hidden="true" />}
              onClick={onCloseEditor}
            />
          </div>
          {message ? (
            <InlineMessage darkMode={darkMode} className="mb-3">
              {message}
            </InlineMessage>
          ) : null}
          <Button
            darkMode={darkMode}
            disabled={pending}
            icon={<Plus size={14} aria-hidden="true" />}
            onClick={onOpenNew}
          >
            New category
          </Button>
          <div className={`mt-3 ${dividerClass(darkMode)}`}>
            {categories.map((category) => (
              <ListItem
                key={category.id}
                darkMode={darkMode}
                className="items-center px-0 py-3"
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
          </div>
        </section>
      </div>

      {categoryFormOpen ? (
        <CategoryFormDialog
          darkMode={darkMode}
          pending={pending}
          message={message}
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
  message,
  categoryDraft,
  setCategoryDraft,
  onClose,
  onSubmit,
}: {
  darkMode: boolean;
  pending: boolean;
  message: string | null;
  categoryDraft: MemoryCategoryInput;
  setCategoryDraft: Dispatch<SetStateAction<MemoryCategoryInput>>;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/65 px-4 py-6">
      <button
        className="absolute inset-0 cursor-default"
        type="button"
        aria-label="Close category form"
        onClick={onClose}
      />
      <form
        className={cx(dialogFrameClass(darkMode), "max-w-md")}
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-base font-semibold">
            {categoryDraft.id ? "Edit category" : "Add category"}
          </h3>
          <Button
            darkMode={darkMode}
            tone="ghost"
            size="icon-sm"
            aria-label="Close category form"
            icon={<X size={16} aria-hidden="true" />}
            onClick={onClose}
          />
        </div>
        {message ? (
          <InlineMessage darkMode={darkMode} className="mb-3">
            {message}
          </InlineMessage>
        ) : null}
        <div className="grid gap-3">
          <label className="grid gap-1 text-xs font-semibold">
            Category name
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
          </label>
          <div className="grid gap-2">
            <span className="text-xs font-semibold">Suggestion period</span>
            <div className="flex flex-wrap gap-2">
              {(["Weekly", "Monthly"] as CategoryPeriod[]).map((period) => (
                <Button
                  key={period}
                  darkMode={darkMode}
                  size="xs"
                  active={
                    categoryPeriodFromWeight(categoryDraft.baseWeight) ===
                    period
                  }
                  disabled={pending}
                  onClick={() =>
                    setCategoryDraft((current) => ({
                      ...current,
                      baseWeight: categoryPeriodWeights[period],
                    }))
                  }
                >
                  {period}
                </Button>
              ))}
            </div>
          </div>
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
      </form>
    </div>
  );
}
