// Memories Page.
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { ConfirmDialog } from "@/components/dialog";
import type {
  MemoryCategoryOption,
  MemoryRecord,
  MemorySuggestion,
} from "@/features/dashboard/types";
import type {
  MemoryCategoryInput,
  MemoryDashboardData,
  MemoryInput,
} from "@/features/memories/actions";
import type { MemoryMessages } from "@/messages/app-messages";
import type { FormMessages } from "@/messages/app-messages";
import { CategoryManagerDialog } from "./CategoryManagerDialog";
import { MemoryEditorDialog } from "./MemoryEditorDialog";
import { MemoriesPanel } from "./MemoriesPanel";
import { SuggestionsPanel } from "./SuggestionsPanel";
import { emptyCategoryDraft } from "./memory-page-helpers";
import type { MemoryFilter } from "./memory-page-helpers";

type EditorResult = Promise<boolean>;
type CategoryEditorResult = Promise<MemoryDashboardData | null>;
type SuggestionResult = Promise<boolean>;
type ConfirmationTarget =
  | {
      type: "memory";
      id: string;
      title: string;
    }
  | {
      type: "category";
      id: string;
      title: string;
    };

export function MemoriesPage({
  darkMode,
  categories,
  memoryRecords,
  suggestions,
  loading,
  pending,
  suggestionLoading,
  suggestionsRequested,
  onMemorySave,
  onMemoryDelete,
  onCategorySave,
  onCategoryDelete,
  onSuggestionsRefresh,
  onSuggestionPin,
  onSuggestionCancel,
  pinnedSuggestionIds,
  pendingSuggestionIds,
  messages,
  formMessages,
}: {
  darkMode: boolean;
  categories: MemoryCategoryOption[];
  memoryRecords: MemoryRecord[];
  suggestions: MemorySuggestion[];
  pinnedSuggestionIds: string[];
  pendingSuggestionIds: string[];
  loading: boolean;
  pending: boolean;
  suggestionLoading: boolean;
  suggestionsRequested: boolean;
  onMemorySave: (input: MemoryInput) => EditorResult;
  onMemoryDelete: (memoryId: string) => EditorResult;
  onCategorySave: (input: MemoryCategoryInput) => CategoryEditorResult;
  onCategoryDelete: (categoryId: string) => EditorResult;
  onSuggestionsRefresh: () => Promise<void>;
  onSuggestionPin: (memoryId: string) => SuggestionResult;
  onSuggestionCancel: (memoryId: string) => SuggestionResult;
  messages: MemoryMessages;
  formMessages: FormMessages;
}) {
  const [filter, setFilter] = useState<MemoryFilter>("All");
  const [memoryEditorOpen, setMemoryEditorOpen] = useState(false);
  const [categoryEditorOpen, setCategoryEditorOpen] = useState(false);
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [confirmationTarget, setConfirmationTarget] =
    useState<ConfirmationTarget | null>(null);
  const [memoryDraft, setMemoryDraft] = useState<MemoryInput>({
    categoryId: categories[0]?.id ?? "",
    categoryName: categories[0]?.name,
    title: "",
    description: "",
  });
  const [categoryDraft, setCategoryDraft] =
    useState<MemoryCategoryInput>(emptyCategoryDraft);
  const visibleMemories = memoryRecords.filter(
    (memory) => filter === "All" || memory.category === filter,
  );
  const editingMemory = Boolean(memoryDraft.id);

  function closeMemoryEditor() {
    if (!pending) {
      setMemoryEditorOpen(false);
    }
  }

  function closeCategoryEditor() {
    if (!pending) {
      setCategoryEditorOpen(false);
      setCategoryFormOpen(false);
      setCategoryDraft(emptyCategoryDraft);
    }
  }

  function closeCategoryForm() {
    if (!pending) {
      setCategoryFormOpen(false);
      setCategoryDraft(emptyCategoryDraft);
    }
  }

  function openNewMemoryEditor() {
    setMemoryDraft({
      categoryId: "",
      categoryName: "",
      title: "",
      description: "",
    });
    setMemoryEditorOpen(true);
  }

  function openMemoryEditor(memory: MemoryRecord) {
    setMemoryDraft({
      id: memory.id,
      categoryId: memory.categoryId,
      categoryName: memory.category,
      title: memory.title,
      description: memory.description,
    });
    setMemoryEditorOpen(true);
  }

  function openManageCategories() {
    setCategoryEditorOpen(true);
  }

  function openNewCategoryEditor() {
    setCategoryDraft(emptyCategoryDraft);
    setCategoryFormOpen(true);
  }

  function openCategoryEditor(category: MemoryCategoryOption) {
    if (category.builtInKey) {
      return;
    }

    setCategoryDraft({
      id: category.id,
      name: category.name,
      description: category.description,
    });
    setCategoryFormOpen(true);
  }

  async function submitMemory() {
    const saved = await onMemorySave(memoryDraft);

    if (saved) {
      setMemoryEditorOpen(false);
    }
  }

  async function submitCategory() {
    const draft = categoryDraft;
    const saved = await onCategorySave(draft);

    if (!saved) {
      return;
    }

    const savedCategory = draft.id
      ? saved.categories.find((category) => category.id === draft.id)
      : saved.categories.find(
          (category) =>
            category.name.toLocaleLowerCase() ===
            draft.name.trim().toLocaleLowerCase(),
        );

    if (savedCategory) {
      setMemoryDraft((current) => ({
        ...current,
        categoryId: savedCategory.id,
        categoryName: savedCategory.name,
      }));
    }

    setCategoryDraft(emptyCategoryDraft);
    setCategoryFormOpen(false);
  }

  async function confirmDelete() {
    if (!confirmationTarget) {
      return;
    }

    if (confirmationTarget.type === "memory") {
      const deleted = await onMemoryDelete(confirmationTarget.id);

      if (deleted) {
        setMemoryEditorOpen(false);
      }
      setConfirmationTarget(null);
      return;
    }

    const deleted = await onCategoryDelete(confirmationTarget.id);

    if (deleted) {
      setCategoryDraft(emptyCategoryDraft);
    }
    setConfirmationTarget(null);
  }

  return (
    <>
      <section className="aa-split-container">
        <div className="aa-split-panel gap-4">
          <MemoriesPanel
            darkMode={darkMode}
            loading={loading}
            pending={pending}
            filter={filter}
            categories={categories}
            memories={visibleMemories}
            messages={messages.panel}
            dateMessages={formMessages.datePicker}
            onAdd={openNewMemoryEditor}
            onFilterChange={setFilter}
            onManage={openManageCategories}
            onEditMemory={openMemoryEditor}
          />

          <SuggestionsPanel
            darkMode={darkMode}
            suggestions={suggestions}
            suggestionLoading={suggestionLoading}
            suggestionsRequested={suggestionsRequested}
            pinnedSuggestionIds={pinnedSuggestionIds}
            pendingSuggestionIds={pendingSuggestionIds}
            messages={messages.suggestions}
            dateMessages={formMessages.datePicker}
            onSuggestionsRefresh={onSuggestionsRefresh}
            onSuggestionPin={onSuggestionPin}
            onSuggestionCancel={onSuggestionCancel}
          />
        </div>
      </section>

      {memoryEditorOpen ? (
        <MemoryEditorDialog
          darkMode={darkMode}
          pending={pending}
          editingMemory={editingMemory}
          memoryDraft={memoryDraft}
          categories={categories}
          setMemoryDraft={setMemoryDraft}
          messages={messages.editor}
          onClose={closeMemoryEditor}
          onSubmit={() => void submitMemory()}
          onManageCategories={openManageCategories}
          onDelete={() =>
            memoryDraft.id
              ? setConfirmationTarget({
                  type: "memory",
                  id: memoryDraft.id,
                  title: memoryDraft.title || messages.confirm.fallbackMemory,
                })
              : undefined
          }
        />
      ) : null}

      {categoryEditorOpen ? (
        <CategoryManagerDialog
          darkMode={darkMode}
          pending={pending}
          categories={categories}
          categoryDraft={categoryDraft}
          categoryFormOpen={categoryFormOpen}
          messages={messages.categories}
          setCategoryDraft={setCategoryDraft}
          onCloseEditor={closeCategoryEditor}
          onCloseForm={closeCategoryForm}
          onOpenNew={openNewCategoryEditor}
          onOpenEdit={openCategoryEditor}
          onSubmit={() => void submitCategory()}
          onDelete={(category) =>
            setConfirmationTarget({
              type: "category",
              id: category.id,
              title: category.name,
            })
          }
        />
      ) : null}

      {confirmationTarget ? (
        <ConfirmDialog
          darkMode={darkMode}
          pending={pending}
          title={
            confirmationTarget.type === "memory"
              ? messages.confirm.memoryTitle
              : messages.confirm.categoryTitle
          }
          description={messages.confirm.description(confirmationTarget.title)}
          cancelText={messages.confirm.cancel}
          confirmText={messages.confirm.confirm}
          closeLabel={messages.confirm.close}
          confirmIcon={<Trash2 size={14} aria-hidden="true" />}
          onCancel={() => {
            if (!pending) {
              setConfirmationTarget(null);
            }
          }}
          onConfirm={() => void confirmDelete()}
        />
      ) : null}
    </>
  );
}
