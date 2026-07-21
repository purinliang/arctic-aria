// Memories Page - Memories Panel.
import {
  Album,
  Edit3,
  LoaderCircle,
  Pin,
  PinOff,
  Plus,
  Settings2,
} from "lucide-react";
import { Button } from "@/components/button";
import { CardHeader } from "@/components/card";
import {
  secondaryTextColorClass,
  secondaryButtonBorderColorClass,
} from "@/components/color";
import { displayDescription } from "@/components/default-description";
import {
  ChoiceActionButton,
  SingleChoiceGroup,
} from "@/components/forms/choice-group";
import { formatDateKey } from "@/components/forms/date-format";
import { List, ListItem, ListItemContent } from "@/components/list";
import { LoadingLine } from "@/components/loading";
import { Panel } from "@/components/panel";
import {
  DescriptionText,
  LabelText,
  SupportingText,
} from "@/components/text";
import type {
  MemoryCategoryOption,
  MemoryRecord,
} from "@/features/dashboard/types";
import type { MemoryMessages } from "@/messages/app-messages";
import type { DatePickerMessages } from "@/messages/form-messages";
import { MemoryCategoryIcon } from "./MemoryCategoryIcon";
import { memoryExperienceMetadataSegments } from "./memory-metadata";
import {
  getMemoryCategoryLabel,
  getMemoryFilterNames,
  type MemoryFilter,
} from "./memory-page-helpers";

export function MemoriesPanel({
  darkMode,
  loading,
  pending,
  filter,
  categories,
  memories,
  pendingPinIds,
  messages,
  categoryMessages,
  defaultDescriptions,
  dateMessages,
  onAdd,
  onFilterChange,
  onManage,
  onEditMemory,
  onPinMemory,
  onUnpinMemory,
}: {
  darkMode: boolean;
  loading: boolean;
  pending: boolean;
  filter: MemoryFilter;
  categories: MemoryCategoryOption[];
  memories: MemoryRecord[];
  pendingPinIds: string[];
  messages: MemoryMessages["panel"];
  categoryMessages: MemoryMessages["categories"]["builtIns"];
  defaultDescriptions: MemoryMessages["defaultDescriptions"];
  dateMessages: DatePickerMessages;
  onAdd: () => void;
  onFilterChange: (filter: MemoryFilter) => void;
  onManage: () => void;
  onEditMemory: (memory: MemoryRecord) => void;
  onPinMemory: (memoryId: string) => void;
  onUnpinMemory: (memoryId: string) => void;
}) {
  const categoryByName = new Map(
    categories.map((category) => [category.name, category]),
  );

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
        className={`flex flex-wrap items-center gap-2 border-b px-4 py-3 ${secondaryButtonBorderColorClass}`}
      >
        <LabelText darkMode={darkMode}>{messages.categories}</LabelText>
        <SingleChoiceGroup
          darkMode={darkMode}
          value={filter}
          options={getMemoryFilterNames(categories).map((item) => {
            const category = categoryByName.get(item);

            return {
              value: item,
              label:
                item === "All"
                  ? messages.all
                  : !category
                    ? item
                  : getMemoryCategoryLabel(
                      item,
                      category.builtInKey,
                      categoryMessages,
                    ),
              icon:
                item === "All" ? (
                  <Album size={14} aria-hidden="true" />
                ) : category ? (
                  <MemoryCategoryIcon iconName={category.iconName} />
                ) : undefined,
            };
          })}
          onChange={(value) => onFilterChange(value as MemoryFilter)}
        >
          <ChoiceActionButton
            darkMode={darkMode}
            disabled={pending}
            option={{
              value: "manage",
              label: messages.manage,
              icon: <Settings2 size={14} aria-hidden="true" />,
            }}
            onClick={onManage}
          />
        </SingleChoiceGroup>
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
        title={
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold">{memory.title}</h3>
          </div>
        }
        main={
          <DescriptionText darkMode={darkMode}>
            {displayDescription(
              memory.description,
              memory.title,
              defaultDescriptions.memory,
            )}
          </DescriptionText>
        }
        support={<SupportingText darkMode={darkMode}>{metadata}</SupportingText>}
      />
      <div className="flex shrink-0 items-center gap-2">
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
