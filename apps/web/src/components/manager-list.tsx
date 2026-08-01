import type { Key, ReactNode } from "react";
import { Fragment, useMemo, useState } from "react";
import {
  PagedListNavigation,
  type PagedListNavigationMessages,
} from "./paged-list";
import { pagedListWindow } from "./paged-list-utils";
import {
  compactListRowPaddingClass,
  controlGapClass,
  iconGapClass,
  inlineGapClass,
} from "./spacing";
import { DescriptionText, TextStack } from "./text";
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
  void darkMode;

  return (
    <section
      className={cx(
        "grid gap-[var(--aa-space-text-title-desc)]",
        className,
      )}
    >
      <div
        className={cx(
          "grid grid-cols-[minmax(0,1fr)_auto] items-start",
          inlineGapClass,
        )}
      >
        <TextStack
          title={title}
          titleProps={{
            size: "lg",
            className: "flex min-h-[var(--aa-button-height-sm)] items-center",
          }}
          description={description}
          descriptionProps={{ size: "md" }}
        />
        {action ? (
          <div className="shrink-0 justify-self-end">{action}</div>
        ) : null}
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
        <DescriptionText darkMode={darkMode} className={compactListRowPaddingClass}>
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
          className="bg-[var(--aa-panel-bg)]"
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
  void darkMode;

  return (
    <article
      className={cx(
        "grid items-start",
        inlineGapClass,
        compactListRowPaddingClass,
        action ? "grid-cols-[minmax(0,1fr)_auto]" : "grid-cols-1",
        className,
      )}
    >
      <div
        className={cx(
          "min-w-0",
          leading
            ? cx("grid grid-cols-[auto_minmax(0,1fr)]", iconGapClass)
            : undefined,
        )}
      >
        {leading ? <span className="mt-0.5 shrink-0">{leading}</span> : null}
        <TextStack
          title={title}
          titleProps={{
            as: "h4",
            size: "md",
            truncate: true,
          }}
          description={description}
          descriptionProps={{
            className: cx("min-w-0", descriptionClassName),
          }}
          support={support}
          supportProps={{
            truncate: true,
            className: cx("block min-w-0", supportClassName),
          }}
        />
      </div>
      {action ? (
        <div
          className={cx(
            "flex shrink-0 items-center self-center justify-self-end",
            controlGapClass,
          )}
        >
          {action}
        </div>
      ) : null}
    </article>
  );
}
