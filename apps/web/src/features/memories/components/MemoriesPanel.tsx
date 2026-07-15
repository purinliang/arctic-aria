// Memories Page - Memories Panel.
import { ClipboardList, Edit3, Plus, Settings2 } from "lucide-react";
import { Button } from "@/components/button";
import {
  dividerClass,
  headerSurfaceClass,
  mutedTextClass,
  sectionBorderClass,
} from "@/components/color";
import { ListItem } from "@/components/list";
import { Panel } from "@/components/panel";
import {
  DescriptionText,
  LabelText,
  SupportingText,
} from "@/components/text";
import { cx } from "@/components/utils";
import type { MemoryRecord } from "@/features/dashboard/types";
import type { MemoryFilter } from "./memory-page-helpers";

export function MemoriesPanel({
  darkMode,
  loading,
  pending,
  filter,
  filters,
  memories,
  onAdd,
  onFilterChange,
  onManage,
  onEditMemory,
}: {
  darkMode: boolean;
  loading: boolean;
  pending: boolean;
  filter: MemoryFilter;
  filters: MemoryFilter[];
  memories: MemoryRecord[];
  onAdd: () => void;
  onFilterChange: (filter: MemoryFilter) => void;
  onManage: () => void;
  onEditMemory: (memory: MemoryRecord) => void;
}) {
  return (
    <Panel darkMode={darkMode} className="min-w-0">
      <div
        className={cx(
          "flex flex-col gap-3 rounded-t-md border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
          headerSurfaceClass(darkMode),
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
        <Button
          darkMode={darkMode}
          disabled={pending}
          icon={<Plus size={15} aria-hidden="true" />}
          onClick={onAdd}
        >
          New
        </Button>
      </div>

      <div
        className={`flex flex-wrap items-center gap-2 border-b px-4 py-3 ${sectionBorderClass(darkMode)}`}
      >
        <LabelText darkMode={darkMode}>Categories:</LabelText>
        {filters.map((item) => (
          <Button
            key={item}
            darkMode={darkMode}
            size="xs"
            active={filter === item}
            onClick={() => onFilterChange(item)}
          >
            {item}
          </Button>
        ))}
        <Button
          darkMode={darkMode}
          size="xs"
          disabled={pending}
          icon={<Settings2 size={14} aria-hidden="true" />}
          onClick={onManage}
        >
          Manage
        </Button>
      </div>

      <div className={dividerClass(darkMode)}>
        {loading ? (
          <EmptyLine darkMode={darkMode} text="Loading memories..." />
        ) : null}
        {!loading && memories.length === 0 ? (
          <EmptyLine
            darkMode={darkMode}
            text="No memories found for this filter."
          />
        ) : null}
        {memories.map((memory) => (
          <MemoryRow
            key={memory.id}
            memory={memory}
            darkMode={darkMode}
            onEdit={() => onEditMemory(memory)}
          />
        ))}
      </div>
    </Panel>
  );
}

// Memories Page - Memories Panel - Memory row.
function MemoryRow({
  memory,
  darkMode,
  onEdit,
}: {
  memory: MemoryRecord;
  darkMode: boolean;
  onEdit: () => void;
}) {
  const metadata = [
    memory.category,
    memory.pinned ? "Pinned" : "",
    memory.lastDoneText,
    `Done ${memory.doneCount} times`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <ListItem darkMode={darkMode} className="items-start gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold">{memory.title}</h3>
        </div>
        <DescriptionText darkMode={darkMode} className="mt-1">
          {memory.description}
        </DescriptionText>
        <SupportingText darkMode={darkMode} className="mt-2 block">
          {metadata}
        </SupportingText>
      </div>
      <Button
        darkMode={darkMode}
        size="sm"
        icon={<Edit3 size={15} aria-hidden="true" />}
        onClick={onEdit}
      >
        Edit
      </Button>
    </ListItem>
  );
}

function EmptyLine({ darkMode, text }: { darkMode: boolean; text: string }) {
  return (
    <p className={`px-4 py-4 text-sm ${mutedTextClass(darkMode)}`}>
      {text}
    </p>
  );
}
