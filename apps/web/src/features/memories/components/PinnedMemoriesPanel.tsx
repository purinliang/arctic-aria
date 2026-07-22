// Dashboard - Pinned Memories Panel.
import { Album } from "lucide-react";
import { CardHeader } from "@/components/card";
import { secondaryTextColorClass } from "@/components/color";
import { displayDescription } from "@/components/default-description";
import { CheckboxControl } from "@/components/forms/selection-field";
import {
  List,
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemSupportingText,
  ListItemTitle,
  ListItemTitleButton,
} from "@/components/list";
import { LoadingLine } from "@/components/loading";
import { Panel } from "@/components/panel";
import type { PinnedMemory } from "@/features/dashboard/types";
import type { DashboardMessages } from "@/messages/app-messages";
import { memoryExperienceActionLabels } from "./memory-metadata";

export function PinnedMemoriesPanel({
  darkMode,
  pinnedMemories,
  loading,
  messages,
  onDone,
  onCancelDone,
  onMemoryOpen,
}: {
  darkMode: boolean;
  pinnedMemories: PinnedMemory[];
  loading: boolean;
  messages: DashboardMessages["pinnedMemories"];
  onDone: (pinnedMemoryId: string) => void;
  onCancelDone: (pinnedMemoryId: string) => void;
  onMemoryOpen: () => void;
}) {
  return (
    <Panel darkMode={darkMode}>
      <CardHeader
        icon={<Album size={18} aria-hidden="true" />}
        title={messages.title}
        description={messages.description}
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
  onDone,
  onCancelDone,
  onOpen,
}: {
  memory: PinnedMemory;
  darkMode: boolean;
  messages: DashboardMessages["pinnedMemories"];
  onDone: () => void;
  onCancelDone: () => void;
  onOpen: () => void;
}) {
  const completed = memory.status === "completed";
  const actionLabels = memoryExperienceActionLabels(
    memory.categoryBuiltInKey,
    messages.experience,
    memory.title,
  );

  return (
    <ListItem darkMode={darkMode} className="items-start">
      <div className="grid min-w-0 w-full flex-1 grid-cols-[auto_minmax(0,1fr)] gap-3">
        <CheckboxControl
          darkMode={darkMode}
          className="mt-1"
          checked={completed}
          aria-label={
            completed
              ? actionLabels.cancelDone
              : actionLabels.markDone
          }
          onChange={(event) =>
            event.target.checked ? onDone() : onCancelDone()
          }
        />
        <ListItemContent
          grow={false}
          title={
            <ListItemTitle>
              <ListItemTitleButton onClick={onOpen}>
                {memory.title}
              </ListItemTitleButton>
            </ListItemTitle>
          }
          main={
            <ListItemDescription className="line-clamp-2">
              {displayDescription(
                memory.description,
                memory.title,
                messages.defaultDescriptions,
              )}
            </ListItemDescription>
          }
          support={
            <ListItemSupportingText>
              {memory.categoryBuiltInKey
                ? messages.builtInCategories[memory.categoryBuiltInKey]
                : memory.category}
            </ListItemSupportingText>
          }
        />
      </div>
    </ListItem>
  );
}

function EmptyLine({ text }: { darkMode: boolean; text: string }) {
  return (
    <p className={`px-4 py-4 text-sm ${secondaryTextColorClass}`}>
      {text}
    </p>
  );
}
