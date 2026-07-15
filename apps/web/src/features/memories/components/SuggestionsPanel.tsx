// Memories Page - Suggestions Panel.
import { Lightbulb, LoaderCircle, Pin, PinOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/button";
import { CardHeader } from "@/components/card";
import { dividerClass, mutedTextClass } from "@/components/color";
import { ListItem } from "@/components/list";
import { LoadingLine } from "@/components/loading";
import { Panel } from "@/components/panel";
import { DescriptionText, SupportingText } from "@/components/text";
import type { MemorySuggestion } from "@/features/dashboard/types";

type SuggestionResult = Promise<boolean>;

export function SuggestionsPanel({
  darkMode,
  suggestions,
  suggestionLoading,
  suggestionsRequested,
  pinnedSuggestionIds,
  pendingSuggestionIds,
  onSuggestionsRefresh,
  onSuggestionPin,
  onSuggestionCancel,
}: {
  darkMode: boolean;
  suggestions: MemorySuggestion[];
  suggestionLoading: boolean;
  suggestionsRequested: boolean;
  pinnedSuggestionIds: string[];
  pendingSuggestionIds: string[];
  onSuggestionsRefresh: () => Promise<void>;
  onSuggestionPin: (memoryId: string) => SuggestionResult;
  onSuggestionCancel: (memoryId: string) => SuggestionResult;
}) {
  return (
    <Panel darkMode={darkMode}>
      <CardHeader
        darkMode={darkMode}
        icon={<Lightbulb size={17} aria-hidden="true" />}
        title="Suggestions"
        description="To reexperience in a few days."
        action={
          <Button
            darkMode={darkMode}
            disabled={suggestionLoading || pendingSuggestionIds.length > 0}
            icon={
              suggestionLoading ? (
                <LoaderCircle
                  className="animate-spin"
                  size={14}
                  aria-hidden="true"
                />
              ) : (
                <RefreshCw size={14} aria-hidden="true" />
              )
            }
            onClick={() => void onSuggestionsRefresh()}
          >
            Refresh
          </Button>
        }
      />

      <div className={dividerClass(darkMode)}>
        {!suggestionsRequested && !suggestionLoading ? (
          <EmptyLine
            darkMode={darkMode}
            text="Click Refresh to load suggestions."
          />
        ) : null}
        {suggestionLoading ? (
          <LoadingLine darkMode={darkMode} text="Loading suggestions..." />
        ) : null}
        {suggestionsRequested &&
        !suggestionLoading &&
        suggestions.length === 0 ? (
          <EmptyLine
            darkMode={darkMode}
            text="No suggestions available. Add more memories or unpin existing ones."
          />
        ) : null}
        {suggestions.map((suggestion) => (
          <SuggestionRow
            key={suggestion.id}
            suggestion={suggestion}
            darkMode={darkMode}
            pending={pendingSuggestionIds.includes(suggestion.id)}
            pinned={pinnedSuggestionIds.includes(suggestion.id)}
            onPin={() => void onSuggestionPin(suggestion.id)}
            onCancel={() => void onSuggestionCancel(suggestion.id)}
          />
        ))}
      </div>
    </Panel>
  );
}

// Memories Page - Suggestions Panel - Suggestion row.
function SuggestionRow({
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

function EmptyLine({ darkMode, text }: { darkMode: boolean; text: string }) {
  return (
    <p className={`px-4 py-4 text-sm ${mutedTextClass(darkMode)}`}>
      {text}
    </p>
  );
}
