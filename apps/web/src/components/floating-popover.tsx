import type { ReactNode } from "react";
import { panelColorClass } from "./color";
import {
  bodyStackClass,
  controlGapClass,
  dialogPaddingClass,
  inlineGapClass,
} from "./spacing";
import { Text } from "./text";
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
        "absolute right-0 top-full z-30 mt-[var(--aa-space-control-gap)] w-[min(22rem,calc(100vw-2rem))] rounded-md border text-left shadow-xl",
        dialogPaddingClass,
        panelColorClass,
        className,
      )}
    >
      <div
        className={cx(
          "mb-[var(--aa-space-body-gap)] flex items-center justify-between",
          inlineGapClass,
        )}
      >
        <Text as="h2" size="lg" weight="semibold" truncate>
          {title}
        </Text>
        {actions ? (
          <div className={cx("flex shrink-0 items-center", controlGapClass)}>
            {actions}
          </div>
        ) : null}
      </div>
      <div className={cx("min-w-0", bodyStackClass, bodyClassName)}>
        {children}
      </div>
    </div>
  );
}
