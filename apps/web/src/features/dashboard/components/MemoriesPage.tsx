import {
  ClipboardList,
  Eye,
  Plus,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";
import { useState } from "react";
import type { MemoryCategory, MemoryRecord } from "../types";

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

export function MemoriesPage({
  darkMode,
  memoryRecords,
  loading,
  message,
  selectedMemoryId,
}: {
  darkMode: boolean;
  memoryRecords: MemoryRecord[];
  loading: boolean;
  message: string | null;
  selectedMemoryId: string | null;
}) {
  const [filter, setFilter] = useState<MemoryFilter>("All");
  const filters: MemoryFilter[] = [
    "All",
    ...Array.from(new Set(memoryRecords.map((memory) => memory.category))),
  ];
  const visibleMemories = memoryRecords.filter(
    (memory) => filter === "All" || memory.category === filter,
  );

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
            >
              <Plus size={15} aria-hidden="true" />
              Add
            </button>
            <button
              className={`flex h-9 items-center gap-2 rounded-md border px-3 text-xs font-semibold transition ${buttonClass(darkMode)}`}
              type="button"
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
}: {
  memory: MemoryRecord;
  darkMode: boolean;
  selected: boolean;
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
        >
          <Eye size={15} aria-hidden="true" />
          Detail
        </button>
      </div>
    </article>
  );
}
