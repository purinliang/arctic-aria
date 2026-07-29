import type { ReactNode } from "react";
import { panelHeaderColorClass, secondaryTextColorClass, panelColorClass } from "./color";
import { cx } from "./utils";

export function Card({
  className,
  children,
}: {
  darkMode: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <article
      className={cx("rounded-md border", panelColorClass, className)}
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
        "grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 rounded-t-md border-b px-4 py-2",
        panelHeaderColorClass,
        className,
      )}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-[var(--aa-panel-header-icon-gap)]">
          {icon ? (
            <span className="inline-flex text-current">{icon}</span>
          ) : null}
          <h2 className="text-base font-semibold leading-5">{title}</h2>
        </div>
        {description ? (
          <p className={cx("mt-0.5 text-xs leading-4", secondaryTextColorClass)}>
            {description}
          </p>
        ) : null}
      </div>
      {action || meta ? (
        <div className="shrink-0 justify-self-end">
          {action ?? (
            <span className={`text-sm ${secondaryTextColorClass}`}>
              {meta}
            </span>
          )}
        </div>
      ) : null}
    </div>
  );
}
