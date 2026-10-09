import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useEffect, useRef } from "react";
import { panelColorClass } from "./color";
import { PopoverDismissLayer } from "./floating-popover";
import { menuFocusIndex } from "./action-menu-navigation";
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
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const menu = menuRef.current;
    const trigger = menu?.parentElement?.querySelector<HTMLElement>('[aria-haspopup="menu"]')
      ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    triggerRef.current = trigger;
    menu?.querySelector<HTMLElement>('[role="menuitem"]:not(:disabled)')?.focus();
    return () => {
      if (document.activeElement === document.body || menu?.contains(document.activeElement)) {
        trigger?.focus();
      }
    };
  }, []);
  return (
    <>
      <PopoverDismissLayer label={closeLabel} onDismiss={onDismiss} />
      <div
        ref={menuRef}
        className={cx(
          "absolute right-0 top-full z-30 mt-[var(--aa-space-menu-padding)] w-max min-w-32 max-w-[calc(100vw-2rem)] rounded-md border p-[var(--aa-space-menu-padding)] text-left shadow-lg",
          panelColorClass,
          className,
        )}
        role="menu"
        aria-label={label}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            onDismiss();
            return;
          }
          if (event.key === "Tab") {
            triggerRef.current?.focus();
            onDismiss();
            return;
          }
          const items = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)')];
          const index = menuFocusIndex(
            event.key,
            items.indexOf(document.activeElement as HTMLButtonElement),
            items.length,
          );
          if (index !== null) {
            event.preventDefault();
            items[index]?.focus();
          }
        }}
      >
        <div className="grid min-w-0">{children}</div>
      </div>
    </>
  );
}

export function ActionMenuItem({
  darkMode,
  className,
  children,
  destructive = false,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  darkMode: boolean;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      className={cx(
        "aa-action-menu-item inline-flex w-full cursor-pointer items-center rounded-sm border-0 bg-transparent px-[var(--aa-space-popover-x)] py-[var(--aa-space-list-row-y)] text-left text-[length:var(--aa-font-size-md)] font-[var(--aa-font-weight-normal)] leading-[var(--aa-line-height-md)] transition-colors focus:outline-none disabled:cursor-not-allowed disabled:text-[var(--aa-secondary-button-disabled-text)]",
        destructive
          ? cx(darkMode ? "text-red-300" : "text-red-700", "enabled:hover:bg-red-500/10 enabled:focus:bg-red-500/10")
          : "text-[var(--aa-primary-text)] enabled:hover:bg-[var(--aa-secondary-button-hover-bg)] enabled:focus:bg-[var(--aa-secondary-button-hover-bg)]",
        className,
      )}
      role="menuitem"
      {...props}
    >
      {children}
    </button>
  );
}
