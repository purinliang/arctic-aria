// Dashboard - Pinned Memories Panel.
import { ChevronRight, ClipboardList, RefreshCw } from "lucide-react";
import { Button } from "@/components/button";
import { CardHeader } from "@/components/card";
import { mutedTextClass } from "@/components/color";
import { CheckboxControl } from "@/components/forms/selection-field";
import { List, ListItem } from "@/components/list";
import { LoadingLine } from "@/components/loading";
import { Panel } from "@/components/panel";
import { DescriptionText, SupportingText } from "@/components/text";
import type { PinnedMemory } from "@/features/dashboard/types";

export function PinnedMemoriesPanel({
  darkMode,
  pinnedMemories,
  loading,
  disabled,
  onDone,
  onCancelDone,
  onReplace,
  onMemoryOpen,
}: {
  darkMode: boolean;
  pinnedMemories: PinnedMemory[];
  loading: boolean;
  disabled: boolean;
  onDone: (pinnedMemoryId: string) => void;
  onCancelDone: (pinnedMemoryId: string) => void;
  onReplace: (pinnedMemoryId: string) => void;
  onMemoryOpen: () => void;
}) {
  return (
    <Panel darkMode={darkMode}>
      <CardHeader
        icon={<ClipboardList size={18} aria-hidden="true" />}
        title="Pinned Memories"
        meta={`${pinnedMemories.length} saved`}
        darkMode={darkMode}
      />
      <List darkMode={darkMode}>
        {loading ? (
          <LoadingLine darkMode={darkMode} text="Loading pinned memories..." />
        ) : null}
        {!loading && pinnedMemories.length === 0 ? (
          <EmptyLine darkMode={darkMode} text="No pinned memories yet." />
        ) : null}
        {pinnedMemories.map((memory) => (
          <PinnedMemoryRow
            key={memory.id}
            memory={memory}
            darkMode={darkMode}
            disabled={disabled}
            onDone={() => onDone(memory.id)}
            onCancelDone={() => onCancelDone(memory.id)}
            onReplace={() => onReplace(memory.id)}
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
  disabled,
  onDone,
  onCancelDone,
  onReplace,
  onOpen,
}: {
  memory: PinnedMemory;
  darkMode: boolean;
  disabled: boolean;
  onDone: () => void;
  onCancelDone: () => void;
  onReplace: () => void;
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
        <div className="min-w-0">
          <h3 className="min-w-0 text-sm font-semibold">{memory.title}</h3>
          <DescriptionText darkMode={darkMode} className="mt-1 line-clamp-2">
            {memory.description}
          </DescriptionText>
          <SupportingText darkMode={darkMode} className="mt-2 block">
            {memory.category} ·{" "}
            {completed ? "Completed in this prototype" : memory.meta}
          </SupportingText>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          darkMode={darkMode}
          size="icon-sm"
          disabled={disabled}
          aria-label={`Replace ${memory.title}`}
          icon={<RefreshCw size={15} aria-hidden="true" />}
          onClick={onReplace}
        />
        <Button
          darkMode={darkMode}
          tone="ghost"
          size="icon-sm"
          aria-label="Open memories"
          icon={<ChevronRight size={16} aria-hidden="true" />}
          onClick={onOpen}
        />
      </div>
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
