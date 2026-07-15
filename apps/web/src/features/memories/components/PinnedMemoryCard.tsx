import { ChevronDown, Eye, RefreshCw } from "lucide-react";
import { Button } from "@/components/button";
import { mutedTextClass } from "@/components/color";
import { CheckboxControl } from "@/components/forms/selection-field";
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
      leading={
        <CheckboxControl
          darkMode={darkMode}
          checked={completed}
          disabled={disabled}
          aria-label={
            completed
              ? `Cancel completion for ${memory.title}`
              : `Mark ${memory.title} done`
          }
          onChange={(event) =>
            event.target.checked ? onDone() : onCancelDone()
          }
        />
      }
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
