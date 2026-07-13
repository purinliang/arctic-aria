import { ChevronDown, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mutedTextClass } from "@/components/ui/color";
import { ListItem } from "@/components/ui/list";
import { Tag } from "@/components/ui/tag";
import type { MemoryRecord } from "@/features/dashboard/types";
import { categoryTone } from "./memory-page-helpers";

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
    <ListItem
      darkMode={darkMode}
      layout="block"
      expanded={expanded}
      selected={selected}
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
          <Button
            darkMode={darkMode}
            icon={<Edit3 size={15} aria-hidden="true" />}
            onClick={onEdit}
          >
            Edit
          </Button>
        </div>
      ) : null}
    </ListItem>
  );
}
