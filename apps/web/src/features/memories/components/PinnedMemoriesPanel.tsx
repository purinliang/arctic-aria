// Dashboard - Pinned Memories Panel.
import { Album, ChevronRight } from "lucide-react";
import { Button } from "@/components/button";
import { CardHeader } from "@/components/card";
import { secondaryTextColorClass } from "@/components/color";
import { formatDateKey } from "@/components/forms/date-format";
import { CheckboxControl } from "@/components/forms/selection-field";
import { List, ListItem } from "@/components/list";
import { LoadingLine } from "@/components/loading";
import { Panel } from "@/components/panel";
import { DescriptionText, SupportingText } from "@/components/text";
import type { PinnedMemory } from "@/features/dashboard/types";
import type { DashboardMessages } from "@/messages/app-messages";
import type { DatePickerMessages } from "@/messages/form-messages";

export function PinnedMemoriesPanel({
  darkMode,
  pinnedMemories,
  loading,
  messages,
  dateMessages,
  onDone,
  onCancelDone,
  onMemoryOpen,
}: {
  darkMode: boolean;
  pinnedMemories: PinnedMemory[];
  loading: boolean;
  messages: DashboardMessages["pinnedMemories"];
  dateMessages: DatePickerMessages;
  onDone: (pinnedMemoryId: string) => void;
  onCancelDone: (pinnedMemoryId: string) => void;
  onMemoryOpen: () => void;
}) {
  return (
    <Panel darkMode={darkMode}>
      <CardHeader
        icon={<Album size={18} aria-hidden="true" />}
        title={messages.title}
        darkMode={darkMode}
      />
      <List darkMode={darkMode}>
        {loading ? (
          <LoadingLine darkMode={darkMode} text={messages.loading} />
        ) : null}
        {!loading && pinnedMemories.length === 0 ? (
          <EmptyLine darkMode={darkMode} text={messages.empty} />
        ) : null}
        {pinnedMemories.map((memory) => (
          <PinnedMemoryRow
            key={memory.id}
            memory={memory}
            darkMode={darkMode}
            messages={messages}
            dateMessages={dateMessages}
            onDone={() => onDone(memory.id)}
            onCancelDone={() => onCancelDone(memory.id)}
            onOpen={onMemoryOpen}
          />
        ))}
      </List>
    </Panel>
  );
}

// Dashboard - Pinned Memories Panel - Pinned memory row.
function PinnedMemoryRow({
  memory,
  darkMode,
  messages,
  dateMessages,
  onDone,
  onCancelDone,
  onOpen,
}: {
  memory: PinnedMemory;
  darkMode: boolean;
  messages: DashboardMessages["pinnedMemories"];
  dateMessages: DatePickerMessages;
  onDone: () => void;
  onCancelDone: () => void;
  onOpen: () => void;
}) {
  const completed = memory.status === "completed";

  return (
    <ListItem darkMode={darkMode} className="items-start">
      <div className="grid min-w-0 flex-1 grid-cols-[auto_minmax(0,1fr)] gap-3">
        <CheckboxControl
          darkMode={darkMode}
          className="mt-1"
          checked={completed}
          aria-label={
            completed
              ? messages.cancelDone(memory.title)
              : messages.markDone(memory.title)
          }
          onChange={(event) =>
            event.target.checked ? onDone() : onCancelDone()
          }
        />
        <div className="min-w-0">
          <h3 className="min-w-0 text-sm font-semibold">{memory.title}</h3>
          <DescriptionText darkMode={darkMode} className="mt-1 line-clamp-2">
            {memory.description}
          </DescriptionText>
          <SupportingText darkMode={darkMode} className="mt-2 block">
            {memory.categoryBuiltInKey
              ? messages.builtInCategories[memory.categoryBuiltInKey]
              : memory.category} ·{" "}
            {completed
              ? messages.completed
              : messages.visibleUntil(
                  formatDate(memory.visibleUntilDate, dateMessages, memory.meta),
                )}
          </SupportingText>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          darkMode={darkMode}
          tone="ghost"
          size="icon-sm"
          aria-label={messages.open}
          icon={<ChevronRight size={16} aria-hidden="true" />}
          onClick={onOpen}
        />
      </div>
    </ListItem>
  );
}

function formatDate(
  value: string,
  messages: DatePickerMessages,
  fallback: string,
) {
  return formatDateKey(value, messages, fallback);
}

function EmptyLine({ text }: { darkMode: boolean; text: string }) {
  return (
    <p className={`px-4 py-4 text-sm ${secondaryTextColorClass}`}>
      {text}
    </p>
  );
}
