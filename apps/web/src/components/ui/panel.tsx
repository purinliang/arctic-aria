import type { ReactNode } from "react";
import { surfaceClass } from "./color";
import { cx } from "./utils";

export function Panel({
  darkMode,
  className,
  children,
}: {
  darkMode: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cx("rounded-md border", surfaceClass(darkMode), className)}>
      {children}
    </section>
  );
}
