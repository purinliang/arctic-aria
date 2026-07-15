import { Check, ChevronDown, Eye, RefreshCw, RotateCcw } from "lucide-react";
import { Button } from "@/components/button";
import { mutedTextClass } from "@/components/color";
import { ExpandableListItem } from "@/components/list";
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
    <ExpandableListItem
      darkMode={darkMode}
      expanded={expanded}
      disabled={disabled}
      bodyClassName="flex flex-wrap gap-2"
      onToggle={onToggleExpanded}
      header={
        <>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="min-w-0 text-sm font-semibold">
                {memory.title}
              </h3>
            </div>
            <p className={`mt-1 text-sm ${mutedTextClass(darkMode)}`}>
              {memory.category}
            </p>
            <p
              className={`mt-1 line-clamp-2 text-xs leading-5 ${mutedTextClass(darkMode)}`}
            >
              {memory.description}
            </p>
            <p className={`mt-2 text-xs ${mutedTextClass(darkMode)}`}>
              {completed ? "Completed in this prototype" : memory.meta}
            </p>
          </div>

          <ChevronDown
            className={`mt-1 shrink-0 transition ${expanded ? "rotate-180" : ""}`}
            size={18}
            aria-hidden="true"
          />
        </>
      }
    >
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
    </ExpandableListItem>
  );
}
