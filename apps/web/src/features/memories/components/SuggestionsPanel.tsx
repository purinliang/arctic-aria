// Memories Page - Suggestions Panel.
import { Lightbulb, LoaderCircle, Pin, PinOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/button";
import { CardHeader } from "@/components/card";
import { mutedTextClass } from "@/components/color";
import { formatDateKey } from "@/components/forms/date-format";
import { List, ListItem } from "@/components/list";
import { LoadingLine } from "@/components/loading";
import { Panel } from "@/components/panel";
import { DescriptionText, SupportingText } from "@/components/text";
import type { MemorySuggestion } from "@/features/dashboard/types";
import type { MemoryMessages } from "@/messages/app-messages";
import type { DatePickerMessages } from "@/messages/form-messages";

type SuggestionResult = Promise<boolean>;

export function SuggestionsPanel({
  darkMode,
  suggestions,
  suggestionLoading,
  suggestionsRequested,
  pinnedSuggestionIds,
  pendingSuggestionIds,
  messages,
  dateMessages,
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
  messages: MemoryMessages["suggestions"];
  dateMessages: DatePickerMessages;
  onSuggestionsRefresh: () => Promise<void>;
  onSuggestionPin: (memoryId: string) => SuggestionResult;
  onSuggestionCancel: (memoryId: string) => SuggestionResult;
}) {
  return (
    <Panel darkMode={darkMode}>
      <CardHeader
        darkMode={darkMode}
        icon={<Lightbulb size={17} aria-hidden="true" />}
        title={messages.title}
        description={messages.description}
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
            {messages.refresh}
          </Button>
        }
      />

      <List darkMode={darkMode}>
        {!suggestionsRequested && !suggestionLoading ? (
          <EmptyLine
            darkMode={darkMode}
            text={messages.initial}
          />
        ) : null}
        {suggestionLoading ? (
          <LoadingLine darkMode={darkMode} text={messages.loading} />
        ) : null}
        {suggestionsRequested &&
        !suggestionLoading &&
        suggestions.length === 0 ? (
          <EmptyLine
            darkMode={darkMode}
            text={messages.empty}
          />
        ) : null}
        {suggestions.map((suggestion) => (
          <SuggestionRow
            key={suggestion.id}
            suggestion={suggestion}
            darkMode={darkMode}
            pending={pendingSuggestionIds.includes(suggestion.id)}
            pinned={pinnedSuggestionIds.includes(suggestion.id)}
            messages={messages}
            dateMessages={dateMessages}
            onPin={() => void onSuggestionPin(suggestion.id)}
            onCancel={() => void onSuggestionCancel(suggestion.id)}
          />
        ))}
      </List>
    </Panel>
  );
}

// Memories Page - Suggestions Panel - Suggestion row.
function SuggestionRow({
  suggestion,
  darkMode,
  pending,
  pinned,
  messages,
  dateMessages,
  onPin,
  onCancel,
}: {
  suggestion: MemorySuggestion;
  darkMode: boolean;
  pending: boolean;
  pinned: boolean;
  messages: MemoryMessages["suggestions"];
  dateMessages: DatePickerMessages;
  onPin: () => void;
  onCancel: () => void;
}) {
  const metadata = [
    suggestion.category,
    lastDoneText(suggestion, messages, dateMessages),
    messages.doneTimes(suggestion.doneCount),
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
          className="rounded-full"
          disabled={pending}
          aria-label={pinned ? messages.cancelPin : messages.pin}
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

function lastDoneText(
  suggestion: MemorySuggestion,
  messages: MemoryMessages["suggestions"],
  dateMessages: DatePickerMessages,
) {
  if (!suggestion.lastDoneDate) {
    return messages.neverDone;
  }

  return messages.lastDone(
    formatDate(suggestion.lastDoneDate, dateMessages, suggestion.lastDoneText),
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
