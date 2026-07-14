import type { ReactNode } from "react";
import { mutedTextClass, surfaceClass } from "./color";
import { cx } from "./utils";

export function Card({
  darkMode,
  className,
  children,
}: {
  darkMode: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <article
      className={cx("rounded-md border", surfaceClass(darkMode), className)}
    >
      {children}
    </article>
  );
}

export function CardHeader({
  icon,
  title,
  description,
  action,
  darkMode,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  darkMode: boolean;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "flex flex-col gap-3 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between",
        darkMode ? "border-neutral-800" : "border-slate-200",
        className,
      )}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-base font-semibold">{title}</h2>
        </div>
        {description ? (
          <p className={cx("mt-1 text-sm", mutedTextClass(darkMode))}>
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
