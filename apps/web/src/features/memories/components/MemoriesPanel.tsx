// Memories Page - Memories Panel.
import { Album, Edit3, Plus, Settings2 } from "lucide-react";
import { Button } from "@/components/button";
import { CardHeader } from "@/components/card";
import {
  mutedTextClass,
  sectionBorderClass,
} from "@/components/color";
import { SingleChoiceGroup } from "@/components/forms/choice-group";
import { formatDateKey } from "@/components/forms/date-format";
import { List, ListItem } from "@/components/list";
import { LoadingLine } from "@/components/loading";
import { Panel } from "@/components/panel";
import {
  DescriptionText,
  LabelText,
  SupportingText,
} from "@/components/text";
import type { MemoryRecord } from "@/features/dashboard/types";
import type { MemoryMessages } from "@/messages/app-messages";
import type { DatePickerMessages } from "@/messages/form-messages";
import type { MemoryFilter } from "./memory-page-helpers";

export function MemoriesPanel({
  darkMode,
  loading,
  pending,
  filter,
  filters,
  memories,
  messages,
  dateMessages,
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
  messages: MemoryMessages["panel"];
  dateMessages: DatePickerMessages;
  onAdd: () => void;
  onFilterChange: (filter: MemoryFilter) => void;
  onManage: () => void;
  onEditMemory: (memory: MemoryRecord) => void;
}) {
  return (
    <Panel darkMode={darkMode} className="min-w-0">
      <CardHeader
        darkMode={darkMode}
        icon={<Album size={18} aria-hidden="true" />}
        title={messages.title}
        description={messages.description}
        action={
          <Button
            darkMode={darkMode}
            disabled={pending}
            icon={<Plus size={15} aria-hidden="true" />}
            onClick={onAdd}
          >
            {messages.new}
          </Button>
        }
      />

      <div
        className={`flex flex-wrap items-center gap-2 border-b px-4 py-3 ${sectionBorderClass(darkMode)}`}
      >
        <LabelText darkMode={darkMode}>{messages.categories}</LabelText>
        <SingleChoiceGroup
          darkMode={darkMode}
          value={filter}
          options={filters.map((item) => ({
            value: item,
            label: item === "All" ? messages.all : item,
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
          {messages.manage}
        </Button>
      </div>

      <List darkMode={darkMode}>
        {loading ? (
          <LoadingLine darkMode={darkMode} text={messages.loading} />
        ) : null}
        {!loading && memories.length === 0 ? (
          <EmptyLine
            darkMode={darkMode}
            text={messages.empty}
          />
        ) : null}
        {memories.map((memory) => (
          <MemoryRow
            key={memory.id}
            memory={memory}
            darkMode={darkMode}
            messages={messages}
            dateMessages={dateMessages}
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
  messages,
  dateMessages,
  onEdit,
}: {
  memory: MemoryRecord;
  darkMode: boolean;
  messages: MemoryMessages["panel"];
  dateMessages: DatePickerMessages;
  onEdit: () => void;
}) {
  const metadata = [
    memory.category,
    memory.pinned ? messages.pinned : "",
    lastDoneText(memory, messages, dateMessages),
    messages.doneTimes(memory.doneCount),
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
        {messages.edit}
      </Button>
    </ListItem>
  );
}

function lastDoneText(
  memory: MemoryRecord,
  messages: MemoryMessages["panel"],
  dateMessages: DatePickerMessages,
) {
  if (!memory.lastDoneDate) {
    return messages.neverDone;
  }

  return messages.lastDone(
    formatDate(memory.lastDoneDate, dateMessages, memory.lastDoneText),
  );
}

function formatDate(
  value: string,
  messages: DatePickerMessages,
  fallback: string,
) {
  return formatDateKey(value, messages, fallback);
}

function EmptyLine({ darkMode, text }: { darkMode: boolean; text: string }) {
  return (
    <p className={`px-4 py-4 text-sm ${mutedTextClass(darkMode)}`}>
      {text}
    </p>
  );
}
