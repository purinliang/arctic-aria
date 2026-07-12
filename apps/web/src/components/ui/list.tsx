import type { ReactNode } from "react";
import { dividerClass } from "./color";
import { cx } from "./utils";

export function List({
  darkMode,
  className,
  children,
}: {
  darkMode: boolean;
  className?: string;
  children: ReactNode;
}) {
  return <div className={cx(dividerClass(darkMode), className)}>{children}</div>;
}

export function ListItem({
  darkMode,
  selected = false,
  expanded = false,
  layout = "row",
  className,
  children,
}: {
  darkMode: boolean;
  selected?: boolean;
  expanded?: boolean;
  layout?: "row" | "block";
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
        !active && (darkMode ? "hover:bg-neutral-950" : "hover:bg-slate-50"),
        active && (darkMode ? "bg-white/10" : "bg-slate-100"),
        className,
      )}
    >
      {children}
    </article>
  );
}
