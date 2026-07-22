import type { ReactNode } from "react";
import { panelColorClass } from "./color";
import { cx } from "./utils";

export function PopoverDismissLayer({
  label,
  onDismiss,
}: {
  label: string;
  onDismiss: () => void;
}) {
  return (
    <button
      className="fixed inset-0 z-20 cursor-default"
      type="button"
      aria-label={label}
      onClick={onDismiss}
    />
  );
}

export function FloatingPopover({
  title,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <div
      className={cx(
        "absolute right-0 top-full z-30 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-md border p-4 text-left shadow-xl",
        panelColorClass,
        className,
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="truncate text-base font-semibold">{title}</h2>
        {actions ? (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        ) : null}
      </div>
      <div className={cx("grid min-w-0 gap-3", bodyClassName)}>
        {children}
      </div>
    </div>
  );
}
