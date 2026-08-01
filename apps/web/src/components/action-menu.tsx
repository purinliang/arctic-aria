import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Button } from "./button";
import { panelColorClass } from "./color";
import { PopoverDismissLayer } from "./floating-popover";
import { controlGapClass, tagPaddingClass } from "./spacing";
import { cx } from "./utils";

export function ActionMenu({
  label,
  closeLabel,
  children,
  className,
  onDismiss,
}: {
  label: string;
  closeLabel: string;
  children: ReactNode;
  className?: string;
  onDismiss: () => void;
}) {
  return (
    <>
      <PopoverDismissLayer label={closeLabel} onDismiss={onDismiss} />
      <div
        className={cx(
          "absolute left-0 top-full z-30 mt-[var(--aa-space-control-gap)] min-w-40 rounded-md border text-left shadow-xl",
          tagPaddingClass,
          panelColorClass,
          className,
        )}
        role="menu"
        aria-label={label}
      >
        <div className={cx("grid min-w-0", controlGapClass)}>{children}</div>
      </div>
    </>
  );
}

export function ActionMenuItem({
  darkMode,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  darkMode: boolean;
}) {
  return (
    <Button
      darkMode={darkMode}
      tone="ghost"
      className={cx("h-9 w-full justify-start text-left", className)}
      role="menuitem"
      {...props}
    >
      {children}
    </Button>
  );
}
