import type { ReactNode } from "react";
import { panelColorClass } from "./color";
import { cx } from "./utils";

export function Panel({
  className,
  children,
}: {
  darkMode: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cx("rounded-md border", panelColorClass, className)}>
      {children}
    </section>
  );
}
