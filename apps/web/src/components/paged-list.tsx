import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { Button } from "./button";
import { List } from "./list";
import { LoadingLine } from "./loading";
import {
  pagedListWindow,
  type PagedListWindow,
} from "./paged-list-utils";
import { DescriptionText, SupportingText } from "./text";

export type PagedListMessages = {
  next: string;
  previous: string;
  status: (window: PagedListWindow) => string;
};

export function PagedList<Item>({
  ariaLabel,
  className,
  darkMode,
  emptyText,
  items,
  loading,
  loadingText,
  messages,
  pageSize,
  resetKey,
  renderItem,
}: {
  ariaLabel: string;
  className?: string;
  darkMode: boolean;
  emptyText: string;
  items: readonly Item[];
  loading: boolean;
  loadingText: string;
  messages: PagedListMessages;
  pageSize: number;
  resetKey?: string;
  renderItem: (item: Item) => ReactNode;
}) {
  const normalizedResetKey = `${resetKey ?? "default"}:${Math.max(
    1,
    Math.floor(pageSize),
  )}`;
  const [pageState, setPageState] = useState({
    pageIndex: 0,
    resetKey: normalizedResetKey,
  });
  const requestedPageIndex =
    pageState.resetKey === normalizedResetKey ? pageState.pageIndex : 0;
  const windowState = pagedListWindow({
    itemCount: items.length,
    pageIndex: requestedPageIndex,
    pageSize,
  });
  const visibleItems = useMemo(
    () => items.slice(windowState.startIndex, windowState.endIndex),
    [items, windowState.endIndex, windowState.startIndex],
  );
  const showPagination = !loading && items.length > windowState.pageSize;

  return (
    <List darkMode={darkMode} className={className}>
      {loading ? (
        <LoadingLine darkMode={darkMode} text={loadingText} />
      ) : null}
      {!loading && items.length === 0 ? (
        <DescriptionText darkMode={darkMode} className="px-4 py-4">
          {emptyText}
        </DescriptionText>
      ) : null}
      {!loading ? visibleItems.map((item) => renderItem(item)) : null}
      {showPagination ? (
        <PagedListFooter
          ariaLabel={ariaLabel}
          darkMode={darkMode}
          messages={messages}
          windowState={windowState}
          onPrevious={() =>
            setPageState({
              pageIndex: Math.max(0, windowState.pageIndex - 1),
              resetKey: normalizedResetKey,
            })
          }
          onNext={() =>
            setPageState({
              pageIndex: Math.min(
                windowState.totalPages - 1,
                windowState.pageIndex + 1,
              ),
              resetKey: normalizedResetKey,
            })
          }
        />
      ) : null}
    </List>
  );
}

function PagedListFooter({
  ariaLabel,
  darkMode,
  messages,
  windowState,
  onNext,
  onPrevious,
}: {
  ariaLabel: string;
  darkMode: boolean;
  messages: PagedListMessages;
  windowState: PagedListWindow;
  onNext: () => void;
  onPrevious: () => void;
}) {
  const previousDisabled = windowState.pageIndex === 0;
  const nextDisabled = windowState.pageIndex >= windowState.totalPages - 1;

  return (
    <nav
      aria-label={ariaLabel}
      className="grid gap-2 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
    >
      <SupportingText darkMode={darkMode} className="block min-w-0">
        {messages.status(windowState)}
      </SupportingText>
      <div className="flex min-w-0 items-center justify-end gap-2">
        <Button
          darkMode={darkMode}
          disabled={previousDisabled}
          icon={<ChevronLeft size={14} aria-hidden="true" />}
          onClick={onPrevious}
        >
          {messages.previous}
        </Button>
        <Button
          darkMode={darkMode}
          disabled={nextDisabled}
          onClick={onNext}
        >
          <span>{messages.next}</span>
          <ChevronRight size={14} aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
}
