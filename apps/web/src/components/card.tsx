import type { ReactNode } from "react";
import { headerSurfaceClass, mutedTextClass, surfaceClass } from "./color";
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
  meta,
  action,
  darkMode,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  meta?: ReactNode;
  action?: ReactNode;
  darkMode: boolean;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 rounded-t-md border-b px-4 py-3",
        headerSurfaceClass(darkMode),
        className,
      )}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {icon ? (
            <span className={mutedTextClass(darkMode)}>{icon}</span>
          ) : null}
          <h2 className="text-base font-semibold">{title}</h2>
        </div>
        {description ? (
          <p className={cx("mt-1 text-sm", mutedTextClass(darkMode))}>
            {description}
          </p>
        ) : null}
      </div>
      {action || meta ? (
        <div className="shrink-0 justify-self-end">
          {action ?? (
            <span className={`text-sm ${mutedTextClass(darkMode)}`}>
              {meta}
            </span>
          )}
        </div>
      ) : null}
    </div>
  );
}
