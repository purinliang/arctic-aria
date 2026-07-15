import { Trash2 } from "lucide-react";
import { useState } from "react";
import { dividerClass } from "@/components/color";
import { ConfirmDialog } from "@/components/dialog";
import { Panel } from "@/components/panel";
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
import { CategoryManagerDialog } from "./CategoryManagerDialog";
import { MemoryEditorDialog } from "./MemoryEditorDialog";
import {
  EmptyLine,
  MemoryFilters,
  MemoryPanelHeader,
  PageMessage,
  SuggestionsPanel,
} from "./MemoriesPanels";
import { MemoryListItem } from "./MemoryListItem";
import {
  emptyCategoryDraft,
  type MemoryFilter,
} from "./memory-page-helpers";

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
  message,
  selectedMemoryId,
  onMemorySave,
  onMemoryDelete,
  onCategorySave,
  onCategoryDelete,
  onMessageClear,
  onSuggestionsRefresh,
  onSuggestionPin,
  onSuggestionCancel,
  pinnedSuggestionIds,
  pendingSuggestionIds,
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
  message: string | null;
  selectedMemoryId: string | null;
  onMemorySave: (input: MemoryInput) => EditorResult;
  onMemoryDelete: (memoryId: string) => EditorResult;
  onCategorySave: (input: MemoryCategoryInput) => CategoryEditorResult;
  onCategoryDelete: (categoryId: string) => EditorResult;
  onMessageClear: () => void;
  onSuggestionsRefresh: () => Promise<void>;
  onSuggestionPin: (memoryId: string) => SuggestionResult;
  onSuggestionCancel: (memoryId: string) => SuggestionResult;
}) {
  const [filter, setFilter] = useState<MemoryFilter>("All");
  const [expandedMemoryId, setExpandedMemoryId] = useState<string | null>(
    selectedMemoryId,
  );
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
  const filters: MemoryFilter[] = [
    "All",
    ...Array.from(new Set(memoryRecords.map((memory) => memory.category))),
  ];
  const visibleMemories = memoryRecords.filter(
    (memory) => filter === "All" || memory.category === filter,
  );
  const editingMemory = Boolean(memoryDraft.id);

  function closeMemoryEditor() {
    if (!pending) {
      setMemoryEditorOpen(false);
      onMessageClear();
    }
  }

  function closeCategoryEditor() {
    if (!pending) {
      setCategoryEditorOpen(false);
      setCategoryFormOpen(false);
      setCategoryDraft(emptyCategoryDraft);
      onMessageClear();
    }
  }

  function closeCategoryForm() {
    if (!pending) {
      setCategoryFormOpen(false);
      setCategoryDraft(emptyCategoryDraft);
      onMessageClear();
    }
  }

  function openNewMemoryEditor() {
    setMemoryDraft({
      categoryId: "",
      categoryName: "",
      title: "",
      description: "",
    });
    onMessageClear();
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
    onMessageClear();
    setMemoryEditorOpen(true);
  }

  function openManageCategories() {
    onMessageClear();
    setCategoryEditorOpen(true);
  }

  function openNewCategoryEditor() {
    setCategoryDraft(emptyCategoryDraft);
    onMessageClear();
    setCategoryFormOpen(true);
  }

  function openCategoryEditor(category: MemoryCategoryOption) {
    setCategoryDraft({
      id: category.id,
      name: category.name,
      baseWeight: category.baseWeight,
    });
    onMessageClear();
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
          <Panel darkMode={darkMode} className="min-w-0">
            <MemoryPanelHeader
              darkMode={darkMode}
              pending={pending}
              onAdd={openNewMemoryEditor}
            />
            <MemoryFilters
              darkMode={darkMode}
              filter={filter}
              filters={filters}
              pending={pending}
              onFilterChange={setFilter}
              onManage={openManageCategories}
            />
            <div className={dividerClass(darkMode)}>
              <PageMessage darkMode={darkMode} message={message} />
              {loading ? (
                <EmptyLine darkMode={darkMode} text="Loading memories..." />
              ) : null}
              {!loading && visibleMemories.length === 0 ? (
                <EmptyLine
                  darkMode={darkMode}
                  text="No memories found for this filter."
                />
              ) : null}
              {visibleMemories.map((memory) => (
                <MemoryListItem
                  key={memory.id}
                  memory={memory}
                  darkMode={darkMode}
                  selected={memory.id === selectedMemoryId}
                  expanded={expandedMemoryId === memory.id}
                  onToggle={() =>
                    setExpandedMemoryId((current) =>
                      current === memory.id ? null : memory.id,
                    )
                  }
                  onEdit={() => openMemoryEditor(memory)}
                />
              ))}
            </div>
          </Panel>

          <SuggestionsPanel
            darkMode={darkMode}
            suggestions={suggestions}
            suggestionLoading={suggestionLoading}
            suggestionsRequested={suggestionsRequested}
            pinnedSuggestionIds={pinnedSuggestionIds}
            pendingSuggestionIds={pendingSuggestionIds}
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
          onClose={closeMemoryEditor}
          onSubmit={() => void submitMemory()}
          onManageCategories={openManageCategories}
          onDelete={() =>
            memoryDraft.id
              ? setConfirmationTarget({
                  type: "memory",
                  id: memoryDraft.id,
                  title: memoryDraft.title || "this memory",
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
          title={`Delete ${confirmationTarget.type}`}
          description={`Delete "${confirmationTarget.title}"? This cannot be undone.`}
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
