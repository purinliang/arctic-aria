import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Button } from "./button";
import { panelColorClass } from "./color";
import { PopoverDismissLayer } from "./floating-popover";
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
          "absolute left-0 top-full z-30 mt-2 min-w-40 rounded-md border p-1 text-left shadow-xl",
          panelColorClass,
          className,
        )}
        role="menu"
        aria-label={label}
      >
        <div className="grid min-w-0 gap-1">{children}</div>
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
      className={cx("h-9 w-full justify-start px-3 text-left", className)}
      role="menuitem"
      {...props}
    >
      {children}
    </Button>
  );
}
