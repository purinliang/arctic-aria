import type { Key, ReactNode } from "react";
import { Fragment, useMemo, useState } from "react";
import {
  PagedListNavigation,
  type PagedListNavigationMessages,
} from "./paged-list";
import { pagedListWindow } from "./paged-list-utils";
import { DescriptionText, SectionTitle, SupportingText } from "./text";
import { cx } from "./utils";

export const managerListPageSize = 6;

export type ManagerListMessages = PagedListNavigationMessages & {
  ariaLabel: string;
};

export function ManagerDialogSection({
  action,
  children,
  className,
  darkMode,
  description,
  title,
}: {
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  darkMode: boolean;
  description?: string;
  title: string;
}) {
  return (
    <section className={cx("grid gap-[var(--aa-field-label-gap)]", className)}>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          <SectionTitle className="flex min-h-[var(--aa-button-height-sm)] items-center">
            {title}
          </SectionTitle>
          {description ? (
            <DescriptionText darkMode={darkMode} className="mt-0.5">
              {description}
            </DescriptionText>
          ) : null}
        </div>
        {action ? <div className="shrink-0 justify-self-end">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}

export function ManagerList<Item>({
  className,
  darkMode,
  emptyText,
  getItemKey,
  items,
  messages,
  pageSize = managerListPageSize,
  renderItem,
  resetKey,
}: {
  className?: string;
  darkMode: boolean;
  emptyText: string;
  getItemKey: (item: Item) => Key;
  items: readonly Item[];
  messages: ManagerListMessages;
  pageSize?: number;
  renderItem: (item: Item) => ReactNode;
  resetKey?: string;
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
  const showPagination = items.length > windowState.pageSize;

  return (
    <div
      className={cx(
        "overflow-hidden rounded-md border border-[var(--aa-text-input-border)] bg-[var(--aa-text-input-bg)]",
        "divide-y divide-[var(--aa-list-divider-border)]",
        className,
      )}
    >
      {items.length === 0 ? (
        <DescriptionText darkMode={darkMode} className="px-3 py-3">
          {emptyText}
        </DescriptionText>
      ) : null}
      {visibleItems.map((item) => (
        <Fragment key={getItemKey(item)}>{renderItem(item)}</Fragment>
      ))}
      {showPagination ? (
        <PagedListNavigation
          ariaLabel={messages.ariaLabel}
          darkMode={darkMode}
          messages={messages}
          windowState={windowState}
          className="bg-[var(--aa-panel-bg)] px-3 py-2"
          onFirst={() =>
            setPageState({
              pageIndex: 0,
              resetKey: normalizedResetKey,
            })
          }
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
          onLast={() =>
            setPageState({
              pageIndex: windowState.totalPages - 1,
              resetKey: normalizedResetKey,
            })
          }
        />
      ) : null}
    </div>
  );
}

export function ManagerListRow({
  action,
  className,
  darkMode,
  description,
  descriptionClassName,
  leading,
  support,
  supportClassName,
  title,
}: {
  action?: ReactNode;
  className?: string;
  darkMode: boolean;
  description?: ReactNode;
  descriptionClassName?: string;
  leading?: ReactNode;
  support?: ReactNode;
  supportClassName?: string;
  title: ReactNode;
}) {
  return (
    <article
      className={cx(
        "grid items-start gap-3 px-3 py-2.5",
        action ? "grid-cols-[minmax(0,1fr)_auto]" : "grid-cols-1",
        className,
      )}
    >
      <div
        className={cx(
          "min-w-0",
          leading ? "grid grid-cols-[auto_minmax(0,1fr)] gap-2" : undefined,
        )}
      >
        {leading ? <span className="mt-0.5 shrink-0">{leading}</span> : null}
        <div className="min-w-0">
          <h4 className="truncate text-sm font-semibold leading-5">{title}</h4>
          {description ? (
            <DescriptionText
              darkMode={darkMode}
              className={cx("min-w-0", descriptionClassName)}
            >
              {description}
            </DescriptionText>
          ) : null}
          {support ? (
            <SupportingText
              darkMode={darkMode}
              className={cx("block min-w-0", supportClassName)}
            >
              {support}
            </SupportingText>
          ) : null}
        </div>
      </div>
      {action ? (
        <div className="flex shrink-0 items-center gap-2 self-center justify-self-end">
          {action}
        </div>
      ) : null}
    </article>
  );
}
