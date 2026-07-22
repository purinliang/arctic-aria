import type { ButtonHTMLAttributes, ReactNode } from "react";
import {
  secondaryButtonDividerColorClass,
  secondaryTextColorClass,
} from "./color";
import { Button } from "./button";
import { cx } from "./utils";

type ListItemTone = "default" | "success";
type ListItemTextTone = "default" | "selected";

export function List({
  className,
  children,
}: {
  darkMode: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cx(
        "overflow-hidden rounded-b-md",
        secondaryButtonDividerColorClass,
        className,
      )}
    >
      {children}
    </div>
  );
}

export function ListItem({
  darkMode,
  selected = false,
  expanded = false,
  layout = "row",
  tone = "default",
  className,
  children,
}: {
  darkMode: boolean;
  selected?: boolean;
  expanded?: boolean;
  layout?: "row" | "block";
  tone?: ListItemTone;
  className?: string;
  children: ReactNode;
}) {
  const active = selected || expanded;

  return (
    <article
      className={cx(
        layout === "row"
          ? "flex items-start justify-between gap-3 px-4 py-2 first-of-type:pt-2 last-of-type:pb-2"
          : "px-4 py-2 first-of-type:pt-2 last-of-type:pb-2",
        itemToneClass(darkMode, tone, active),
        className,
      )}
    >
      {children}
    </article>
  );
}

export function ListItemContent({
  children,
  className,
  grow = true,
  main,
  support,
  title,
}: {
  children?: ReactNode;
  className?: string;
  grow?: boolean;
  main?: ReactNode;
  support?: ReactNode;
  title?: ReactNode;
}) {
  const hasSlots = Boolean(title || main || support);

  return (
    <div className={cx("min-w-0", grow ? "flex-1" : undefined, className)}>
      {hasSlots ? (
        <>
          {title ? <div className="min-w-0">{title}</div> : null}
          {main ? <div className="min-w-0">{main}</div> : null}
          {support ? <div className="min-w-0">{support}</div> : null}
        </>
      ) : (
        children
      )}
    </div>
  );
}

export function ListItemTitle({
  children,
  className,
  truncate = false,
}: {
  children: ReactNode;
  className?: string;
  truncate?: boolean;
}) {
  return (
    <span
      className={cx(
        "block min-w-0 text-base font-semibold leading-6",
        truncate ? "truncate" : undefined,
        className,
      )}
    >
      {children}
    </span>
  );
}

export function ListItemDescription({
  children,
  className,
  tone = "default",
}: {
  children: ReactNode;
  className?: string;
  tone?: ListItemTextTone;
}) {
  return (
    <p className={cx("text-sm leading-5", listItemTextToneClass(tone), className)}>
      {children}
    </p>
  );
}

export function ListItemSupportingText({
  children,
  className,
  tone = "default",
}: {
  children: ReactNode;
  className?: string;
  tone?: ListItemTextTone;
}) {
  return (
    <span className={cx("text-xs leading-5", listItemTextToneClass(tone), className)}>
      {children}
    </span>
  );
}

export function ListItemTitleButton({
  children,
  className,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick: ButtonHTMLAttributes<HTMLButtonElement>["onClick"];
}) {
  return (
    <button
      type="button"
      className={cx(
        "block max-w-full cursor-pointer truncate text-left underline",
        "decoration-[var(--aa-secondary-text)] underline-offset-2 transition",
        "hover:decoration-[var(--aa-primary-text)]",
        "focus-visible:outline-none focus-visible:decoration-[var(--aa-primary-text)]",
        className,
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function ListItemActions({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("my-2 flex shrink-0 items-center gap-2", className)}>
      {children}
    </div>
  );
}

export function ListFooterAction({
  darkMode,
  label,
  onClick,
}: {
  darkMode: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <div className="flex justify-end px-4 py-3">
      <Button darkMode={darkMode} tone="ghost" size="sm" onClick={onClick}>
        {label}
      </Button>
    </div>
  );
}

export function ExpandableListItem({
  darkMode,
  expanded,
  disabled = false,
  selected = false,
  tone = "default",
  leading,
  header,
  children,
  className,
  headerClassName,
  bodyClassName,
  onToggle,
}: {
  darkMode: boolean;
  expanded: boolean;
  disabled?: boolean;
  selected?: boolean;
  tone?: ListItemTone;
  leading?: ReactNode;
  header: ReactNode;
  children?: ReactNode;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  onToggle: ButtonHTMLAttributes<HTMLButtonElement>["onClick"];
}) {
  return (
    <ListItem
      darkMode={darkMode}
      expanded={expanded}
      selected={selected}
      tone={tone}
      layout="block"
      className={cx("transition", className)}
    >
      <div
        className={cx(
          "grid w-full items-start gap-3",
          leading ? "grid-cols-[auto_minmax(0,1fr)]" : "grid-cols-1",
        )}
      >
        {leading ? <div className="mt-1">{leading}</div> : null}
        <button
          className={cx(
            "grid w-full grid-cols-[minmax(0,1fr)_auto] items-start gap-3 text-left",
            headerClassName,
          )}
          type="button"
          aria-expanded={expanded}
          disabled={disabled}
          onClick={onToggle}
        >
          {header}
        </button>
      </div>
      {expanded && children ? (
        <div className={cx("mt-3", bodyClassName)}>{children}</div>
      ) : null}
    </ListItem>
  );
}

function itemToneClass(
  darkMode: boolean,
  tone: ListItemTone,
  active: boolean,
) {
  if (tone === "success") {
    return darkMode ? "bg-emerald-500/5" : "bg-emerald-50/60";
  }

  if (active) {
    return "bg-[var(--aa-primary-button-bg)] text-[var(--aa-primary-button-text)] hover:bg-[var(--aa-primary-button-hover-bg)] hover:text-[var(--aa-primary-button-hover-text)]";
  }

  return "hover:bg-[var(--aa-panel-hover-bg)] hover:text-[var(--aa-primary-text)]";
}

function listItemTextToneClass(tone: ListItemTextTone) {
  return tone === "selected"
    ? "text-[var(--aa-primary-button-text)]"
    : secondaryTextColorClass;
}
