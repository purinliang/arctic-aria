import {
  LoaderCircle,
  Save,
  Settings2,
  Trash2,
  X,
} from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { Button } from "@/components/button";
import { dialogFrameClass } from "@/components/dialog";
import { TextArea, TextInput } from "@/components/input-field";
import { InlineMessage } from "@/components/text";
import type { MemoryCategoryOption } from "@/features/dashboard/types";
import type { MemoryInput } from "@/features/memories/actions";

export function MemoryEditorDialog({
  darkMode,
  pending,
  message,
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
  message: string | null;
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
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/65 px-4 py-6">
      <button
        className="absolute inset-0 cursor-default"
        type="button"
        aria-label="Close memory editor"
        onClick={onClose}
      />
      <form
        className={dialogFrameClass(darkMode)}
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-base font-semibold">
            {editingMemory ? "Edit a memory" : "Add a new memory"}
          </h3>
          <Button
            darkMode={darkMode}
            tone="ghost"
            size="icon-sm"
            aria-label="Close memory editor"
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
            Title
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
          </label>
          <div className="grid gap-2">
            <span className="text-xs font-semibold">Category</span>
            <div className="flex flex-wrap items-center gap-2">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  darkMode={darkMode}
                  size="xs"
                  active={memoryDraft.categoryId === category.id}
                  disabled={pending}
                  onClick={() =>
                    setMemoryDraft((current) => ({
                      ...current,
                      categoryId: category.id,
                      categoryName: category.name,
                    }))
                  }
                >
                  {category.name}
                </Button>
              ))}
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
          <label className="grid gap-1 text-xs font-semibold">
            Description
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
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            darkMode={darkMode}
            tone="primary"
            type="submit"
            disabled={pending}
            icon={
              pending ? (
                <LoaderCircle
                  className="animate-spin"
                  size={14}
                  aria-hidden="true"
                />
              ) : (
                <Save size={14} aria-hidden="true" />
              )
            }
          >
            Save
          </Button>
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
        </div>
      </form>
    </div>
  );
}
