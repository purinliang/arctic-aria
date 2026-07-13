import { LoaderCircle, Pin, PinOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mutedTextClass } from "@/components/ui/color";
import { ListItem } from "@/components/ui/list";
import { Tag } from "@/components/ui/tag";
import type { MemorySuggestion } from "@/features/dashboard/types";
import { categoryTone } from "./memory-page-helpers";

export function SuggestionListItem({
  suggestion,
  darkMode,
  pending,
  pinned,
  onPin,
  onCancel,
}: {
  suggestion: MemorySuggestion;
  darkMode: boolean;
  pending: boolean;
  pinned: boolean;
  onPin: () => void;
  onCancel: () => void;
}) {
  return (
    <ListItem darkMode={darkMode} className="gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold">{suggestion.title}</h3>
          <Tag darkMode={darkMode} tone={categoryTone(suggestion.category)}>
            {suggestion.category}
          </Tag>
        </div>
        <p className={`mt-1 text-xs leading-5 ${mutedTextClass(darkMode)}`}>
          {suggestion.description}
        </p>
        <p className={`mt-2 text-xs ${mutedTextClass(darkMode)}`}>
          {suggestion.lastDoneText} · Done {suggestion.doneCount} times
        </p>
      </div>
      <div className="shrink-0">
        <Button
          darkMode={darkMode}
          size="icon-sm"
          active={!pinned}
          className="rounded-full"
          disabled={pending}
          aria-label={pinned ? "Cancel pin" : "Pin suggestion"}
          icon={
            pending ? (
              <LoaderCircle
                className="animate-spin"
                size={15}
                aria-hidden="true"
              />
            ) : pinned ? (
              <PinOff size={14} aria-hidden="true" />
            ) : (
              <Pin size={14} aria-hidden="true" />
            )
          }
          onClick={pinned ? onCancel : onPin}
        />
      </div>
    </ListItem>
  );
}
