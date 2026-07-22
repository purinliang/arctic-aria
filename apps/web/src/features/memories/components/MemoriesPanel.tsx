// Memories Page - Memories Panel.
import {
  Album,
  Edit3,
  LoaderCircle,
  Pin,
  PinOff,
  Plus,
} from "lucide-react";
import { Button } from "@/components/button";
import { CardHeader } from "@/components/card";
import {
  secondaryTextColorClass,
} from "@/components/color";
import { displayDescription } from "@/components/default-description";
import { formatDateKey } from "@/components/forms/date-format";
import {
  List,
  ListItem,
  ListItemActions,
  ListItemContent,
  ListItemDescription,
  ListItemSupportingText,
  ListItemTitle,
} from "@/components/list";
import { LoadingLine } from "@/components/loading";
import { Panel } from "@/components/panel";
import type {
  MemoryRecord,
} from "@/features/dashboard/types";
import type { MemoryMessages } from "@/messages/app-messages";
import type { DatePickerMessages } from "@/messages/form-messages";
import { memoryExperienceMetadataSegments } from "./memory-metadata";
import {
  getMemoryCategoryLabel,
} from "./memory-page-helpers";

export function MemoriesPanel({
  darkMode,
  loading,
  pending,
  memories,
  pendingPinIds,
  messages,
  categoryMessages,
  defaultDescriptions,
  dateMessages,
  onAdd,
  onEditMemory,
  onPinMemory,
  onUnpinMemory,
}: {
  darkMode: boolean;
  loading: boolean;
  pending: boolean;
  memories: MemoryRecord[];
  pendingPinIds: string[];
  messages: MemoryMessages["panel"];
  categoryMessages: MemoryMessages["categories"]["builtIns"];
  defaultDescriptions: MemoryMessages["defaultDescriptions"];
  dateMessages: DatePickerMessages;
  onAdd: () => void;
  onEditMemory: (memory: MemoryRecord) => void;
  onPinMemory: (memoryId: string) => void;
  onUnpinMemory: (memoryId: string) => void;
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
            categoryMessages={categoryMessages}
            defaultDescriptions={defaultDescriptions}
            dateMessages={dateMessages}
            pinPending={pendingPinIds.includes(memory.id)}
            onEdit={() => onEditMemory(memory)}
            onPin={() => onPinMemory(memory.id)}
            onUnpin={() => onUnpinMemory(memory.id)}
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
  categoryMessages,
  defaultDescriptions,
  dateMessages,
  pinPending,
  onEdit,
  onPin,
  onUnpin,
}: {
  memory: MemoryRecord;
  darkMode: boolean;
  messages: MemoryMessages["panel"];
  categoryMessages: MemoryMessages["categories"]["builtIns"];
  defaultDescriptions: MemoryMessages["defaultDescriptions"];
  dateMessages: DatePickerMessages;
  pinPending: boolean;
  onEdit: () => void;
  onPin: () => void;
  onUnpin: () => void;
}) {
  const metadata = [
    getMemoryCategoryLabel(
      memory.category,
      memory.categoryBuiltInKey,
      categoryMessages,
    ),
    memory.pinned ? messages.pinned : "",
    ...memoryExperienceMetadataSegments(memory, messages.experience, (value, fallback) =>
      formatDate(value, dateMessages, fallback),
    ),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <ListItem darkMode={darkMode} className="items-start gap-3">
      <ListItemContent
        title={<ListItemTitle>{memory.title}</ListItemTitle>}
        main={
          <ListItemDescription>
            {displayDescription(
              memory.description,
              memory.title,
              defaultDescriptions.memory,
            )}
          </ListItemDescription>
        }
        support={<ListItemSupportingText>{metadata}</ListItemSupportingText>}
      />
      <ListItemActions>
        <Button
          darkMode={darkMode}
          size="icon-sm"
          className="rounded-full"
          disabled={pinPending}
          aria-label={memory.pinned ? messages.cancelPin : messages.pin}
          icon={
            pinPending ? (
              <LoaderCircle
                className="animate-spin"
                size={15}
                aria-hidden="true"
              />
            ) : memory.pinned ? (
              <PinOff size={14} aria-hidden="true" />
            ) : (
              <Pin size={14} aria-hidden="true" />
            )
          }
          onClick={memory.pinned ? onUnpin : onPin}
        />
        <Button
          darkMode={darkMode}
          size="sm"
          icon={<Edit3 size={15} aria-hidden="true" />}
          onClick={onEdit}
        >
          {messages.edit}
        </Button>
      </ListItemActions>
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
