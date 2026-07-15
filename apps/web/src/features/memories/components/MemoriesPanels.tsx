import {
  ClipboardList,
  Lightbulb,
  LoaderCircle,
  Plus,
  RefreshCw,
  Settings2,
} from "lucide-react";
import { Button } from "@/components/button";
import {
  dividerClass,
  headerSurfaceClass,
  mutedTextClass,
  sectionBorderClass,
} from "@/components/color";
import { Panel } from "@/components/panel";
import { LabelText } from "@/components/text";
import { cx } from "@/components/utils";
import type { MemorySuggestion } from "@/features/dashboard/types";
import { SuggestionListItem } from "./SuggestionListItem";
import type { MemoryFilter } from "./memory-page-helpers";

type SuggestionResult = Promise<boolean>;

export function MemoryPanelHeader({
  darkMode,
  pending,
  onAdd,
}: {
  darkMode: boolean;
  pending: boolean;
  onAdd: () => void;
}) {
  return (
    <div
      className={cx(
        "flex flex-col gap-3 rounded-t-md border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
        headerSurfaceClass(darkMode),
      )}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <ClipboardList size={18} aria-hidden="true" />
          <h2 className="text-base font-semibold">Memories</h2>
        </div>
        <p className={`mt-1 text-sm ${mutedTextClass(darkMode)}`}>
          Saved experiences to revisit when the day needs a gentle option.
        </p>
      </div>
      <Button
        darkMode={darkMode}
        disabled={pending}
        icon={<Plus size={15} aria-hidden="true" />}
        onClick={onAdd}
      >
        New
      </Button>
    </div>
  );
}

export function MemoryFilters({
  darkMode,
  filter,
  filters,
  pending,
  onFilterChange,
  onManage,
}: {
  darkMode: boolean;
  filter: MemoryFilter;
  filters: MemoryFilter[];
  pending: boolean;
  onFilterChange: (filter: MemoryFilter) => void;
  onManage: () => void;
}) {
  return (
    <div
      className={`flex flex-wrap items-center gap-2 border-b px-4 py-3 ${sectionBorderClass(darkMode)}`}
    >
      <LabelText darkMode={darkMode}>Categories:</LabelText>
      {filters.map((item) => (
        <Button
          key={item}
          darkMode={darkMode}
          size="xs"
          active={filter === item}
          onClick={() => onFilterChange(item)}
        >
          {item}
        </Button>
      ))}
      <Button
        darkMode={darkMode}
        size="xs"
        disabled={pending}
        icon={<Settings2 size={14} aria-hidden="true" />}
        onClick={onManage}
      >
        Manage
      </Button>
    </div>
  );
}

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
      <div
        className={cx(
          "flex flex-col gap-3 rounded-t-md border-b px-4 py-3 sm:flex-row sm:items-start sm:justify-between",
          headerSurfaceClass(darkMode),
        )}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Lightbulb size={17} aria-hidden="true" />
            <h2 className="text-base font-semibold">Suggestions</h2>
          </div>
          <p className={`mt-1 text-sm ${mutedTextClass(darkMode)}`}>
            To reexperience in a few days.
          </p>
        </div>
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
      </div>

      <div className={dividerClass(darkMode)}>
        {!suggestionsRequested && !suggestionLoading ? (
          <EmptyLine darkMode={darkMode} text="Click Refresh to load suggestions." />
        ) : null}
        {suggestionLoading ? (
          <EmptyLine darkMode={darkMode} text="Loading suggestions..." />
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
          <SuggestionListItem
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

export function PageMessage({
  darkMode,
  message,
}: {
  darkMode: boolean;
  message: string | null;
}) {
  if (!message) {
    return null;
  }

  return (
    <p
      className={`px-4 py-4 text-sm ${
        darkMode ? "text-amber-200" : "text-amber-700"
      }`}
    >
      {message}
    </p>
  );
}

export function EmptyLine({
  darkMode,
  text,
}: {
  darkMode: boolean;
  text: string;
}) {
  return (
    <p className={`px-4 py-4 text-sm ${mutedTextClass(darkMode)}`}>
      {text}
    </p>
  );
}
