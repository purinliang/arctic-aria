import type { ButtonHTMLAttributes, ReactNode } from "react";
import {
  listDividerColorClass,
} from "./color";
import { Button } from "./button";
import {
  bodyStackClass,
  controlGapClass,
  inlineGapClass,
  listRowPaddingClass,
  textDescSupportGapClass,
  textTitleDescGapClass,
} from "./spacing";
import { Text, TextStack } from "./text";
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
        listDividerColorClass,
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
          ? cx(
              "grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start",
              inlineGapClass,
              listRowPaddingClass,
            )
          : listRowPaddingClass,
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
    <div
      className={cx("min-w-0 w-full", grow ? "flex-1" : undefined, className)}
    >
      {hasSlots ? (
        <>
          {title ? <div className="min-w-0">{title}</div> : null}
          {main ? (
            <div className={cx("min-w-0", title ? textTitleDescGapClass : undefined)}>
              {main}
            </div>
          ) : null}
          {support ? (
            <div
              className={cx(
                "min-w-0",
                title || main ? textDescSupportGapClass : undefined,
              )}
            >
              {support}
            </div>
          ) : null}
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
  size = "default",
  truncate = false,
  weight = "semibold",
}: {
  children: ReactNode;
  className?: string;
  size?: "default" | "compact";
  truncate?: boolean;
  weight?: "normal" | "semibold";
}) {
  return (
    <Text
      as="span"
      size={size === "compact" ? "md" : "lg"}
      weight={weight}
      tone="current"
      truncate={truncate}
      className={cx(
        "block min-w-0",
        className,
      )}
    >
      {children}
    </Text>
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
    <Text
      as="p"
      size="md"
      weight="normal"
      tone={listItemTextTone(tone)}
      className={className}
    >
      {children}
    </Text>
  );
}

export function ListItemSupportingText({
  children,
  className,
  tone = "default",
  truncate = true,
}: {
  children: ReactNode;
  className?: string;
  tone?: ListItemTextTone;
  truncate?: boolean;
}) {
  return (
    <Text
      as="span"
      size="sm"
      weight="normal"
      tone={listItemTextTone(tone)}
      truncate={truncate}
      className={className}
    >
      {children}
    </Text>
  );
}

export function ListItemTextStack({
  className,
  description,
  descriptionClassName,
  support,
  supportClassName,
  title,
  titleClassName,
  tone = "default",
  truncateTitle = false,
}: {
  className?: string;
  description?: ReactNode;
  descriptionClassName?: string;
  support?: ReactNode;
  supportClassName?: string;
  title?: ReactNode;
  titleClassName?: string;
  tone?: ListItemTextTone;
  truncateTitle?: boolean;
}) {
  return (
    <TextStack
      className={className}
      title={title}
      titleProps={{
        size: "lg",
        weight: "semibold",
        tone: "current",
        truncate: truncateTitle,
        className: titleClassName,
      }}
      description={description}
      descriptionProps={{
        size: "md",
        tone: listItemTextTone(tone),
        className: descriptionClassName,
      }}
      support={support}
      supportProps={{
        size: "sm",
        tone: listItemTextTone(tone),
        className: supportClassName,
      }}
    />
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
    <div
      className={cx(
        "flex shrink-0 items-center self-center",
        controlGapClass,
        className,
      )}
    >
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
    <div className={cx("flex justify-end", listRowPaddingClass)}>
      <Button darkMode={darkMode} tone="ghost" onClick={onClick}>
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
          "grid w-full items-start",
          inlineGapClass,
          leading ? "grid-cols-[auto_minmax(0,1fr)]" : "grid-cols-1",
        )}
      >
        {leading ? <div className="mt-1">{leading}</div> : null}
        <button
          className={cx(
            "grid w-full grid-cols-[minmax(0,1fr)_auto] items-start text-left",
            inlineGapClass,
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
        <div className={cx(bodyStackClass, "mt-[var(--aa-space-body-gap)]", bodyClassName)}>
          {children}
        </div>
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

function listItemTextTone(tone: ListItemTextTone) {
  return tone === "selected" ? "current" : "secondary";
}
