import {
  ChevronDown,
  ClipboardList,
  Edit3,
  Lightbulb,
  LoaderCircle,
  Pin,
  PinOff,
  Plus,
  RefreshCw,
  Save,
  Settings2,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import type {
  MemoryCategoryInput,
  MemoryDashboardData,
  MemoryInput,
} from "@/features/memories/actions";
import type {
  MemoryCategory,
  MemoryCategoryOption,
  MemoryRecord,
  MemorySuggestion,
} from "../types";

type MemoryFilter = "All" | MemoryCategory;
type EditorResult = Promise<boolean>;
type CategoryEditorResult = Promise<MemoryDashboardData | null>;
type SuggestionResult = Promise<boolean>;
type CategoryPeriod = "Weekly" | "Monthly";
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

const categoryPeriodWeights: Record<CategoryPeriod, number> = {
  Weekly: 1.2,
  Monthly: 0.8,
};

function panelClass(darkMode: boolean) {
  return darkMode
    ? "border-neutral-800 bg-black text-white"
    : "border-slate-300 bg-white text-slate-950";
}

function mutedText(darkMode: boolean) {
  return darkMode ? "text-neutral-400" : "text-slate-500";
}

function categoryClass(category: MemoryCategory, darkMode: boolean) {
  if (category === "Cuisine") {
    return darkMode
      ? "border-amber-400/40 bg-amber-500/15 text-amber-200"
      : "border-amber-200 bg-amber-50 text-amber-700";
  }

  return darkMode
    ? "border-cyan-400/40 bg-cyan-500/15 text-cyan-200"
    : "border-cyan-200 bg-cyan-50 text-cyan-700";
}

function buttonClass(darkMode: boolean, active = false) {
  if (active) {
    return darkMode
      ? "border-white bg-white text-black"
      : "border-slate-950 bg-slate-950 text-white";
  }

  return darkMode
    ? "border-neutral-700 text-neutral-200 hover:border-white"
    : "border-slate-300 text-slate-700 hover:border-slate-500";
}

function inputClass(darkMode: boolean) {
  return `w-full rounded-md border px-3 py-2 text-sm outline-none transition ${
    darkMode
      ? "border-neutral-700 bg-black text-white focus:border-white"
      : "border-slate-300 bg-white text-slate-950 focus:border-slate-600"
  }`;
}

function modalClass(darkMode: boolean) {
  return `relative max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-md border p-4 shadow-2xl ${
    darkMode
      ? "border-neutral-800 bg-black text-white"
      : "border-slate-200 bg-white text-slate-950"
  }`;
}

const emptyCategoryDraft: MemoryCategoryInput = {
  name: "",
  baseWeight: categoryPeriodWeights.Weekly,
};

function categoryPeriodFromWeight(baseWeight: number): CategoryPeriod {
  return Math.abs(baseWeight - categoryPeriodWeights.Monthly) <
    Math.abs(baseWeight - categoryPeriodWeights.Weekly)
    ? "Monthly"
    : "Weekly";
}

export function MemoriesPage({
  darkMode,
  categories,
  memoryRecords,
  suggestions,
  loading,
  pending,
  suggestionLoading,
  suggestionPending,
  suggestionMessage,
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
}: {
  darkMode: boolean;
  categories: MemoryCategoryOption[];
  memoryRecords: MemoryRecord[];
  suggestions: MemorySuggestion[];
  pinnedSuggestionIds: string[];
  loading: boolean;
  pending: boolean;
  suggestionLoading: boolean;
  suggestionPending: boolean;
  suggestionMessage: string | null;
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

  async function confirmDelete() {
    if (!confirmationTarget) {
      return;
    }

    if (confirmationTarget.type === "memory") {
      const deleted = await onMemoryDelete(confirmationTarget.id);

      if (deleted) {
        setMemoryEditorOpen(false);
        setConfirmationTarget(null);
      } else {
        setConfirmationTarget(null);
      }
      return;
    }

    const deleted = await onCategoryDelete(confirmationTarget.id);

    if (deleted) {
      setConfirmationTarget(null);
      setCategoryDraft(emptyCategoryDraft);
    } else {
      setConfirmationTarget(null);
    }
  }

  async function submitCategory() {
    const draft = categoryDraft;
    const saved = await onCategorySave(draft);

    if (saved) {
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
  }

  function selectCategoryPeriod(period: CategoryPeriod) {
    setCategoryDraft((current) => ({
      ...current,
      baseWeight: categoryPeriodWeights[period],
    }));
  }

  return (
    <>
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className={`min-w-0 rounded-md border ${panelClass(darkMode)}`}>
          <div
            className={`flex flex-col gap-3 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between ${
              darkMode ? "border-neutral-800" : "border-slate-200"
            }`}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <ClipboardList size={18} aria-hidden="true" />
                <h2 className="text-base font-semibold">Memories</h2>
              </div>
              <p className={`mt-1 text-sm ${mutedText(darkMode)}`}>
                Saved experiences to revisit when the day needs a gentle option.
              </p>
            </div>
            <button
              className={`flex h-9 shrink-0 items-center gap-2 rounded-md border px-3 text-xs font-semibold transition ${buttonClass(darkMode)}`}
              type="button"
              disabled={pending}
              onClick={openNewMemoryEditor}
            >
              <Plus size={15} aria-hidden="true" />
              Add
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 px-4 py-3">
            <span className={`text-xs font-semibold ${mutedText(darkMode)}`}>
              Categories:
            </span>
            {filters.map((item) => (
              <button
                key={item}
                className={`h-8 rounded-md border px-3 text-xs font-semibold transition ${buttonClass(darkMode, filter === item)}`}
                type="button"
                onClick={() => setFilter(item)}
              >
                {item}
              </button>
            ))}
            <button
              className={`flex h-8 items-center gap-2 rounded-md border px-3 text-xs font-semibold transition ${buttonClass(darkMode)}`}
              type="button"
              disabled={pending}
              onClick={() => {
                onMessageClear();
                setCategoryEditorOpen(true);
              }}
            >
              <Settings2 size={14} aria-hidden="true" />
              Manage
            </button>
          </div>

          <div
            className={
              darkMode
                ? "divide-y divide-neutral-900"
                : "divide-y divide-slate-200"
            }
          >
            {message ? (
              <p
                className={`px-4 py-4 text-sm ${
                  darkMode ? "text-amber-200" : "text-amber-700"
                }`}
              >
                {message}
              </p>
            ) : null}
            {loading ? (
              <p className={`px-4 py-4 text-sm ${mutedText(darkMode)}`}>
                Loading memories...
              </p>
            ) : null}
            {!loading && visibleMemories.length === 0 ? (
              <p className={`px-4 py-4 text-sm ${mutedText(darkMode)}`}>
                No memories found for this filter.
              </p>
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
        </section>

        <aside className={`rounded-md border ${panelClass(darkMode)}`}>
          <div
            className={`flex flex-col gap-3 border-b px-4 py-4 sm:flex-row sm:items-start sm:justify-between ${
              darkMode ? "border-neutral-800" : "border-slate-200"
            }`}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Lightbulb size={17} aria-hidden="true" />
                <h2 className="text-base font-semibold">Suggestions</h2>
              </div>
              <p className={`mt-1 text-sm ${mutedText(darkMode)}`}>
                To reexperience in a few days.
              </p>
            </div>
            <button
              className={`flex h-9 shrink-0 items-center gap-2 rounded-md border px-3 text-xs font-semibold transition ${buttonClass(darkMode)}`}
              type="button"
              disabled={suggestionLoading || suggestionPending}
              onClick={() => void onSuggestionsRefresh()}
            >
              {suggestionLoading ? (
                <LoaderCircle
                  className="animate-spin"
                  size={14}
                  aria-hidden="true"
                />
              ) : (
                <RefreshCw size={14} aria-hidden="true" />
              )}
              Refresh
            </button>
          </div>

          <div
            className={
              darkMode
                ? "divide-y divide-neutral-900"
                : "divide-y divide-slate-200"
            }
          >
            {suggestionMessage ? (
              <p
                className={`px-4 py-4 text-sm ${
                  darkMode ? "text-amber-200" : "text-amber-700"
                }`}
              >
                {suggestionMessage}
              </p>
            ) : null}
            {!suggestionsRequested && !suggestionLoading ? (
              <p className={`px-4 py-4 text-sm ${mutedText(darkMode)}`}>
                Click Refresh to load suggestions.
              </p>
            ) : null}
            {suggestionLoading ? (
              <p className={`px-4 py-4 text-sm ${mutedText(darkMode)}`}>
                Loading suggestions...
              </p>
            ) : null}
            {suggestionsRequested &&
            !suggestionLoading &&
            suggestions.length === 0 ? (
              <p className={`px-4 py-4 text-sm ${mutedText(darkMode)}`}>
                No suggestions available. Add more memories or unpin existing
                ones.
              </p>
            ) : null}
            {suggestions.map((suggestion) => (
              <SuggestionListItem
                key={suggestion.id}
                suggestion={suggestion}
                darkMode={darkMode}
                pending={suggestionPending}
                pinned={pinnedSuggestionIds.includes(suggestion.id)}
                onPin={() => void onSuggestionPin(suggestion.id)}
                onCancel={() => void onSuggestionCancel(suggestion.id)}
              />
            ))}
          </div>
        </aside>
      </section>

      {memoryEditorOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/65 px-4 py-6">
          <button
            className="absolute inset-0 cursor-default"
            type="button"
            aria-label="Close memory editor"
            onClick={closeMemoryEditor}
          />
          <form
            className={modalClass(darkMode)}
            onSubmit={(event) => {
              event.preventDefault();
              void submitMemory();
            }}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-base font-semibold">
                {editingMemory ? "Edit a memory" : "Add a new memory"}
              </h3>
              <button
                className={`flex h-9 w-9 items-center justify-center rounded-md transition ${
                  darkMode
                    ? "text-neutral-300 hover:bg-white/10 hover:text-white"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-950"
                }`}
                type="button"
                aria-label="Close memory editor"
                onClick={closeMemoryEditor}
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>
            {message ? (
              <p
                className={`mb-3 rounded-md border px-3 py-2 text-sm ${
                  darkMode
                    ? "border-amber-400/30 bg-amber-500/10 text-amber-200"
                    : "border-amber-200 bg-amber-50 text-amber-700"
                }`}
              >
                {message}
              </p>
            ) : null}
            <div className="grid gap-3">
              <label className="grid gap-1 text-xs font-semibold">
                Title
                <input
                  className={inputClass(darkMode)}
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
                    <button
                      key={category.id}
                      className={`h-8 rounded-md border px-3 text-xs font-semibold transition ${buttonClass(
                        darkMode,
                        memoryDraft.categoryId === category.id,
                      )}`}
                      type="button"
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
                    </button>
                  ))}
                  <button
                    className={`flex h-8 items-center gap-2 rounded-md border px-3 text-xs font-semibold transition ${buttonClass(darkMode)}`}
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      onMessageClear();
                      setCategoryEditorOpen(true);
                    }}
                  >
                    <Settings2 size={14} aria-hidden="true" />
                    Manage
                  </button>
                </div>
              </div>
              <label className="grid gap-1 text-xs font-semibold">
                Description
                <textarea
                  className={`${inputClass(darkMode)} min-h-28 resize-y`}
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
              <button
                className={`flex h-9 items-center gap-2 rounded-md border px-4 text-xs font-semibold transition ${buttonClass(darkMode, true)}`}
                type="submit"
                disabled={pending}
              >
                {pending ? (
                  <LoaderCircle
                    className="animate-spin"
                    size={14}
                    aria-hidden="true"
                  />
                ) : (
                  <Save size={14} aria-hidden="true" />
                )}
                Save
              </button>
              {editingMemory ? (
                <button
                  className={`flex h-9 items-center gap-2 rounded-md border px-3 text-xs font-semibold transition ${buttonClass(darkMode)}`}
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    memoryDraft.id
                      ? setConfirmationTarget({
                          type: "memory",
                          id: memoryDraft.id,
                          title: memoryDraft.title || "this memory",
                        })
                      : undefined
                  }
                >
                  <Trash2 size={14} aria-hidden="true" />
                  Delete
                </button>
              ) : null}
            </div>
          </form>
        </div>
      ) : null}

      {categoryEditorOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/65 px-4 py-6">
          <button
            className="absolute inset-0 cursor-default"
            type="button"
            aria-label="Close category editor"
            onClick={closeCategoryEditor}
          />
          <section className={modalClass(darkMode)}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-base font-semibold">Manage Categories</h3>
              <button
                className={`flex h-9 w-9 items-center justify-center rounded-md transition ${
                  darkMode
                    ? "text-neutral-300 hover:bg-white/10 hover:text-white"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-950"
                }`}
                type="button"
                aria-label="Close category editor"
                onClick={closeCategoryEditor}
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>
            {message ? (
              <p
                className={`mb-3 rounded-md border px-3 py-2 text-sm ${
                  darkMode
                    ? "border-amber-400/30 bg-amber-500/10 text-amber-200"
                    : "border-amber-200 bg-amber-50 text-amber-700"
                }`}
              >
                {message}
              </p>
            ) : null}
            <button
              className={`flex h-9 items-center gap-2 rounded-md border px-3 text-xs font-semibold transition ${buttonClass(darkMode)}`}
              type="button"
              disabled={pending}
              onClick={openNewCategoryEditor}
            >
              <Plus size={14} aria-hidden="true" />
              New category
            </button>
            <div
              className={`mt-3 ${
                darkMode
                  ? "divide-y divide-neutral-800"
                  : "divide-y divide-slate-200"
              }`}
            >
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {category.name}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      className={`flex h-8 w-8 items-center justify-center rounded-md border transition ${buttonClass(darkMode)}`}
                      type="button"
                      disabled={pending}
                      aria-label={`Edit ${category.name}`}
                      onClick={() => openCategoryEditor(category)}
                    >
                      <Edit3 size={14} aria-hidden="true" />
                    </button>
                    <button
                      className={`flex h-8 w-8 items-center justify-center rounded-md border transition ${buttonClass(darkMode)}`}
                      type="button"
                      disabled={pending}
                      aria-label={`Delete ${category.name}`}
                      onClick={() =>
                        setConfirmationTarget({
                          type: "category",
                          id: category.id,
                          title: category.name,
                        })
                      }
                    >
                      <Trash2 size={14} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : null}

      {categoryFormOpen ? (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/65 px-4 py-6">
          <button
            className="absolute inset-0 cursor-default"
            type="button"
            aria-label="Close category form"
            onClick={closeCategoryForm}
          />
          <form
            className={`${modalClass(darkMode)} max-w-md`}
            onSubmit={(event) => {
              event.preventDefault();
              void submitCategory();
            }}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-base font-semibold">
                {categoryDraft.id ? "Edit category" : "Add category"}
              </h3>
              <button
                className={`flex h-9 w-9 items-center justify-center rounded-md transition ${
                  darkMode
                    ? "text-neutral-300 hover:bg-white/10 hover:text-white"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-950"
                }`}
                type="button"
                aria-label="Close category form"
                onClick={closeCategoryForm}
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>
            {message ? (
              <p
                className={`mb-3 rounded-md border px-3 py-2 text-sm ${
                  darkMode
                    ? "border-amber-400/30 bg-amber-500/10 text-amber-200"
                    : "border-amber-200 bg-amber-50 text-amber-700"
                }`}
              >
                {message}
              </p>
            ) : null}
            <div className="grid gap-3">
              <label className="grid gap-1 text-xs font-semibold">
                Category name
                <input
                  className={inputClass(darkMode)}
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
                <span className="text-xs font-semibold">
                  Suggestion period
                </span>
                <div className="flex flex-wrap gap-2">
                  {(["Weekly", "Monthly"] as CategoryPeriod[]).map((period) => (
                    <button
                      key={period}
                      className={`h-8 rounded-md border px-3 text-xs font-semibold transition ${buttonClass(
                        darkMode,
                        categoryPeriodFromWeight(categoryDraft.baseWeight) ===
                          period,
                      )}`}
                      type="button"
                      disabled={pending}
                      onClick={() => selectCategoryPeriod(period)}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                className={`flex h-9 items-center gap-2 rounded-md border px-4 text-xs font-semibold transition ${buttonClass(darkMode, true)}`}
                type="submit"
                disabled={pending}
              >
                {pending ? (
                  <LoaderCircle
                    className="animate-spin"
                    size={14}
                    aria-hidden="true"
                  />
                ) : (
                  <Save size={14} aria-hidden="true" />
                )}
                Save
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {confirmationTarget ? (
        <ConfirmDialog
          darkMode={darkMode}
          pending={pending}
          title={`Delete ${confirmationTarget.type}`}
          description={`Delete "${confirmationTarget.title}"? This cannot be undone.`}
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

function ConfirmDialog({
  darkMode,
  pending,
  title,
  description,
  onCancel,
  onConfirm,
}: {
  darkMode: boolean;
  pending: boolean;
  title: string;
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/65 px-4 py-6">
      <button
        className="absolute inset-0 cursor-default"
        type="button"
        aria-label="Close confirmation"
        onClick={onCancel}
      />
      <section className={`${modalClass(darkMode)} max-w-md`}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-base font-semibold">{title}</h3>
          <button
            className={`flex h-9 w-9 items-center justify-center rounded-md transition ${
              darkMode
                ? "text-neutral-300 hover:bg-white/10 hover:text-white"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-950"
            }`}
            type="button"
            aria-label="Close confirmation"
            disabled={pending}
            onClick={onCancel}
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
        <p className={`text-sm leading-6 ${mutedText(darkMode)}`}>
          {description}
        </p>
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button
            className={`h-9 rounded-md border px-4 text-xs font-semibold transition ${buttonClass(darkMode)}`}
            type="button"
            disabled={pending}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className={`flex h-9 items-center gap-2 rounded-md border px-4 text-xs font-semibold transition ${buttonClass(darkMode, true)}`}
            type="button"
            disabled={pending}
            onClick={onConfirm}
          >
            {pending ? (
              <LoaderCircle
                className="animate-spin"
                size={14}
                aria-hidden="true"
              />
            ) : (
              <Trash2 size={14} aria-hidden="true" />
            )}
            Delete
          </button>
        </div>
      </section>
    </div>
  );
}

function MemoryListItem({
  memory,
  darkMode,
  selected,
  expanded,
  onToggle,
  onEdit,
}: {
  memory: MemoryRecord;
  darkMode: boolean;
  selected: boolean;
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
}) {
  return (
    <article
      className={`px-4 py-4 ${
        selected
          ? darkMode
            ? "bg-white/10"
            : "bg-slate-100"
          : ""
      }`}
    >
      <button
        className="grid w-full gap-3 text-left"
        type="button"
        aria-expanded={expanded}
        onClick={onToggle}
      >
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold">{memory.title}</h3>
              <span
                className={`rounded-md border px-2 py-0.5 text-xs font-semibold ${categoryClass(memory.category, darkMode)}`}
              >
                {memory.category}
              </span>
              {memory.pinned ? (
                <span
                  className={`rounded-md border px-2 py-0.5 text-xs font-semibold ${
                    darkMode
                      ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-200"
                      : "border-emerald-200 bg-emerald-50 text-emerald-700"
                  }`}
                >
                  Pinned
                </span>
              ) : null}
            </div>
            <p className={`mt-1 text-sm leading-6 ${mutedText(darkMode)}`}>
              {memory.description}
            </p>
            <p className={`mt-2 text-xs ${mutedText(darkMode)}`}>
              {memory.lastDoneText} · Done {memory.doneCount} times
            </p>
          </div>
          <ChevronDown
            className={`mt-1 shrink-0 transition ${expanded ? "rotate-180" : ""}`}
            size={16}
            aria-hidden="true"
          />
        </div>
      </button>
      {expanded ? (
        <div className="mt-3 flex justify-end">
          <button
            className={`flex h-9 shrink-0 items-center justify-center gap-2 rounded-md border px-3 text-xs font-semibold transition ${buttonClass(darkMode)}`}
            type="button"
            onClick={onEdit}
          >
            <Edit3 size={15} aria-hidden="true" />
            Edit
          </button>
        </div>
      ) : null}
    </article>
  );
}

function SuggestionListItem({
  suggestion,
  darkMode,
  pending,
  pinned,
  onPin,
  onCancel,
}: {
  suggestion: MemorySuggestion;
  darkMode: boolean;
  pending: boolean;
  pinned: boolean;
  onPin: () => void;
  onCancel: () => void;
}) {
  return (
    <article className="flex items-start gap-3 px-4 py-4">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold">{suggestion.title}</h3>
          <span
            className={`rounded-md border px-2 py-0.5 text-xs font-semibold ${categoryClass(suggestion.category, darkMode)}`}
          >
            {suggestion.category}
          </span>
        </div>
        <p className={`mt-1 text-xs leading-5 ${mutedText(darkMode)}`}>
          {suggestion.description}
        </p>
        <p className={`mt-2 text-xs ${mutedText(darkMode)}`}>
          {suggestion.lastDoneText} · Done {suggestion.doneCount} times
        </p>
      </div>
      <div className="shrink-0">
        <button
          className={`flex h-9 w-9 items-center justify-center rounded-full border transition ${buttonClass(darkMode, !pinned)}`}
          type="button"
          disabled={pending}
          aria-label={pinned ? "Cancel pin" : "Pin suggestion"}
          onClick={pinned ? onCancel : onPin}
        >
          {pending ? (
            <LoaderCircle
              className="animate-spin"
              size={15}
              aria-hidden="true"
            />
          ) : pinned ? (
            <PinOff size={14} aria-hidden="true" />
          ) : (
            <Pin size={14} aria-hidden="true" />
          )}
        </button>
      </div>
    </article>
  );
}
