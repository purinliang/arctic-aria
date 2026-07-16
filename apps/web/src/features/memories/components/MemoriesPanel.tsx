// Memories Page - Memories Panel.
import { ClipboardList, Edit3, Plus, Settings2 } from "lucide-react";
import { Button } from "@/components/button";
import { CardHeader } from "@/components/card";
import {
  mutedTextClass,
  sectionBorderClass,
} from "@/components/color";
import { SingleChoiceGroup } from "@/components/forms/choice-group";
import { List, ListItem } from "@/components/list";
import { LoadingLine } from "@/components/loading";
import { Panel } from "@/components/panel";
import {
  DescriptionText,
  LabelText,
  SupportingText,
} from "@/components/text";
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
      <CardHeader
        darkMode={darkMode}
        icon={<ClipboardList size={18} aria-hidden="true" />}
        title="Memories"
        description="Saved experiences to revisit when the day needs a gentle option."
        action={
          <Button
            darkMode={darkMode}
            disabled={pending}
            icon={<Plus size={15} aria-hidden="true" />}
            onClick={onAdd}
          >
            New
          </Button>
        }
      />

      <div
        className={`flex flex-wrap items-center gap-2 border-b px-4 py-3 ${sectionBorderClass(darkMode)}`}
      >
        <LabelText darkMode={darkMode}>Categories:</LabelText>
        <SingleChoiceGroup
          darkMode={darkMode}
          value={filter}
          options={filters.map((item) => ({
            value: item,
            label: item,
          }))}
          onChange={(value) => onFilterChange(value as MemoryFilter)}
        />
        <Button
          darkMode={darkMode}
          size="md"
          disabled={pending}
          icon={<Settings2 size={15} aria-hidden="true" />}
          onClick={onManage}
        >
          Manage
        </Button>
      </div>

      <List darkMode={darkMode}>
        {loading ? (
          <LoadingLine darkMode={darkMode} text="Loading memories..." />
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
      </List>
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
