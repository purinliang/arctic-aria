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
  className,
  children,
}: {
  darkMode: boolean;
  selected?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <article
      className={cx(
        "flex items-start justify-between gap-3 px-4 py-4",
        darkMode ? "hover:bg-neutral-950" : "hover:bg-slate-50",
        selected && (darkMode ? "bg-white/10" : "bg-slate-100"),
        className,
      )}
    >
      {children}
    </article>
  );
}
