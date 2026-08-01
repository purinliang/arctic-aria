import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { Button } from "./button";
import { List } from "./list";
import { LoadingLine } from "./loading";
import {
  pagedListWindow,
  type PagedListWindow,
} from "./paged-list-utils";
import { controlGapClass, listRowPaddingClass, popoverPaddingClass } from "./spacing";
import { DescriptionText, SupportingText } from "./text";
import { cx } from "./utils";

export type PagedListNavigationMessages = {
  first: string;
  last: string;
  next: string;
  page: (pageNumber: number, totalPages: number) => string;
  previous: string;
};

export type PagedListMessages = PagedListNavigationMessages;

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
        <DescriptionText darkMode={darkMode} className={listRowPaddingClass}>
          {emptyText}
        </DescriptionText>
      ) : null}
      {!loading ? visibleItems.map((item) => renderItem(item)) : null}
      {showPagination ? (
        <PagedListNavigation
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
          onFirst={() =>
            setPageState({
              pageIndex: 0,
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
          onLast={() =>
            setPageState({
              pageIndex: windowState.totalPages - 1,
              resetKey: normalizedResetKey,
            })
          }
        />
      ) : null}
    </List>
  );
}

export function PagedListNavigation({
  ariaLabel,
  className,
  darkMode,
  messages,
  windowState,
  onFirst,
  onLast,
  onNext,
  onPrevious,
}: {
  ariaLabel: string;
  className?: string;
  darkMode: boolean;
  messages: PagedListNavigationMessages;
  windowState: PagedListWindow;
  onFirst: () => void;
  onLast: () => void;
  onNext: () => void;
  onPrevious: () => void;
}) {
  const previousDisabled = windowState.pageIndex === 0;
  const nextDisabled = windowState.pageIndex >= windowState.totalPages - 1;

  return (
    <nav
      aria-label={ariaLabel}
      className={cx(
        "flex items-center justify-center",
        controlGapClass,
        popoverPaddingClass,
        className,
      )}
    >
      <Button
        darkMode={darkMode}
        tone="ghost"
        size="icon"
        aria-label={messages.first}
        disabled={previousDisabled}
        icon={<ChevronsLeft size={14} aria-hidden="true" />}
        onClick={onFirst}
      />
      <Button
        darkMode={darkMode}
        tone="ghost"
        size="icon"
        aria-label={messages.previous}
        disabled={previousDisabled}
        icon={<ChevronLeft size={14} aria-hidden="true" />}
        onClick={onPrevious}
      />
      <SupportingText
        darkMode={darkMode}
        className="inline-flex h-[var(--aa-icon-button-size)] min-w-[5.5rem] items-center justify-center px-[var(--aa-space-tag-x)] text-center"
      >
        {messages.page(windowState.pageNumber, windowState.totalPages)}
      </SupportingText>
      <Button
        darkMode={darkMode}
        tone="ghost"
        size="icon"
        aria-label={messages.next}
        disabled={nextDisabled}
        icon={<ChevronRight size={14} aria-hidden="true" />}
        onClick={onNext}
      />
      <Button
        darkMode={darkMode}
        tone="ghost"
        size="icon"
        aria-label={messages.last}
        disabled={nextDisabled}
        icon={<ChevronsRight size={14} aria-hidden="true" />}
        onClick={onLast}
      />
    </nav>
  );
}
