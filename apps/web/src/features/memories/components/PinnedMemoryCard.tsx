import { Check, ChevronDown, Eye, RefreshCw, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mutedTextClass } from "@/components/ui/color";
import { Tag } from "@/components/ui/tag";
import type { PinnedMemory } from "@/features/dashboard/types";

const actionIconSize = 15;
const actionButtonClass = "basis-[96px] grow px-2";

export function PinnedMemoryCard({
  memory,
  darkMode,
  disabled,
  expanded,
  onDone,
  onCancelDone,
  onReplace,
  onView,
  onToggleExpanded,
}: {
  memory: PinnedMemory;
  darkMode: boolean;
  disabled: boolean;
  expanded: boolean;
  onDone: () => void;
  onCancelDone: () => void;
  onReplace: () => void;
  onView: () => void;
  onToggleExpanded: () => void;
}) {
  const completed = memory.status === "completed";

  return (
    <article>
      <button
        className={`grid w-full grid-cols-[1fr_auto] items-start gap-3 px-4 py-4 text-left transition ${
          completed
            ? darkMode
              ? "bg-emerald-500/5"
              : "bg-emerald-50/60"
            : darkMode
              ? "hover:bg-neutral-900"
              : "hover:bg-slate-50"
        }`}
        type="button"
        aria-expanded={expanded}
        disabled={disabled}
        onClick={onToggleExpanded}
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="min-w-0 text-sm font-semibold">
              {memory.title}
            </h3>
            <Tag darkMode={darkMode} tone={categoryTone(memory.category)}>
              {memory.category}
            </Tag>
          </div>
          <p
            className={`mt-1 line-clamp-2 text-xs leading-5 ${mutedTextClass(darkMode)}`}
          >
            {memory.description}
          </p>
          <p
            className={`mt-2 text-xs ${
              completed
                ? darkMode
                  ? "text-emerald-300"
                  : "text-emerald-700"
                : darkMode
                  ? "text-neutral-500"
                  : "text-slate-500"
            }`}
          >
            {completed ? "Completed in this prototype" : memory.meta}
          </p>
        </div>

        <ChevronDown
          className={`mt-1 shrink-0 transition ${expanded ? "rotate-180" : ""}`}
          size={18}
          aria-hidden="true"
        />
      </button>

      {expanded ? (
        <div
          className={`grid gap-2 px-4 pb-4 ${
            completed
              ? darkMode
                ? "bg-emerald-500/5"
                : "bg-emerald-50/60"
              : ""
          }`}
        >
          <div className="flex flex-wrap gap-2">
            {completed ? (
              <Button
                darkMode={darkMode}
                className={actionButtonClass}
                disabled={disabled}
                icon={<RotateCcw size={actionIconSize} aria-hidden="true" />}
                onClick={onCancelDone}
              >
                Cancel
              </Button>
            ) : (
              <Button
                darkMode={darkMode}
                className={actionButtonClass}
                disabled={disabled}
                icon={<Check size={actionIconSize} aria-hidden="true" />}
                onClick={onDone}
              >
                Done
              </Button>
            )}
            <Button
              darkMode={darkMode}
              className={actionButtonClass}
              disabled={disabled}
              icon={<RefreshCw size={actionIconSize} aria-hidden="true" />}
              onClick={onReplace}
            >
              Replace
            </Button>
            <Button
              darkMode={darkMode}
              className={actionButtonClass}
              disabled={disabled}
              icon={<Eye size={actionIconSize} aria-hidden="true" />}
              onClick={onView}
            >
              View
            </Button>
          </div>
        </div>
      ) : null}
    </article>
  );
}

function categoryTone(category: PinnedMemory["category"]) {
  return category === "Cuisine" ? "amber" : "cyan";
}
