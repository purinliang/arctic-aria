import type { ButtonHTMLAttributes, ReactNode } from "react";
import { dividerClass } from "./color";
import { cx } from "./utils";

type ListItemTone = "default" | "success";

export function List({
  darkMode,
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
        dividerClass(darkMode),
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
          ? "flex items-start justify-between gap-3 px-4 py-4"
          : "px-4 py-4",
        itemToneClass(darkMode, tone, active),
        className,
      )}
    >
      {children}
    </article>
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
    return darkMode ? "bg-[var(--aa-grey-2)]" : "bg-[var(--aa-grey-13)]";
  }

  return darkMode
    ? "hover:bg-[var(--aa-grey-2)]"
    : "hover:bg-[var(--aa-grey-14)]";
}
