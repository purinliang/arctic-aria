import {
  ClipboardList,
  Edit3,
  Eye,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import type {
  MemoryCategoryInput,
  MemoryInput,
} from "@/features/memories/actions";
import type {
  MemoryCategory,
  MemoryCategoryOption,
  MemoryRecord,
} from "../types";

type MemoryFilter = "All" | MemoryCategory;

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

const emptyCategoryDraft: MemoryCategoryInput = {
  name: "",
  baseWeight: 1,
};

export function MemoriesPage({
  darkMode,
  categories,
  memoryRecords,
  loading,
  pending,
  message,
  selectedMemoryId,
  onMemorySave,
  onMemoryDelete,
  onCategorySave,
  onCategoryDelete,
}: {
  darkMode: boolean;
  categories: MemoryCategoryOption[];
  memoryRecords: MemoryRecord[];
  loading: boolean;
  pending: boolean;
  message: string | null;
  selectedMemoryId: string | null;
  onMemorySave: (input: MemoryInput) => void;
  onMemoryDelete: (memoryId: string) => void;
  onCategorySave: (input: MemoryCategoryInput) => void;
  onCategoryDelete: (categoryId: string) => void;
}) {
  const [filter, setFilter] = useState<MemoryFilter>("All");
  const [memoryEditorOpen, setMemoryEditorOpen] = useState(false);
  const [categoryEditorOpen, setCategoryEditorOpen] = useState(false);
  const [memoryDraft, setMemoryDraft] = useState<MemoryInput>({
    categoryId: categories[0]?.id ?? "",
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
  const editingCategory = Boolean(categoryDraft.id);

  function openNewMemoryEditor() {
    setMemoryDraft({
      categoryId: categories[0]?.id ?? "",
      title: "",
      description: "",
    });
    setMemoryEditorOpen(true);
  }

  function openMemoryEditor(memory: MemoryRecord) {
    setMemoryDraft({
      id: memory.id,
      categoryId: memory.categoryId,
      title: memory.title,
      description: memory.description,
    });
    setMemoryEditorOpen(true);
  }

  function submitMemory() {
    onMemorySave(memoryDraft);
  }

  function submitCategory() {
    onCategorySave(categoryDraft);
  }

  return (
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
          <div className="flex shrink-0 flex-wrap gap-2">
            <button
              className={`flex h-9 items-center gap-2 rounded-md border px-3 text-xs font-semibold transition ${buttonClass(darkMode)}`}
              type="button"
              disabled={pending}
              onClick={openNewMemoryEditor}
            >
              <Plus size={15} aria-hidden="true" />
              Add
            </button>
            <button
              className={`flex h-9 items-center gap-2 rounded-md border px-3 text-xs font-semibold transition ${buttonClass(darkMode)}`}
              type="button"
              disabled={pending}
              onClick={() => setCategoryEditorOpen((open) => !open)}
            >
              <SlidersHorizontal size={15} aria-hidden="true" />
              Categories
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 px-4 py-3">
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
        </div>

        {memoryEditorOpen ? (
          <form
            className={`mx-4 mb-4 grid gap-3 rounded-md border p-4 ${
              darkMode
                ? "border-neutral-800 bg-neutral-950"
                : "border-slate-200 bg-slate-50"
            }`}
            onSubmit={(event) => {
              event.preventDefault();
              submitMemory();
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold">
                {editingMemory ? "Edit memory" : "Add memory"}
              </h3>
              <button
                className={`h-8 rounded-md border px-3 text-xs font-semibold transition ${buttonClass(darkMode)}`}
                type="button"
                onClick={() => setMemoryEditorOpen(false)}
              >
                Close
              </button>
            </div>
            <label className="grid gap-1 text-xs font-semibold">
              Category
              <select
                className={inputClass(darkMode)}
                value={memoryDraft.categoryId}
                disabled={pending}
                onChange={(event) =>
                  setMemoryDraft((current) => ({
                    ...current,
                    categoryId: event.target.value,
                  }))
                }
              >
                <option value="">Choose category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-xs font-semibold">
              Title
              <input
                className={inputClass(darkMode)}
                value={memoryDraft.title}
                maxLength={120}
                disabled={pending}
                onChange={(event) =>
                  setMemoryDraft((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
              />
            </label>
            <label className="grid gap-1 text-xs font-semibold">
              Description
              <textarea
                className={`${inputClass(darkMode)} min-h-24 resize-y`}
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
            <div className="flex flex-wrap gap-2">
              <button
                className={`h-9 rounded-md border px-3 text-xs font-semibold transition ${buttonClass(darkMode, true)}`}
                type="submit"
                disabled={pending}
              >
                Save
              </button>
              {editingMemory ? (
                <button
                  className={`flex h-9 items-center gap-2 rounded-md border px-3 text-xs font-semibold transition ${buttonClass(darkMode)}`}
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    if (window.confirm("Delete this memory?")) {
                      onMemoryDelete(memoryDraft.id ?? "");
                    }
                  }}
                >
                  <Trash2 size={14} aria-hidden="true" />
                  Delete
                </button>
              ) : null}
            </div>
          </form>
        ) : null}

        {categoryEditorOpen ? (
          <div
            className={`mx-4 mb-4 grid gap-3 rounded-md border p-4 ${
              darkMode
                ? "border-neutral-800 bg-neutral-950"
                : "border-slate-200 bg-slate-50"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold">Categories</h3>
              <button
                className={`h-8 rounded-md border px-3 text-xs font-semibold transition ${buttonClass(darkMode)}`}
                type="button"
                onClick={() => setCategoryDraft(emptyCategoryDraft)}
              >
                New
              </button>
            </div>
            <form
              className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_110px_auto]"
              onSubmit={(event) => {
                event.preventDefault();
                submitCategory();
              }}
            >
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
              <input
                className={inputClass(darkMode)}
                value={categoryDraft.baseWeight}
                min="0.1"
                step="0.1"
                type="number"
                disabled={pending}
                onChange={(event) =>
                  setCategoryDraft((current) => ({
                    ...current,
                    baseWeight: Number(event.target.value),
                  }))
                }
              />
              <button
                className={`h-10 rounded-md border px-3 text-xs font-semibold transition ${buttonClass(darkMode, true)}`}
                type="submit"
                disabled={pending}
              >
                {editingCategory ? "Update" : "Add"}
              </button>
            </form>
            <div
              className={
                darkMode
                  ? "divide-y divide-neutral-800"
                  : "divide-y divide-slate-200"
              }
            >
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between gap-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {category.name}
                    </p>
                    <p className={`text-xs ${mutedText(darkMode)}`}>
                      Weight {category.baseWeight}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      className={`flex h-8 w-8 items-center justify-center rounded-md border transition ${buttonClass(darkMode)}`}
                      type="button"
                      disabled={pending}
                      aria-label={`Edit ${category.name}`}
                      onClick={() =>
                        setCategoryDraft({
                          id: category.id,
                          name: category.name,
                          baseWeight: category.baseWeight,
                        })
                      }
                    >
                      <Edit3 size={14} aria-hidden="true" />
                    </button>
                    <button
                      className={`flex h-8 w-8 items-center justify-center rounded-md border transition ${buttonClass(darkMode)}`}
                      type="button"
                      disabled={pending}
                      aria-label={`Delete ${category.name}`}
                      onClick={() => {
                        if (window.confirm("Delete this category?")) {
                          onCategoryDelete(category.id);
                        }
                      }}
                    >
                      <Trash2 size={14} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div
          className={
            darkMode ? "divide-y divide-neutral-900" : "divide-y divide-slate-200"
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
              onEdit={() => openMemoryEditor(memory)}
            />
          ))}
        </div>
      </section>

      <aside className={`rounded-md border ${panelClass(darkMode)}`}>
        <div
          className={`border-b px-4 py-4 ${
            darkMode ? "border-neutral-800" : "border-slate-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <RefreshCw size={17} aria-hidden="true" />
            <h2 className="text-base font-semibold">Suggestions</h2>
          </div>
          <p className={`mt-1 text-sm ${mutedText(darkMode)}`}>
            Manual refresh preview for the future Memories page.
          </p>
        </div>

        <div
          className={
            darkMode ? "divide-y divide-neutral-900" : "divide-y divide-slate-200"
          }
        >
          <p className={`px-4 py-4 text-sm ${mutedText(darkMode)}`}>
            Suggestions will use saved database memories after the suggestion
            service is added.
          </p>
        </div>
      </aside>
    </section>
  );
}

function MemoryListItem({
  memory,
  darkMode,
  selected,
  onEdit,
}: {
  memory: MemoryRecord;
  darkMode: boolean;
  selected: boolean;
  onEdit: () => void;
}) {
  return (
    <article
      className={`grid gap-3 px-4 py-4 ${
        selected
          ? darkMode
            ? "bg-white/10"
            : "bg-slate-100"
          : ""
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
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
        <button
          className={`flex h-9 shrink-0 items-center justify-center gap-2 rounded-md border px-3 text-xs font-semibold transition ${buttonClass(darkMode)}`}
          type="button"
          onClick={onEdit}
        >
          <Eye size={15} aria-hidden="true" />
          Edit
        </button>
      </div>
    </article>
  );
}
