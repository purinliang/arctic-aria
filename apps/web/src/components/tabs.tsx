import type { ReactNode } from "react";
import { Button } from "./button";
import { panelHoverContainerColorClass } from "./color";
import { cx } from "./utils";

export type TabOption = {
  value: string;
  label: ReactNode;
  disabled?: boolean;
  ariaBusy?: boolean;
};

export function Tabs({
  ariaLabel,
  darkMode,
  options,
  value,
  onChange,
  fill = false,
  className,
}: {
  ariaLabel: string;
  darkMode: boolean;
  options: readonly TabOption[];
  value: string;
  onChange: (value: string) => void;
  fill?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "inline-flex max-w-full gap-[var(--aa-space-tab-list-gap)] rounded-md border p-[var(--aa-space-tab-list-padding)]",
        panelHoverContainerColorClass,
        fill ? "w-full" : undefined,
        className,
      )}
      role="tablist"
      aria-label={ariaLabel}
    >
      {options.map((option) => (
        <Button
          key={option.value}
          darkMode={darkMode}
          tone="ghost"
          active={option.value === value}
          className={cx("border-0 shadow-none", fill ? "flex-1" : undefined)}
          role="tab"
          aria-selected={option.value === value}
          aria-busy={option.ariaBusy || undefined}
          disabled={option.disabled}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}
