import { LoaderCircle, Pin, PinOff } from "lucide-react";
import { Button } from "@/components/button";
import { ListItem } from "@/components/list";
import { DescriptionText, SupportingText } from "@/components/text";
import type { MemorySuggestion } from "@/features/dashboard/types";

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
  const metadata = [
    suggestion.category,
    suggestion.lastDoneText,
    `Done ${suggestion.doneCount} times`,
  ].join(" · ");

  return (
    <ListItem darkMode={darkMode} className="gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold">{suggestion.title}</h3>
        </div>
        <DescriptionText darkMode={darkMode} className="mt-1">
          {suggestion.description}
        </DescriptionText>
        <SupportingText darkMode={darkMode} className="mt-2 block">
          {metadata}
        </SupportingText>
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
