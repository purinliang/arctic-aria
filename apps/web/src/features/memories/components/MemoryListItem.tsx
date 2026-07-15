import { ChevronDown, Edit3 } from "lucide-react";
import { Button } from "@/components/button";
import { mutedTextClass } from "@/components/color";
import { ExpandableListItem } from "@/components/list";
import type { MemoryRecord } from "@/features/dashboard/types";

export function MemoryListItem({
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
    <ExpandableListItem
      darkMode={darkMode}
      expanded={expanded}
      selected={selected}
      bodyClassName="flex justify-end"
      onToggle={onToggle}
      header={
        <>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold">{memory.title}</h3>
            </div>
            <p className={`mt-1 text-sm ${mutedTextClass(darkMode)}`}>
              {memory.category}
              {memory.pinned ? " · Pinned" : ""}
            </p>
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
        </>
      }
    >
      <Button
        darkMode={darkMode}
        icon={<Edit3 size={15} aria-hidden="true" />}
        onClick={onEdit}
      >
        Edit
      </Button>
    </ExpandableListItem>
  );
}
