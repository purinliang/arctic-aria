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
import {
  DashboardButton,
  DashboardPanel,
  InlineMessage,
  ListItem,
  Tag,
  TextArea,
  TextInput,
  cx,
  dividerClass,
  modalClass,
  mutedTextClass,
  sectionBorderClass,
} from "./ui/primitives";

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

const emptyCategoryDraft: MemoryCategoryInput = {
  name: "",
  baseWeight: categoryPeriodWeights.Weekly,
};

function categoryTone(category: MemoryCategory) {
  return category === "Cuisine" ? "amber" : "cyan";
}

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
        <DashboardPanel darkMode={darkMode} className="min-w-0">
          <div
            className={cx(
              "flex flex-col gap-3 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between",
              sectionBorderClass(darkMode),
            )}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <ClipboardList size={18} aria-hidden="true" />
                <h2 className="text-base font-semibold">Memories</h2>
              </div>
              <p className={`mt-1 text-sm ${mutedTextClass(darkMode)}`}>
                Saved experiences to revisit when the day needs a gentle option.
              </p>
            </div>
            <DashboardButton
              darkMode={darkMode}
              disabled={pending}
              icon={<Plus size={15} aria-hidden="true" />}
              onClick={openNewMemoryEditor}
            >
              Add
            </DashboardButton>
          </div>

          <div className="flex flex-wrap items-center gap-2 px-4 py-3">
            <span className={`text-xs font-semibold ${mutedTextClass(darkMode)}`}>
              Categories:
            </span>
            {filters.map((item) => (
              <DashboardButton
                key={item}
                darkMode={darkMode}
                size="xs"
                active={filter === item}
                onClick={() => setFilter(item)}
              >
                {item}
              </DashboardButton>
            ))}
            <DashboardButton
              darkMode={darkMode}
              size="xs"
              disabled={pending}
              icon={<Settings2 size={14} aria-hidden="true" />}
              onClick={() => {
                onMessageClear();
                setCategoryEditorOpen(true);
              }}
            >
              Manage
            </DashboardButton>
          </div>

          <div className={dividerClass(darkMode)}>
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
              <p className={`px-4 py-4 text-sm ${mutedTextClass(darkMode)}`}>
                Loading memories...
              </p>
            ) : null}
            {!loading && visibleMemories.length === 0 ? (
              <p className={`px-4 py-4 text-sm ${mutedTextClass(darkMode)}`}>
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
        </DashboardPanel>

        <DashboardPanel darkMode={darkMode}>
          <div
            className={cx(
              "flex flex-col gap-3 border-b px-4 py-4 sm:flex-row sm:items-start sm:justify-between",
              sectionBorderClass(darkMode),
            )}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Lightbulb size={17} aria-hidden="true" />
                <h2 className="text-base font-semibold">Suggestions</h2>
              </div>
              <p className={`mt-1 text-sm ${mutedTextClass(darkMode)}`}>
                To reexperience in a few days.
              </p>
            </div>
            <DashboardButton
              darkMode={darkMode}
              disabled={suggestionLoading || suggestionPending}
              icon={
                suggestionLoading ? (
                  <LoaderCircle
                    className="animate-spin"
                    size={14}
                    aria-hidden="true"
                  />
                ) : (
                  <RefreshCw size={14} aria-hidden="true" />
                )
              }
              onClick={() => void onSuggestionsRefresh()}
            >
              Refresh
            </DashboardButton>
          </div>

          <div className={dividerClass(darkMode)}>
            {!suggestionsRequested && !suggestionLoading ? (
              <p className={`px-4 py-4 text-sm ${mutedTextClass(darkMode)}`}>
                Click Refresh to load suggestions.
              </p>
            ) : null}
            {suggestionLoading ? (
              <p className={`px-4 py-4 text-sm ${mutedTextClass(darkMode)}`}>
                Loading suggestions...
              </p>
            ) : null}
            {suggestionsRequested &&
            !suggestionLoading &&
            suggestions.length === 0 ? (
              <p className={`px-4 py-4 text-sm ${mutedTextClass(darkMode)}`}>
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
        </DashboardPanel>
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
              <DashboardButton
                darkMode={darkMode}
                tone="ghost"
                size="icon-sm"
                aria-label="Close memory editor"
                icon={<X size={16} aria-hidden="true" />}
                onClick={closeMemoryEditor}
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
                    <DashboardButton
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
                    </DashboardButton>
                  ))}
                  <DashboardButton
                    darkMode={darkMode}
                    size="xs"
                    disabled={pending}
                    icon={<Settings2 size={14} aria-hidden="true" />}
                    onClick={() => {
                      onMessageClear();
                      setCategoryEditorOpen(true);
                    }}
                  >
                    Manage
                  </DashboardButton>
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
              <DashboardButton
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
              </DashboardButton>
              {editingMemory ? (
                <DashboardButton
                  darkMode={darkMode}
                  disabled={pending}
                  icon={<Trash2 size={14} aria-hidden="true" />}
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
                  Delete
                </DashboardButton>
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
              <DashboardButton
                darkMode={darkMode}
                tone="ghost"
                size="icon-sm"
                aria-label="Close category editor"
                icon={<X size={16} aria-hidden="true" />}
                onClick={closeCategoryEditor}
              />
            </div>
            {message ? (
              <InlineMessage darkMode={darkMode} className="mb-3">
                {message}
              </InlineMessage>
            ) : null}
            <DashboardButton
              darkMode={darkMode}
              disabled={pending}
              icon={<Plus size={14} aria-hidden="true" />}
              onClick={openNewCategoryEditor}
            >
              New category
            </DashboardButton>
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
                    <DashboardButton
                      darkMode={darkMode}
                      size="icon-sm"
                      className="h-8 w-8"
                      disabled={pending}
                      aria-label={`Edit ${category.name}`}
                      icon={<Edit3 size={14} aria-hidden="true" />}
                      onClick={() => openCategoryEditor(category)}
                    />
                    <DashboardButton
                      darkMode={darkMode}
                      size="icon-sm"
                      className="h-8 w-8"
                      disabled={pending}
                      aria-label={`Delete ${category.name}`}
                      icon={<Trash2 size={14} aria-hidden="true" />}
                      onClick={() =>
                        setConfirmationTarget({
                          type: "category",
                          id: category.id,
                          title: category.name,
                        })
                      }
                    />
                  </div>
                </ListItem>
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
            className={cx(modalClass(darkMode), "max-w-md")}
            onSubmit={(event) => {
              event.preventDefault();
              void submitCategory();
            }}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-base font-semibold">
                {categoryDraft.id ? "Edit category" : "Add category"}
              </h3>
              <DashboardButton
                darkMode={darkMode}
                tone="ghost"
                size="icon-sm"
                aria-label="Close category form"
                icon={<X size={16} aria-hidden="true" />}
                onClick={closeCategoryForm}
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
                <span className="text-xs font-semibold">
                  Suggestion period
                </span>
                <div className="flex flex-wrap gap-2">
                  {(["Weekly", "Monthly"] as CategoryPeriod[]).map((period) => (
                    <DashboardButton
                      key={period}
                      darkMode={darkMode}
                      size="xs"
                      active={
                        categoryPeriodFromWeight(categoryDraft.baseWeight) ===
                        period
                      }
                      disabled={pending}
                      onClick={() => selectCategoryPeriod(period)}
                    >
                      {period}
                    </DashboardButton>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <DashboardButton
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
              </DashboardButton>
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
      <section className={cx(modalClass(darkMode), "max-w-md")}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-base font-semibold">{title}</h3>
          <DashboardButton
            darkMode={darkMode}
            tone="ghost"
            size="icon-sm"
            aria-label="Close confirmation"
            disabled={pending}
            icon={<X size={16} aria-hidden="true" />}
            onClick={onCancel}
          />
        </div>
        <p className={`text-sm leading-6 ${mutedTextClass(darkMode)}`}>
          {description}
        </p>
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <DashboardButton
            darkMode={darkMode}
            disabled={pending}
            onClick={onCancel}
          >
            Cancel
          </DashboardButton>
          <DashboardButton
            darkMode={darkMode}
            tone="primary"
            disabled={pending}
            icon={
              pending ? (
                <LoaderCircle
                  className="animate-spin"
                  size={14}
                  aria-hidden="true"
                />
              ) : (
                <Trash2 size={14} aria-hidden="true" />
              )
            }
            onClick={onConfirm}
          >
            Delete
          </DashboardButton>
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
    <ListItem
      darkMode={darkMode}
      className={cx(
        "block",
        selected && (darkMode ? "bg-white/10" : "bg-slate-100"),
      )}
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
              <Tag darkMode={darkMode} tone={categoryTone(memory.category)}>
                {memory.category}
              </Tag>
              {memory.pinned ? (
                <Tag darkMode={darkMode} tone="emerald">
                  Pinned
                </Tag>
              ) : null}
            </div>
            <p className={`mt-1 text-sm leading-6 ${mutedTextClass(darkMode)}`}>
              {memory.description}
            </p>
            <p className={`mt-2 text-xs ${mutedTextClass(darkMode)}`}>
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
          <DashboardButton
            darkMode={darkMode}
            icon={<Edit3 size={15} aria-hidden="true" />}
            onClick={onEdit}
          >
            Edit
          </DashboardButton>
        </div>
      ) : null}
    </ListItem>
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
    <ListItem darkMode={darkMode} className="gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold">{suggestion.title}</h3>
          <Tag darkMode={darkMode} tone={categoryTone(suggestion.category)}>
            {suggestion.category}
          </Tag>
        </div>
        <p className={`mt-1 text-xs leading-5 ${mutedTextClass(darkMode)}`}>
          {suggestion.description}
        </p>
        <p className={`mt-2 text-xs ${mutedTextClass(darkMode)}`}>
          {suggestion.lastDoneText} · Done {suggestion.doneCount} times
        </p>
      </div>
      <div className="shrink-0">
        <DashboardButton
          darkMode={darkMode}
          size="icon-sm"
          active={!pinned}
          className="rounded-full"
          disabled={pending}
          aria-label={pinned ? "Cancel pin" : "Pin suggestion"}
          icon={
            pending ? (
              <LoaderCircle
                className="animate-spin"
                size={15}
                aria-hidden="true"
              />
            ) : pinned ? (
              <PinOff size={14} aria-hidden="true" />
            ) : (
              <Pin size={14} aria-hidden="true" />
            )
          }
          onClick={pinned ? onCancel : onPin}
        />
      </div>
    </ListItem>
  );
}
