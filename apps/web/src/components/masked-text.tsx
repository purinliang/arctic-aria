import type { ReactNode } from "react";
import { cx } from "./utils";

export function MaskedText({
  className,
  hidden,
  label,
  mask = "************",
  trailing,
  value,
}: {
  className?: string;
  hidden: boolean;
  label: string;
  mask?: string;
  trailing?: ReactNode;
  value: string;
}) {
  return (
    <span
      aria-label={label}
      className={cx(
        "inline-flex h-9 min-w-0 max-w-full items-center gap-2 rounded-md border px-3 text-sm",
        "border-[var(--aa-secondary-button-border)] bg-[var(--aa-secondary-button-bg)] text-[var(--aa-secondary-button-text)]",
        className,
      )}
      title={hidden ? undefined : value}
    >
      <span className="min-w-0 truncate font-mono tracking-[0.04em]">
        {hidden ? mask : value}
      </span>
      {trailing ? <span className="-mr-2 shrink-0">{trailing}</span> : null}
    </span>
  );
}
