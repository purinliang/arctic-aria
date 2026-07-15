import { RefreshCw } from "lucide-react";
import { Button } from "@/components/button";
import { CheckboxControl } from "@/components/forms/selection-field";
import { ListItem } from "@/components/list";
import { DescriptionText, SupportingText } from "@/components/text";
import type { PinnedMemory } from "@/features/dashboard/types";

export function PinnedMemoryCard({
  memory,
  darkMode,
  disabled,
  onDone,
  onCancelDone,
  onReplace,
}: {
  memory: PinnedMemory;
  darkMode: boolean;
  disabled: boolean;
  onDone: () => void;
  onCancelDone: () => void;
  onReplace: () => void;
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
      <Button
        darkMode={darkMode}
        size="icon-sm"
        disabled={disabled}
        aria-label={`Replace ${memory.title}`}
        icon={<RefreshCw size={15} aria-hidden="true" />}
        onClick={onReplace}
      />
    </ListItem>
  );
}
